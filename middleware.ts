import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Session & redirect logic
  const token = await getToken({ req });
  const isAuth = !!token;

  // 3. Protected Routes (Role-Based Access)
  if (pathname.startsWith('/admin')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    const role = (token as any)?.role;
    // Master has inherited access to all admin routes
    if (role !== 'master' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/partner')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    const role = (token as any)?.role;
    // Master has inherited access to all partner routes
    if (role !== 'master' && role !== 'partner' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Pattern to match all paths BUT exclude static assets, favicon, etc.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
