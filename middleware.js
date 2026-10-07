import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Legacy pagination: /category/slug?page=N -> /category/slug/page/N (cacheable, clean URLs)
  if (/^\/category\/[^/]+\/?$/.test(pathname) && searchParams.has('page')) {
    const url = request.nextUrl.clone();
    const n = parseInt(searchParams.get('page'), 10);
    url.search = '';
    url.pathname = Number.isInteger(n) && n > 1
      ? `${pathname.replace(/\/$/, '')}/page/${n}`
      : pathname.replace(/\/$/, '');
    return NextResponse.redirect(url, 308);
  }

  // Protect admin routes (except login and forgot-password)
  if (pathname.startsWith('/admin') &&
      !pathname.startsWith('/admin/login') &&
      !pathname.startsWith('/admin/forgot-password')) {

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/category/:path*']
};
