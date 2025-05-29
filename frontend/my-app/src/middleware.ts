import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuth = !!token;
        const isLoginPage = req.nextUrl.pathname.startsWith('/auth/login');
        const isSignupPage = req.nextUrl.pathname.startsWith('/auth/signup');
        if (isLoginPage || isSignupPage) return true;
        return isAuth;
      },
    },
    matcher: ['/account/:path*', '/api/auth/session'],
  }
);
