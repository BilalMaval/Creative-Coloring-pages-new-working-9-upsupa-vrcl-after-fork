import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from './r2Client';
import { IMAGE_VARIANTS } from './images';

// Filenames are unique (timestamp + random), so uploaded objects can be cached forever.
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Upload a file to Cloudflare R2.
 * Returns a fully-qualified public URL using R2_PUBLIC_URL.
 */
export async function uploadFile(
  buffer,
  folder = '',
  fileName = 'file.bin',
  mimeType = 'application/octet-stream'
) {
  try {
    if (!buffer) throw new Error('Buffer is required for upload');

    const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${ext}`;

    const path = folder ? `${folder}/${uniqueName}` : uniqueName;

    await getR2Client().send(new PutObjectCommand({
      Bucket:      R2_BUCKET(),
      Key:         path,
      Body:        buffer,
      ContentType: mimeType || 'application/octet-stream',
      CacheControl: CACHE_CONTROL,
    }));

    // Resized WebP variants (thumbs/medium/tiny). Failure never blocks the upload:
    // ThumbImage falls back to the original, and scripts/generate-thumbs.mjs can backfill.
    if (folder === 'images') {
      const baseName = uniqueName.replace(/\.[^.]+$/, '');
      for (const v of IMAGE_VARIANTS) {
        try {
          const out = await sharp(buffer)
            .rotate()
            .resize({ width: v.width, withoutEnlargement: true })
            .webp({ quality: v.quality, effort: 4 })
            .toBuffer();
          await getR2Client().send(new PutObjectCommand({
            Bucket:       R2_BUCKET(),
            Key:          `${v.prefix}/${baseName}.webp`,
            Body:         out,
            ContentType:  'image/webp',
            CacheControl: CACHE_CONTROL,
          }));
        } catch (variantErr) {
          console.error(`${v.name} variant generation failed (original uploaded):`, variantErr);
        }
      }
    }

    return `${R2_PUBLIC_URL()}/${path}`;
  } catch (err) {
    console.error('R2 upload error:', err);
    throw err;
  }
}

/**
 * Robust image validation (Edge + Vercel safe)
 */
export function validateImageFile(fileName, mimeType, size) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  const ext = fileName?.split('.').pop()?.toLowerCase();

  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Invalid image type. Allowed: JPG, PNG, WEBP');
  }

  if (size > maxSize) {
    throw new Error('Image too large. Max size: 5MB');
  }

  return true;
}

// Downloadable files (what customers receive). Uploaded straight from the browser to R2 with a signed URL,
// so the limit is not bound by Vercel's 4.5 MB request cap.
export const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024; // 50MB
export const DOWNLOAD_MIME = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  epub: 'application/epub+zip',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export function validateDownloadFile(fileName, size) {
  const ext = fileName?.split('.').pop()?.toLowerCase();

  if (!ext || !DOWNLOAD_MIME[ext]) {
    throw new Error('Invalid file type. Allowed: PDF, ZIP, EPUB, JPG, PNG');
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('File is empty');
  }
  if (size > MAX_DOWNLOAD_BYTES) {
    throw new Error('File too large. Max size: 50MB');
  }

  return { ext, mimeType: DOWNLOAD_MIME[ext] };
}
