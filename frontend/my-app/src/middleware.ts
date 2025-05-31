// src/middleware.ts

// This file is a Next.js middleware that runs before a request is completed.
// It's ideal for protecting routes based on authentication status.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// `withAuth` augments your Next.js request with the user's session.
// It also provides a way to define authorization logic.
export default withAuth(
  // The `middleware` function is called for every request that matches the `matcher` config below.
  async function middleware(req) {
    const token = req.nextauth.token; // The JWT token from NextAuth.js session

    // Example: Redirect authenticated users from auth pages to home
    // if (req.nextUrl.pathname.startsWith('/auth') && token) {
    //   return NextResponse.redirect(new URL('/', req.url));
    // }

    // --- Route Protection Logic ---
    // Protect `/account` and all its sub-routes
    // If the user is trying to access a protected route and is NOT authenticated (no token)
    if (!token && req.nextUrl.pathname.startsWith('/account')) {
      // Redirect to the login page, passing the current URL as a callback
      // so the user can be redirected back after successful login.
      const url = new URL('/auth/login', req.url);
      url.searchParams.set('callbackUrl', encodeURI(req.url));
      return NextResponse.redirect(url);
    }

    // Continue with the request if authenticated or if the route is not protected.
    return NextResponse.next();
  },
  {
    // Callbacks are executed before the middleware function itself.
    // They determine if the middleware should run.
    callbacks: {
      // authorized: This function is called before `middleware`.
      // It determines if the user is 'authorized' to proceed.
      // If it returns `true`, `middleware` runs. If `false`, it redirects based on `pages.signIn`.
      async authorized({ token, req }) {
        // If there's a token, the user is considered authenticated.
        // This is a basic check. More complex roles/permissions could be checked here.
        if (token) {
          return true; // User is authenticated
        }

        // If no token, check if the requested path is a protected path.
        // If it's a protected path and no token, then unauthorized.
        // If it's not a protected path (e.g., login, signup), then allow access even without a token.
        if (req.nextUrl.pathname.startsWith('/account')) {
          return false; // Not authorized for protected routes without a token
        }

        return true; // Authorized for unprotected routes (e.g., /auth/login, /auth/signup)
      },
    },
    // The `pages` option allows you to define custom pages for specific NextAuth.js actions.
    // This is crucial for redirecting unauthenticated users to your custom login page.
    pages: {
      signIn: '/auth/login', // Redirect unauthenticated users to this page
    },
  }
);

// Define the paths where the middleware should run.
// This `matcher` array ensures that the middleware only applies to these routes.
export const config = {
  // Match all requests that start with /account or /api/auth or /auth
  // This will apply the middleware to:
  // - All routes under /account (e.g., /account, /account/profile-update)
  // - All NextAuth.js API routes (e.g., /api/auth/signin, /api/auth/callback)
  // - All your custom auth pages (e.g., /auth/login, /auth/signup)
  matcher: ['/account/:path*', '/api/auth/:path*', '/auth/:path*'],
};