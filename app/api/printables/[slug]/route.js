import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClients';

export async function GET(request, { params }) {
  try {
    const { slug } = params;

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
    supabase.from('products').update({ views: (product.views || 0) + 1 }).eq('id', product.id).then(() => {});

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        webpPath: product.webp_path,
        pdfPath: product.pdf_path,
        categoryId: product.category_id,
        category: categoryWithParent,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
