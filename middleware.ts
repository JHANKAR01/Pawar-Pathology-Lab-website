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

  // --- 3. SaaS Maintenance Mode Check ---
  // Only check if NOT accessing maintenance page, api (except status), or static
  if (!pathname.startsWith('/maintenance') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/static')) {
    try {
      // Lightweight status check
      const statusRes = await fetch(new URL('/api/maintenance/status', req.url));
      if (statusRes.ok) {
        const { user: userLock, partner: partnerLock } = await statusRes.json();
        const isPrivileged = role === 'admin' || role === 'master';

        // Patient Lock
        if (userLock && !isPrivileged && role !== 'partner') { // Partners not blocked by user lock? User requirement A says "Patient Lock". Assuming partners are separate unless partner lock is on.
          return NextResponse.redirect(new URL('/maintenance?type=patient', req.url));
        }

        // Partner Lock - Specifically for /partner routes
        if (partnerLock && !isPrivileged && pathname.startsWith('/partner')) {
          return NextResponse.redirect(new URL('/maintenance?type=partner', req.url));
        }
      }
    } catch (e) {
      // Fail open if status check fails
      console.error("Middleware Maintenance Check Failed", e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
