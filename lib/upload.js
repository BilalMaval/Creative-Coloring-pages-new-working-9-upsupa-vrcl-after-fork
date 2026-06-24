import { createClient } from '@supabase/supabase-js';

// Server-safe Supabase client for API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a file to Supabase Storage
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

    const { error } = await supabase.storage
      .from('uploads')
      .upload(path, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload server error:', err);
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
