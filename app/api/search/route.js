export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const q = query.trim();
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Fetch candidates using PostgREST ilike on title and description.
    // We run two parallel queries (title match + description match) and merge.
    const titleQuery = supabase
      .from('products')
      .select('id, title, slug, description, webp_path, is_free, is_featured, price, downloads, category_id, tags')
      .eq('is_active', true)
      .ilike('title', `%${q}%`)
      .order('downloads', { ascending: false })
      .limit(100);

    const descQuery = supabase
      .from('products')
      .select('id, title, slug, description, webp_path, is_free, is_featured, price, downloads, category_id, tags')
      .eq('is_active', true)
      .ilike('description', `%${q}%`)
      .order('downloads', { ascending: false })
      .limit(50);

    // Also search individual words in title for partial matches
    const wordQueries = words.length > 1
      ? words.map(word =>
          supabase
            .from('products')
            .select('id, title, slug, description, webp_path, is_free, is_featured, price, downloads, category_id, tags')
            .eq('is_active', true)
            .ilike('title', `%${word}%`)
            .order('downloads', { ascending: false })
            .limit(50)
        )
      : [];

    const [titleRes, descRes, ...wordRes] = await Promise.all([titleQuery, descQuery, ...wordQueries]);

    // Merge all results, deduplicate by id
    const allProducts = new Map();
    const addProducts = (items) => {
      (items || []).forEach(p => {
        if (!allProducts.has(p.id)) allProducts.set(p.id, p);
      });
    };

    addProducts(titleRes.data);
    addProducts(descRes.data);
    wordRes.forEach(r => addProducts(r.data));

    if (allProducts.size === 0) {
      return NextResponse.json({ success: true, data: [], pagination: { total: 0 } });
    }

    // Fetch categories for the matched products
    const categoryIds = [...new Set([...allProducts.values()].map(p => p.category_id).filter(Boolean))];
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .in('id', categoryIds);

    // Fetch parent categories
    const parentIds = [...new Set((categoriesData || []).map(c => c.parent_id).filter(Boolean))];
    let parentsData = [];
    if (parentIds.length > 0) {
      const { data: p } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', parentIds);
      parentsData = p || [];
    }

    const parentMap = Object.fromEntries(parentsData.map(p => [p.id, p]));
    const categoryMap = Object.fromEntries(
      (categoriesData || []).map(c => [c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent: c.parent_id ? (parentMap[c.parent_id] || null) : null,
      }])
    );

    // Score and sort results by relevance
    const scoredProducts = [...allProducts.values()].map(product => {
      let score = 0;
      const titleLower = product.title.toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const qLower = q.toLowerCase();

      // Exact full query match in title (highest priority)
      if (titleLower.includes(qLower)) score += 100;
      // Exact full query match in description
      if (descLower.includes(qLower)) score += 50;

      // Individual word matches
      words.forEach(word => {
        if (titleLower.includes(word)) score += 20;
        if (descLower.includes(word)) score += 10;
        if (product.tags && product.tags.some(tag => tag.toLowerCase().includes(word))) score += 15;
      });

      // Boost featured products
      if (product.is_featured) score += 5;

      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        webpPath: product.webp_path,
        isFree: product.is_free,
        isFeatured: product.is_featured,
        price: product.price ? Number(product.price) : 0,
        downloads: product.downloads || 0,
        tags: product.tags || [],
        category: categoryMap[product.category_id] || null,
        relevanceScore: score,
      };
    });

    // Sort by relevance score descending, then downloads
    scoredProducts.sort((a, b) =>
      b.relevanceScore !== a.relevanceScore
        ? b.relevanceScore - a.relevanceScore
        : b.downloads - a.downloads
    );

    // Return top 50 results
    const results = scoredProducts.slice(0, 50);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: { total: results.length },
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
