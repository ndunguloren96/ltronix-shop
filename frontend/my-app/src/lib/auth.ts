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

// Django Backend's OAuth Toolkit Application Credentials (from Django Admin -> OAuth Toolkit -> Applications)
// These are the client_id and client_secret for the 'Confidential' OAuth2 Application
// that NextAuth.js will send to Django's /convert-token/ endpoint.
const DJANGO_OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_DJANGO_CLIENT_ID;
const DJANGO_OAUTH_CLIENT_SECRET = process.env.NEXT_PUBLIC_DJANGO_CLIENT_SECRET;

// Ensure this is correctly set and matches your Django backend's API base URL
// It should NOT have a trailing slash for consistent URL construction
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');


export const authOptions: AuthOptions = {
  providers: [
    // 1. Credentials Provider (Email/Password Login)
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
  // JWT configuration
  jwt: {
    secret: NEXTAUTH_SECRET, // JWT signing secret
  },
  // Callbacks to customize JWT and session data
  callbacks: {
    async jwt({ token, user, account }) {
      // Step 1: Initial sign-in (user and account are available)
      if (account && user) {
        let accessToken: string | undefined;
        let refreshToken: string | undefined;
        let djangoUser: DjangoUser | undefined;
        let userId: string | undefined;

        if (account.provider === "credentials") {
          // 'user' here is what was returned from the authorize function
          const credentialsUser = user as { id: string; email: string; name?: string; accessToken: string; refreshToken?: string; djangoUser: DjangoUser; };
          accessToken = credentialsUser.accessToken;
          refreshToken = credentialsUser.refreshToken; // Capture refresh token
          djangoUser = credentialsUser.djangoUser;
          userId = credentialsUser.id; // Get ID from credentials user
          console.log("JWT Callback (Credentials): User signed in. ID:", userId, "Email:", credentialsUser.email);
        } else if (account.provider === "google") {
          console.log("JWT Callback (Google): Attempting Django social auth token conversion...");
          // Ensure backend credentials are available
          if (!DJANGO_OAUTH_CLIENT_ID || !DJANGO_OAUTH_CLIENT_SECRET) {
            console.error('Django OAuth Toolkit Application client ID or secret missing in .env.local for Google convert-token. Please check your .env.local.');
            return token; // Do NOT return null here as it prevents the token from being updated.
          }

          try {
            const requestBody = new URLSearchParams({
              grant_type: 'convert_token',
              backend: 'google-oauth2', // Must match your SOCIAL_AUTH_AUTHENTICATION_BACKENDS entry in Django
              client_id: DJANGO_OAUTH_CLIENT_ID, // Django Backend's OAuth Toolkit App Client ID
              client_secret: DJANGO_OAUTH_CLIENT_SECRET, // Django Backend's OAuth Toolkit App Client Secret
              token: account.access_token!, // Google's access token received by NextAuth.js
            }).toString();

            console.log('Django convert-token request URL:', `${DJANGO_API_BASE_URL}/auth/convert-token/`);
            console.log('Django convert-token request body (form-urlencoded):', requestBody);

            // Call Django's drf-social-oauth2 convert-token endpoint
            const res = await fetch(`${DJANGO_API_BASE_URL}/auth/convert-token/`, {
              method: 'POST',
              // CRITICAL: Content-Type must be 'application/x-www-form-urlencoded' for drf-social-oauth2's convert-token
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: requestBody,
            });

            const djangoTokenData = await res.json();
            console.log("Django Google Token Conversion Raw Response Data:", djangoTokenData);

            if (res.ok) {
              if (djangoTokenData && djangoTokenData.access_token) {
                accessToken = djangoTokenData.access_token; // Store Django's access token
                refreshToken = djangoTokenData.refresh_token; // Store Django's refresh token
                // Optionally fetch user details from Django's /auth/user/ endpoint using the new accessToken
                try {
                  const userDetailsRes = await fetch(`${DJANGO_API_BASE_URL}/auth/user/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  if (userDetailsRes.ok) {
                    const userDetails = await userDetailsRes.json();
                    djangoUser = userDetails as DjangoUser;
                    userId = userDetails.id.toString();
                    console.log('Fetched Django user details:', userDetails);
                  } else {
                    console.error('Failed to fetch Django user details (status:', userDetailsRes.status, '):', await userDetailsRes.json());
                  }
                } catch (fetchErr) {
                  console.error('Error fetching Django user details:', fetchErr);
                }
                console.log('Google token successfully converted to Django token. Access Token received.');
              } else {
                console.warn('Django token conversion successful but no access_token or refresh_token found:', djangoTokenData);
              }
            } else {
              console.error('Django token conversion failed (Status:', res.status, '):', djangoTokenData);
            }
          } catch (err) {
            console.error('Error during Django API social token conversion (network/unhandled exception):', err);
          }
        }
      }

      // Add custom properties to the JWT token
      if (accessToken) token.accessToken = accessToken;
      if (refreshToken) token.refreshToken = refreshToken; // Store refresh token in JWT
      if (djangoUser) token.djangoUser = djangoUser;
      if (userId) token.id = userId; // Set the user ID on the token

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

