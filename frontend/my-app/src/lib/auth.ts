// src/lib/auth.ts
import { type AuthOptions } from "next-auth";
import { type SessionStrategy } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// For custom DjangoUser and JWT types to ensure they are recognized
import type { DjangoUser } from "@/types/next-auth"; // Ensure this path is correct

// Define your environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
// Ensure this is correctly set and matches your Django backend's API base URL
// It should NOT have a trailing slash for consistent URL construction
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Credentials authorize: Missing email or password.");
          return null;
        }

        try {
          // Make actual API call to Django's dj-rest-auth login endpoint
          const response = await fetch(`${DJANGO_API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json(); // Parse JSON first to log it
          console.log("Django Login Raw Response Data:", data); // LOG THE RAW RESPONSE

          if (!response.ok) {
            console.error("Django Credentials Login Error (status:", response.status, "):", data);
            // Throw an error to propagate to the frontend for toast messages
            throw new Error(data.detail || data.non_field_errors?.[0] || 'Invalid credentials');
          }

          // FIX: dj-rest-auth with Simple JWT usually returns 'access' and 'refresh' as top-level keys
          const user = data.user;
          const accessToken = data.access; // Use 'access' for the access token
          const refreshToken = data.refresh; // Use 'refresh' for the refresh token

          if (user && accessToken) {
            // Return a NextAuth User object. Add custom properties like accessToken and djangoUser.
            // The 'id' field is crucial and must be a string for NextAuth.
            return {
              id: user.id.toString(), // Ensure ID is a string
              email: user.email,
              name: user.first_name || user.email, // Use first_name if available, else email
              accessToken: accessToken,
              refreshToken: refreshToken, // Pass refresh token if needed for future refresh logic
              djangoUser: user as DjangoUser, // Cast to your custom DjangoUser type
            };
          }
          console.warn("Credentials authorize: User or access token missing from Django response.");
          return null;
        } catch (error: any) {
          console.error("Credentials authorize failed:", error.message || error);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            // Add authorization parameters for offline access to get refresh token
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  // Session configuration
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // JWT callbacks (critical for passing accessToken and djangoUser)
  callbacks: {
    async jwt({ token, user, account }) {
      // Step 1: Initial sign-in (user and account are available)
      if (account && user) {
        let accessToken: string | undefined;
        let refreshToken: string | undefined; // Added refreshToken
        let djangoUser: DjangoUser | undefined;
        let userId: string | undefined; // To store the user's ID

        if (account.provider === "credentials") {
          // 'user' here is what was returned from the authorize function
          const credentialsUser = user as { id: string; email: string; name?: string; accessToken: string; refreshToken?: string; djangoUser: DjangoUser; };
          accessToken = credentialsUser.accessToken;
          refreshToken = credentialsUser.refreshToken; // Capture refresh token
          djangoUser = credentialsUser.djangoUser;
          userId = credentialsUser.id; // Get ID from credentials user
          console.log("JWT Callback (Credentials): User signed in. ID:", userId, "Email:", credentialsUser.email);
        } else if (account.provider === "google") {
          console.log("JWT Callback (Google): Attempting Django social auth...");
          try {
            const djangoSocialAuthRes = await fetch(`${DJANGO_API_BASE_URL}/auth/social/google/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: account.access_token }),
            });

            const data = await djangoSocialAuthRes.json(); // Parse JSON first to log
            console.log("Django Google Social Auth Raw Response Data:", data); // LOG THE RAW RESPONSE

            if (djangoSocialAuthRes.ok) {
              accessToken = data.access; // Use 'access' for social login too
              refreshToken = data.refresh; // Use 'refresh' for social login too
              djangoUser = data.user;
              userId = data.user.id.toString();
              console.log("JWT Callback (Google): Django social auth successful. User ID:", userId, "Email:", djangoUser?.email);
            } else {
              console.error("Django social auth failed (status:", djangoSocialAuthRes.status, "):", data);
            }
          } catch (error) {
            console.error("Error during Django social auth:", error);
          }
        }

        // Add custom properties to the JWT token
        if (accessToken) token.accessToken = accessToken;
        if (refreshToken) token.refreshToken = refreshToken; // Store refresh token in JWT
        if (djangoUser) token.djangoUser = djangoUser;
        if (userId) token.id = userId; // Set the user ID on the token
      }
      return token;
    },
    async session({ session, token }) {
      // Step 2: Session creation (token is available)
      // Add properties from the JWT token to the session object
      if (token.accessToken) {
        session.user.accessToken = token.accessToken;
      }
      if (token.refreshToken) { // Add refresh token to session
        session.user.refreshToken = token.refreshToken;
      }
      if (token.djangoUser) {
        session.user.djangoUser = token.djangoUser;
      }
      // If you added 'id' to the token in the jwt callback, add it to the session.user
      if (token.id) {
        session.user.id = token.id; // Ensure session.user.id is set
      }
      console.log("Session Callback: Session updated. User ID:", session.user.id, "Authenticated:", !!session.user.accessToken);
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Custom login page
  },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

