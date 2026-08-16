import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, R2_BUCKET } from '@/lib/r2Client';
import { admin } from '@/lib/supabaseClients';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filePathParam = url.searchParams.get('file'); // e.g., "pdfs/1771434828132-bdkgq8.pdf"
    const fileNameParam = url.searchParams.get('name') || 'download.pdf';
    const productId = url.searchParams.get('productId'); // product ID for counting

    if (!filePathParam) {
      return new Response('File not specified', { status: 400 });
    }

    // Increment download count (Supabase DB only — not storage)
    if (productId) {
      try {
        const { data: product } = await admin
          .from('products')
          .select('downloads')
          .eq('id', productId)
          .single();

        if (product !== null) {
          await admin
            .from('products')
            .update({ downloads: (product.downloads || 0) + 1 })
            .eq('id', productId);
        }
      } catch (err) {
        console.error('Failed to increment download count:', err);
      }
    }

    // Fetch file from R2
    const r2Response = await getR2Client().send(new GetObjectCommand({
      Bucket: R2_BUCKET(),
      Key:    filePathParam,
    }));

    const chunks = [];
    for await (const chunk of r2Response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':        r2Response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileNameParam}"`,
      },
    });
  } catch (err) {
    console.error('Download route error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
