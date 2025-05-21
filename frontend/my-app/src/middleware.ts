import { withAuth } from 'next-auth/middleware'; // Import withAuth from next-auth/middleware
import { NextResponse } from 'next/server'; // Import NextResponse

export default withAuth(
  // `withAuth` will automatically handle redirects if the user is not authenticated
  // It uses the `pages.signIn` option defined in your `[...nextauth]/route.ts`
  // so users will be redirected to /auth/login automatically.
  function middleware(req) {
    // This function will be called if the user IS authenticated.
    // You can add additional authorization logic here if needed (e.g., role-based access).
    // For example: if (req.nextUrl.pathname === '/admin' && req.nextauth.token?.role !== 'admin') { ... }

    // If a user is authenticated, allow them to proceed.
    return NextResponse.next();
  },
  {
    // These are the NextAuth.js middleware options
    callbacks: {
      authorized: ({ token, req }) => {
        // `token` will be null if the user is not authenticated.
        // This callback determines if the user is authorized to view the page.
        // Return `true` if authorized, `false` if not.
        const isAuth = !!token; // Check if a token exists
        const isLoginPage = req.nextUrl.pathname.startsWith('/auth/login');
        const isSignupPage = req.nextUrl.pathname.startsWith('/auth/signup');

        // Allow access to login/signup pages if not authenticated
        if (isLoginPage || isSignupPage) {
          return true; // Always allow access to login/signup pages
        }

        // Redirect to login if trying to access a protected route without authentication
        // NextAuth.js middleware will handle the redirect to `pages.signIn` automatically
        // if `authorized` returns `false`.
        return isAuth;
      },
    },
    // Specify the paths that the middleware should apply to.
    // This is optional; if omitted, middleware applies to all paths except _next/static, public, etc.
    // For specific protection, you can define a matcher.
    // We are protecting /account, but allowing /auth/* for login/signup
    matcher: ['/account/:path*', '/api/auth/session'], // Protect /account and the session API
  }
);