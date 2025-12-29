import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  name: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin and partner routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/partner')) {
    const token = request.cookies.get('pawar_lab_auth_token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Try to verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      
      // Check role-based access
      if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
        const redirectUrl = decoded.role === 'partner' ? '/partner' : '/login';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      if (pathname.startsWith('/partner') && decoded.role !== 'partner') {
        const redirectUrl = decoded.role === 'admin' ? '/admin' : '/login';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      // Allow access
      return NextResponse.next();
    } catch (error) {
      // Token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/partner/:path*'],
};

