import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, R2_BUCKET } from '@/lib/r2Client';
import { DOWNLOAD_MIME } from '@/lib/upload';
import { admin } from '@/lib/supabaseClients';
import { authorizeDownload } from '@/lib/downloadAccess';

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

    // Only files this site stores: pdfs/<name> or images/<name>
    if (!/^(pdfs|images)\/[^/\\]+$/.test(filePathParam) || filePathParam.includes('..')) {
      return new Response('Invalid file', { status: 400 });
    }

    // Paid files need proof of a paid order (order number + token from the order); free files do not.
    const access = await authorizeDownload({
      key: filePathParam,
      orderNumber: url.searchParams.get('order'),
      token: url.searchParams.get('pt'),
    });
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    // Increment download count (Supabase DB only — not storage). Only for free-file downloads: purchases are
    // counted when the order is placed.
    if (productId && access.productId && productId === access.productId && !url.searchParams.get('order')) {
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

    // Hand the browser a short-lived signed R2 link instead of proxying the bytes through this function:
    // no 4.5MB response cap, no function time limit, no memory use, works for 50MB files.
    const ext = filePathParam.split('.').pop()?.toLowerCase();
    const asciiName = fileNameParam.replace(/[^A-Za-z0-9._ -]+/g, '_');
    const signedUrl = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: R2_BUCKET(),
        Key:    filePathParam,
        ResponseContentDisposition: `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileNameParam)}`,
        ...(DOWNLOAD_MIME[ext] ? { ResponseContentType: DOWNLOAD_MIME[ext] } : {}),
      }),
      { expiresIn: 300 }
    );

    if (url.searchParams.get('format') === 'json') {
      return NextResponse.json({ success: true, url: signedUrl });
    }
    return NextResponse.redirect(signedUrl, 302);
  } catch (err) {
    console.error('Download route error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
