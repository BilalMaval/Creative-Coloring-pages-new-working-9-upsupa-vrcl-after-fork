import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';
import { getAllPosts } from '@/lib/blog';
import { supabase } from '@/lib/supabaseClients';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Get the current domain from headers
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  // Get brand for this domain
  const brand = getBrandByDomain(host);

  try {
    // Fetch all active products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Fetch all active categories (both collections and subcategories)
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, parent_id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Blog posts (static data — no DB call needed)
    const blogPosts = getAllPosts();

    // Static pages
    const staticPages = [
      { url: '',               changefreq: 'daily',   priority: '1.0' },
      { url: '/blog',          changefreq: 'weekly',  priority: '0.8' },
      { url: '/about',         changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy-policy',changefreq: 'monthly', priority: '0.3' },
      { url: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
      { url: '/contact',       changefreq: 'monthly', priority: '0.5' },
      { url: '/search',        changefreq: 'weekly',  priority: '0.7' },
    ];

    const currentDate = new Date().toISOString();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap for ${brand.name} (${brand.domain}) -->
  <!-- Generated: ${currentDate} -->
  <!-- Products: ${(products || []).length} | Categories: ${(categories || []).length} | Blog: ${blogPosts.length} -->
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${(categories || []).filter(c => c.parent_id === null).map(collection => `  <url>
    <loc>${baseUrl}/collection/${collection.slug}</loc>
    <lastmod>${new Date(collection.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${(categories || []).filter(c => c.parent_id !== null).map(cat => `  <url>
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
${blogPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
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
