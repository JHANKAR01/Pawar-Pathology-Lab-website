import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional custom logic can go here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const role = token?.role?.toLowerCase();

        if (pathname.startsWith('/admin')) {
          return role === 'admin';
        }

        if (pathname.startsWith('/partner')) {
          return role === 'partner' || role === 'admin';
        }

        return true;
      },
    },
  }
);

export const config = {
  // Keep it limited to these specific paths
  matcher: ['/admin/:path*', '/partner/:path*'],
};
