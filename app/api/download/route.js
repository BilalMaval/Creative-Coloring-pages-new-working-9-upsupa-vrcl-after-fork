
import { supabase } from '@/lib/upload';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filePathParam = url.searchParams.get('file'); // e.g., "pdfs/1771434828132-bdkgq8.pdf"
    const fileNameParam = url.searchParams.get('name') || 'download.pdf';
    const productId = url.searchParams.get('productId'); // product ID for counting

    if (!filePathParam) {
      return new Response('File not specified', { status: 400 });
    }

    // Increment download count via Supabase REST (Prisma port is blocked on this machine)
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

    // Download file from Supabase
    const { data, error } = await supabase.storage.from('uploads').download(filePathParam);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return new Response('Download failed', { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': data.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileNameParam}"`,
      },
    });
  } catch (err) {
    console.error('Download route error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
