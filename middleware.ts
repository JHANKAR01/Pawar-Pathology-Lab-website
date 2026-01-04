import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Basic in-memory rate limiter
const rateLimit = new Map();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Rate Limiting for Auth APIs
  if (pathname.startsWith('/api/auth')) {
    const ip = req.ip || 'anonymous';
    const limit = 20; // Max requests per window
    const windowMs = 60 * 1000; // 1 minute

    const record = rateLimit.get(ip) || { count: 0, startTime: Date.now() };

    if (Date.now() - record.startTime > windowMs) {
      record.count = 0;
      record.startTime = Date.now();
    }

    record.count++;
    rateLimit.set(ip, record);

    if (record.count > limit) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // 2. Session & redirect logic
  const token = await getToken({ req });
  const isAuth = !!token;

  // Define public paths that don't satisfy "needsProfileCompletion" checks or auth
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/maintenance' ||
    pathname.startsWith('/api/auth'); // Let auth endpoints pass through for login/signup

  // --- Redirect Loop Prevention Logic ---

  // Case A: User is authenticated but profile is incomplete
  if (isAuth && (token as any)?.needsProfileCompletion) {
    // If they are NOT on /complete-profile, send them there
    if (pathname !== '/complete-profile' && pathname !== '/api/auth/signout') {
      return NextResponse.redirect(new URL('/complete-profile', req.url));
    }
    // If they ARE on /complete-profile, do nothing (allow access)
    return NextResponse.next();
  }

  // Case B: User is authenticated and profile IS complete
  if (isAuth && !(token as any)?.needsProfileCompletion) {
    // If they try to go to /complete-profile, send them home
    if (pathname === '/complete-profile') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 3. Protected Routes (Role-Based Access)
  if (pathname.startsWith('/admin')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    if ((token as any)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/partner')) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url));
    const role = (token as any)?.role;
    if (role !== 'partner' && role !== 'admin') {
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
     * - api/auth (handled inside, but we want to match api routes generally) -> actually we want to match everything to do global profile check
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
