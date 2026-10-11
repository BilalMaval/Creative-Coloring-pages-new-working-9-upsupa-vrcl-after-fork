import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2Client';
import { validateDownloadFile } from '@/lib/upload';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// Admin only. Returns a short-lived signed URL so the browser can upload a downloadable file (up to 50MB)
// straight to R2, bypassing Vercel's 4.5MB request limit. The browser must PUT with the returned Content-Type.
export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { fileName, size } = await request.json();
    const { ext, mimeType } = validateDownloadFile(String(fileName || ''), Number(size));

    const key = `pdfs/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({ Bucket: R2_BUCKET(), Key: key, ContentType: mimeType }),
      { expiresIn: 900 }
    );

    return NextResponse.json({ success: true, uploadUrl, contentType: mimeType, key, url: `${R2_PUBLIC_URL()}/${key}` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Could not prepare upload' }, { status: 400 });
  }
}
