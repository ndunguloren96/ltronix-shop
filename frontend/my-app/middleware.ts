// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Define which paths require authentication.
// Paths starting with these prefixes will be protected.
const protectedPaths = [
  '/account',
  '/account/profile',
  '/account/security',
  '/account/payment',
  // Add any other paths that should only be accessible by authenticated users
];

export default withAuth(
  // This is the actual middleware function that runs after `authorized` callback.
  // `withAuth` augments `req` with `req.nextauth` containing the user's token and session.
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token; // The JWT token from NextAuth.js

    // --- Logic for authenticated users trying to access auth pages ---
    // If the user is authenticated AND they are trying to access the login or signup page,
    // redirect them to their account profile page or dashboard.
    if (token && (pathname === '/auth/login' || pathname === '/auth/signup')) {
      // You might change '/account/profile' to a dashboard or home page if that's more appropriate
      console.log(`Authenticated user accessing auth page. Redirecting to /account/profile from ${pathname}`);
      return NextResponse.redirect(new URL('/account/profile', req.url));
    }

    // --- Logic for protecting specific routes ---
    // Check if the current path is one of the protected paths.
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      // If the path is protected AND the user is NOT authenticated (no token),
      // redirect them to the login page.
      if (!token) {
        console.log(`Unauthenticated user accessing protected path: ${pathname}. Redirecting to /auth/login.`);
        // Add `callbackUrl` to the login page so the user can be redirected back
        // to their intended protected page after successful login.
        return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url));
      }
      // If the path is protected and the user IS authenticated, allow them to proceed.
      // (This is implicitly handled by not returning a redirect here)
    }

    // For all other cases (unprotected paths, or authenticated users on protected paths),
    // allow the request to proceed to the next step (e.g., page rendering).
    return NextResponse.next();
  },
  {
    // These are the NextAuth.js specific options for the middleware.
    callbacks: {
      // The `authorized` callback determines if the `middleware` function above should run
      // and if NextAuth.js should automatically redirect based on `pages.signIn`.
      authorized: ({ token, req }) => {
        const isAuth = !!token; // True if a token exists (user is authenticated)
        const isLoginPage = req.nextUrl.pathname.startsWith('/auth/login');
        const isSignupPage = req.nextUrl.pathname.startsWith('/auth/signup');

        // Allow access to login/signup pages regardless of authentication status
        // because we handle the redirect for authenticated users in the `middleware` function.
        if (isLoginPage || isSignupPage) {
          return true;
        }

        // For all other paths, only authorize if the user is authenticated.
        // If this returns `false` for a matched path, NextAuth.js will automatically
        // redirect to the `pages.signIn` URL defined below.
        return isAuth;
      },
    },
    // Specify the custom sign-in page URL.
    // If the `authorized` callback returns `false`, NextAuth.js will redirect here.
    pages: {
      signIn: '/auth/login',
    },
  }
);

// This `config` object defines which paths the middleware should apply to.
// It's crucial for performance to only run middleware on relevant routes.
export const config = {
  matcher: [
    // Apply middleware to NextAuth.js internal API routes
    '/api/auth/:path*',
    // Apply middleware to your custom authentication pages
    '/auth/login',
    '/auth/signup',
    // Apply middleware to all paths under `/account` (your protected user areas)
    '/account/:path*',
    // Add other specific protected paths here if they don't fall under `/account`
  ],
};