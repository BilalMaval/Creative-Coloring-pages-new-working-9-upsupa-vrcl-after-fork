import { NextResponse } from 'next/server';
import { getBrandByDomain, getBrandKey } from '@/config/brands';

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Admin: auth guard only (admin is not brand-specific)
  if (pathname.startsWith('/admin')) {
    if (
      !pathname.startsWith('/admin/login') &&
      !pathname.startsWith('/admin/forgot-password') &&
      !request.cookies.get('auth_token')?.value
    ) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Legacy pagination: /category/slug?page=N -> /category/slug/page/N (cacheable, clean URLs)
  if (/^\/category\/[^/]+\/?$/.test(pathname) && searchParams.has('page')) {
    const url = request.nextUrl.clone();
    const n = parseInt(searchParams.get('page'), 10);
    const base = pathname.replace(/\/$/, '');
    url.search = '';
    url.pathname = Number.isInteger(n) && n > 1 ? `${base}/page/${n}` : base;
    return NextResponse.redirect(url, 308);
  }

  // Multi-brand: serve each domain from its own /<brandKey>/... route tree so every
  // brand has separately cached pages. Unknown hosts (previews, localhost) use the default brand.
  const brand = getBrandByDomain(request.headers.get('host') || '');
  const url = request.nextUrl.clone();
  url.pathname = `/${getBrandKey(brand)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/admin/:path*',
    // everything except api, admin (handled above), Next internals and files with an extension
    '/((?!api|admin|_next|.*\\..*).*)',
  ],
};
