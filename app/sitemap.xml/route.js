import { headers } from 'next/headers';
import { getBrandByDomain, getSiteUrl } from '@/config/brands';
import { getAllPublishedPosts } from '@/lib/blog-db';
import { supabase } from '@/lib/supabaseClients';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Each domain serves its own file; URLs use that brand's canonical origin
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // Get brand for this domain
  const brand = getBrandByDomain(host);
  const baseUrl = getSiteUrl(brand);

  try {
    // Fetch all active products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at, category_id')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Fetch all active categories (both collections and subcategories)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, parent_id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Empty categories/collections are noindexed on-page, so keep them out of the sitemap too
    const nonEmpty = new Set((products || []).map(p => p.category_id));
    const listedCategories = (categories || []).filter(c => c.parent_id !== null && nonEmpty.has(c.id));
    const listedCollections = (categories || []).filter(
      c => c.parent_id === null && (categories || []).some(k => k.parent_id === c.id && nonEmpty.has(k.id))
    );

    // Active bundles (a failure here must never break the whole sitemap)
    let bundleRows = [];
    try {
      const { data: bundles } = await supabase
        .from('bundles')
        .select('slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      bundleRows = bundles || [];
    } catch {}

    // Blog posts — Supabase blog_posts is the single source of truth
    const blogPosts = await getAllPublishedPosts();

    // Static pages
    const staticPages = [
      { url: '',               changefreq: 'daily',   priority: '1.0' },
      { url: '/blog',          changefreq: 'weekly',  priority: '0.8' },
      { url: '/about',         changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy-policy',changefreq: 'monthly', priority: '0.3' },
      { url: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
      { url: '/contact',       changefreq: 'monthly', priority: '0.5' },
    ];

    const currentDate = new Date().toISOString();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap for ${brand.name} (${brand.domain}) -->
  <!-- Generated: ${currentDate} -->
  <!-- Products: ${(products || []).length} | Categories: ${listedCategories.length} | Blog: ${blogPosts.length} -->
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${listedCollections.map(collection => `  <url>
    <loc>${baseUrl}/collection/${collection.slug}</loc>
    <lastmod>${new Date(collection.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${listedCategories.map(cat => `  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${new Date(cat.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${(products || []).map(product => `  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
${bundleRows.length > 0 ? `  <url>
    <loc>${baseUrl}/bundles</loc>
    <lastmod>${new Date(bundleRows[0].updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>` : ''}
${bundleRows.map(b => `  <url>
    <loc>${baseUrl}/bundle/${b.slug}</loc>
    <lastmod>${new Date(b.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join(String.fromCharCode(10))}
${blogPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
