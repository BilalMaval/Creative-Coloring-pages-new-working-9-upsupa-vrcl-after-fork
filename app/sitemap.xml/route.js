import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Get the current domain from headers
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  
  // Get brand for this domain (for potential brand-specific sitemap customization)
  const brand = getBrandByDomain(host);
  
  try {
    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    });
    
    // Fetch all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, parentId: true }
    });
    
    // Static pages
    const staticPages = [
      { url: '', changefreq: 'daily', priority: '1.0' },
      { url: '/about', changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
      { url: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
      { url: '/contact', changefreq: 'monthly', priority: '0.5' },
      { url: '/search', changefreq: 'weekly', priority: '0.7' },
    ];
    
    const currentDate = new Date().toISOString();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap for ${brand.name} (${brand.domain}) -->
  <!-- Generated: ${currentDate} -->
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${categories.filter(c => c.parentId === null).map(collection => `
  <url>
    <loc>${baseUrl}/collection/${collection.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${categories.filter(c => c.parentId !== null).map(cat => `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${products.map(product => `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;
    
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
