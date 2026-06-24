import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseClients';

export const runtime = 'nodejs';

// POST /api/views  body: { productId }
export async function POST(request) {
  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { data: product } = await admin
      .from('products')
      .select('views')
      .eq('id', productId)
      .single();

    if (product !== null) {
      await admin
        .from('products')
        .update({ views: (product.views || 0) + 1 })
        .eq('id', productId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to increment view count:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
