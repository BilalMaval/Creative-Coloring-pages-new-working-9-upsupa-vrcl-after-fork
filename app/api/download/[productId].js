import { supabase } from '@/lib/upload';

export const runtime = 'nodejs'; // Required for Node APIs

export async function GET(request, { params }) {
  const { productId } = params;

  try {
    // Fetch product info from your database
    // Replace this with your actual DB query
    const product = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getProduct?id=${productId}`)
      .then(res => res.json());

    if (!product || !product.pdfPath) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }

    // Extract the path inside the bucket
    // e.g., pdfs/1771434828132-bdkgq8.pdf
    const urlParts = product.pdfPath.split('/uploads/')[1];
    if (!urlParts) {
      return new Response(JSON.stringify({ error: 'Invalid file path' }), { status: 400 });
    }

    // Generate signed URL valid for 60 seconds
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(urlParts, 60);

    if (error || !data.signedUrl) {
      console.error('Supabase signed URL error:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate download link' }), { status: 500 });
    }

    // Redirect the browser to signed URL so it downloads automatically
    return Response.redirect(data.signedUrl, 307);

  } catch (err) {
    console.error('Download API error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
