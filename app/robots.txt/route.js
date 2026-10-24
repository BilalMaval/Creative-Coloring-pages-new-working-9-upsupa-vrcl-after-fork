import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getBrandByDomain, getSiteUrl } from '@/config/brands';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Each domain serves its own file; URLs use that brand's canonical origin
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Get brand for this domain
  const brand = getBrandByDomain(host);
  const baseUrl = getSiteUrl(brand);
  
  const robots = `# Robots.txt for ${brand.name}
# Domain: ${brand.domain}
# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /cart
Disallow: /checkout

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml`;
  
  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      // Same host-dependent reasoning as the sitemap: cached per host by the CDN; the file almost never changes
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}
