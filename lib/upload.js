import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from './r2Client';
import { THUMB_WIDTH } from './images';

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

    // Small WebP thumbnail for grids/cards (thumbs/<same-name>.webp). Failure never blocks the upload:
    // ThumbImage falls back to the original, and scripts/generate-thumbs.mjs can backfill.
    if (folder === 'images') {
      try {
        const thumb = await sharp(buffer)
          .rotate()
          .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
          .webp({ quality: 72, effort: 4 })
          .toBuffer();
        await getR2Client().send(new PutObjectCommand({
          Bucket:       R2_BUCKET(),
          Key:          `thumbs/${uniqueName.replace(/\.[^.]+$/, '')}.webp`,
          Body:         thumb,
          ContentType:  'image/webp',
          CacheControl: CACHE_CONTROL,
        }));
      } catch (thumbErr) {
        console.error('Thumbnail generation failed (original uploaded):', thumbErr);
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

/**
 * Downloadable file validation — allows PDF, ZIP, EPUB (Edge + Vercel safe)
 */
export function validatePdfFile(fileName, mimeType, size) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedExtensions = ['pdf', 'zip', 'epub'];
  const ext = fileName?.split('.').pop()?.toLowerCase();

  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Invalid file type. Allowed: PDF, ZIP, EPUB');
  }

  if (size > maxSize) {
    throw new Error('File too large. Max size: 50MB');
  }

  return true;
}
