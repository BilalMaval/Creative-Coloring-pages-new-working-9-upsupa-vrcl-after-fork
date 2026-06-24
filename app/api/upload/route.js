import { NextResponse } from 'next/server';
import { uploadFile, validateImageFile, validatePdfFile } from '@/lib/upload';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'image' or 'pdf'

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Extract proper file values
    const fileName = file.name;
    const mimeType = file.type;
    const fileSize = file.size;

    // ✅ Validate correctly
    if (type === 'image') {
      validateImageFile(fileName, mimeType, fileSize);
    } else if (type === 'pdf') {
      validatePdfFile(fileName, mimeType, fileSize);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const folder = type === 'pdf' ? 'pdfs' : 'images';

    // ✅ Convert File → Buffer (required for Supabase)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Upload properly
    const url = await uploadFile(buffer, folder, fileName, mimeType);

    return NextResponse.json({ success: true, url });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
