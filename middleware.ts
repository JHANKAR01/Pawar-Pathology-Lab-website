import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional custom logic can go here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith('/admin')) {
          return token?.role === 'admin';
        }

        if (pathname.startsWith('/partner')) {
          return token?.role === 'partner' || token?.role === 'admin';
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/partner/:path*'],
};
