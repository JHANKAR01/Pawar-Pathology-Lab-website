import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req });
  const isAuth = !!token;
  const role = (token as any)?.role;

  // 1. Redirect if already logged in (Login/Root protection)
  if (isAuth && (pathname === '/login' || pathname === '/')) {
    if (role === 'master') return NextResponse.redirect(new URL('/master', req.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
  }

  // 2. Protected Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'admin' && role !== 'master') return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/master')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'master') return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/partner')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'partner' && role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
