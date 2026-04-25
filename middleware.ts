import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getSession(sessionCookie);
  const isLoggedIn = session !== null;
  const isSuperAdmin = session?.role === 'superadmin';

  // Jika belum login, redirect ke login untuk dashboard maupun backend
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/backend') || pathname.startsWith('/api/backend')) && !isLoggedIn) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    const nextPath = `${pathname}${search}`;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login tapi mencoba akses /backend atau /api/backend dan BUKAN superadmin
  if ((pathname.startsWith('/backend') || pathname.startsWith('/api/backend')) && isLoggedIn && !isSuperAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/backend/:path*', '/backend', '/api/backend/:path*', '/login'],
};
