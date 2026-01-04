import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rateLimit';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Rate Limiting for API Routes
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req });
    let identifier = req.ip || 'anonymous';
    let role = 'guest';

    if (token) {
      identifier = token.id as string || (token as any).sub!;
      role = (token as any).role || 'patient';
    }

    const rateLimit = await checkRateLimit(identifier, role);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "High traffic detected from your network. For security, please wait 60 seconds or ensure you are logged in for higher access speeds."
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 2. Session & redirect logic
  const token = await getToken({ req });
  const isAuth = !!token;

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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
