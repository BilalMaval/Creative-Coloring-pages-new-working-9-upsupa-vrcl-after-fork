import { NextResponse } from 'next/server';
import { getBrandByDomain, SITE_HOST, SITE_URL } from '@/config/brands';

export const dynamic = 'force-dynamic';

export async function GET() {
  const host = SITE_HOST;
  const baseUrl = SITE_URL;
  
  // Get brand for this domain
  const brand = getBrandByDomain(host);
  
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
