import { NextResponse } from 'next/server';
import { supabase, admin } from '@/lib/supabaseClients';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const isAdmin = await isAdminRequest(request);

    const { data: product, error } = await supabase
      .from('products')
      .select('id, title, slug, description, webp_path, pdf_path, price, is_free, is_featured, downloads, views, created_at, category_id, custom_fields, gallery, print_length, language, dimensions')
      .eq('slug', slug)
      .single();

    if (error || !product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Fetch category + parent
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('id', product.category_id)
      .single();

    let categoryWithParent = null;
    if (category) {
      let parent = null;
      if (category.parent_id) {
        const { data: p } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', category.parent_id)
          .single();
        parent = p || null;
      }
      categoryWithParent = { id: category.id, name: category.name, slug: category.slug, parent };
    }

    // Increment views in background
    admin.from('products').update({ views: (product.views || 0) + 1 }).eq('id', product.id).then(() => {});

    // Paid file addresses stay private; the raw database column is removed so it cannot leak through the spread
    const { pdf_path: filePath, ...publicFields } = product;
    const res = NextResponse.json({
      success: true,
      data: {
        ...publicFields,
        webpPath: product.webp_path,
        pdfPath: (product.is_free || isAdmin) ? filePath : null,
        categoryId: product.category_id,
        category: categoryWithParent,
      },
    });
    if (isAdmin) res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
