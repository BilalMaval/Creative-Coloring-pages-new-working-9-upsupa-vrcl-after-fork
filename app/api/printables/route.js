import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabaseClients';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const latest = searchParams.get('latest') === 'true';
    const skip = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('id, title, slug, description, webp_path, pdf_path, category_id, price, is_free, is_featured, gallery, print_length, language, dimensions, custom_fields, downloads, views, tags, created_at', { count: 'exact' })
      .eq('is_active', true);

    if (category) {
      query = query.eq('category_id', category);
    }

    query = query.order(latest ? 'created_at' : 'title', { ascending: !latest });
    query = query.range(skip, skip + limit - 1);

    const { data: items, error, count: total } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch printables' }, { status: 500 });
    }

    // Fetch approved reviews for rating calculation
    const ids = (items || []).map(p => p.id);
    let reviewMap = {};
    if (ids.length > 0) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', ids)
        .eq('is_approved', true);
      (reviews || []).forEach(r => {
        if (!reviewMap[r.product_id]) reviewMap[r.product_id] = [];
        reviewMap[r.product_id].push(r.rating);
      });
    }

    const itemsWithRating = (items || []).map(item => {
      const ratings = reviewMap[item.id] || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;
      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        webpPath: item.webp_path,
        pdfPath: item.pdf_path,
        categoryId: item.category_id,
        price: item.price ? Number(item.price) : 0,
        isFree: item.is_free,
        isFeatured: item.is_featured,
        gallery: item.gallery || [],
        printLength: item.print_length,
        language: item.language,
        dimensions: item.dimensions,
        customFields: item.custom_fields,
        downloads: item.downloads || 0,
        views: item.views || 0,
        tags: item.tags || [],
        createdAt: item.created_at,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: itemsWithRating,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
        hasNext: page < Math.ceil((total || 0) / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching printables:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch printables' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, description, tags, image, pdfPath, webpPath, categoryId, price, isFree, gallery, printLength, language, dimensions, customFields, downloads, views } = body;

    if (!title || !slug || !categoryId) {
      return NextResponse.json({ success: false, error: 'Title, slug, and category are required' }, { status: 400 });
    }

    // Check if slug exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Product with this slug already exists' }, { status: 400 });
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        id: randomUUID(),
        title,
        slug,
        description: description || '',
        tags: tags || [],
        webp_path: webpPath || image || null,
        pdf_path: pdfPath || null,
        category_id: categoryId,
        price: price || 0,
        is_free: isFree !== undefined ? isFree : true,
        gallery: gallery || [],
        print_length: printLength || null,
        language: language || null,
        dimensions: dimensions || null,
        custom_fields: customFields || null,
        is_active: true,
        downloads: downloads || 0,
        views: views || 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ success: false, error: 'Failed to create printable' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error) {
    console.error('Error creating printable:', error);
    return NextResponse.json({ success: false, error: 'Failed to create printable' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, slug, description, tags, image, pdfPath, webpPath, categoryId, price, isFree, gallery, printLength, language, dimensions, customFields, downloads, views } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (image !== undefined) updateData.webp_path = image;
    if (webpPath !== undefined) updateData.webp_path = webpPath;
    if (pdfPath !== undefined) updateData.pdf_path = pdfPath;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (price !== undefined) updateData.price = price;
    if (isFree !== undefined) updateData.is_free = isFree;
    if (gallery !== undefined) updateData.gallery = gallery;
    if (printLength !== undefined) updateData.print_length = printLength;
    if (language !== undefined) updateData.language = language;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (downloads !== undefined) updateData.downloads = downloads;
    if (views !== undefined) updateData.views = views;

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ success: false, error: 'Failed to update printable' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    console.error('Error updating printable:', error);
    return NextResponse.json({ success: false, error: 'Failed to update printable' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // Delete related records first
    await supabase.from('reviews').delete().eq('product_id', id);
    await supabase.from('bundle_items').delete().eq('product_id', id);
    await supabase.from('cart_items').delete().eq('product_id', id);
    await supabase.from('downloads').delete().eq('product_id', id);

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete product: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting printable:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete printable: ' + error.message }, { status: 500 });
  }
}
