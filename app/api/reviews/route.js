import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase, admin } from '@/lib/supabaseClients';

// Map snake_case DB row → camelCase for the frontend
function mapReview(row) {
  return {
    id:          row.id,
    productId:   row.product_id,
    rating:      row.rating,
    title:       row.title,
    comment:     row.comment,
    authorName:  row.author_name,
    authorEmail: row.author_email,
    isVerified:  row.is_verified,
    isApproved:  row.is_approved,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// GET /api/reviews?productId=xxx  OR  ?slug=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId   = searchParams.get('productId');
    const productSlug = searchParams.get('slug');

    let resolvedProductId = productId;

    // Resolve slug → productId via REST
    if (!resolvedProductId && productSlug) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .limit(1);

      if (error || !products?.length) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      resolvedProductId = products[0].id;
    }

    if (!resolvedProductId) {
      return NextResponse.json({ success: false, error: 'productId or slug required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', resolvedProductId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = (data || []).map(mapReview);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0
      ? Math.round((totalRating / reviews.length) * 10) / 10
      : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      stats: { count: reviews.length, averageRating },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews  — create a new review
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productSlug, rating, title, comment, authorName, authorEmail } = body;

    if (!rating || !authorName) {
      return NextResponse.json({ success: false, error: 'Rating and author name are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    let finalProductId = productId;

    if (!finalProductId && productSlug) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .limit(1);

      if (error || !products?.length) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      finalProductId = products[0].id;
    }

    if (!finalProductId) {
      return NextResponse.json({ success: false, error: 'Product ID or slug is required' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('reviews')
      .insert([{
        id:           randomUUID(),
        product_id:   finalProductId,
        rating:       parseInt(rating),
        title:        title || null,
        comment:      comment || null,
        author_name:  authorName,
        author_email: authorEmail || null,
        is_approved:  true,
        is_verified:  false,
        updated_at:   new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapReview(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
  }
}

// DELETE /api/reviews?id=xxx  — admin only
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    const { error } = await admin.from('reviews').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 });
  }
}
