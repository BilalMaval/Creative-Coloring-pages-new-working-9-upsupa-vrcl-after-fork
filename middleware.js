import { NextResponse } from 'next/server';
import { getBrandByDomain, getBrandKey } from '@/config/brands';
import { verifySession, SESSION_COOKIE } from '@/lib/adminAuth';

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Admin pages: require a valid signed ADMIN session (login and password-recovery pages stay open).
  // API routes enforce the same check themselves (lib/adminAuth.js requireAdmin).
  if (pathname.startsWith('/admin')) {
    const open = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/forgot-password') || pathname.startsWith('/admin/reset-password');
    if (!open) {
      const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
      if (!session || session.role !== 'ADMIN') {
        const res = NextResponse.redirect(new URL('/admin/login', request.url));
        if (request.cookies.get(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
        return res;
      }
    }
    return NextResponse.next();
  }

  // One canonical URL per page: redirect any path with uppercase letters to its lowercase form (all slugs are lowercase)
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
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
