import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from './r2Client';

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
    }));

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
 * Robust PDF validation (Edge + Vercel safe)
 */
export function validatePdfFile(fileName, mimeType, size) {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const ext = fileName?.split('.').pop()?.toLowerCase();

  if (ext !== 'pdf') {
    throw new Error('Invalid file type. Must be PDF');
  }

  if (size > maxSize) {
    throw new Error('PDF too large. Max size: 20MB');
  }

  return true;
}
