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
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1'; // Ensure this is correctly set

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
          return null;
        }

        try {
          // FIX: Make actual API call to Django's dj-rest-auth login endpoint
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

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Django Credentials Login Error:", errorData);
            // Throw an error to display to the user, or return null
            throw new Error(errorData.detail || errorData.non_field_errors?.[0] || 'Invalid credentials');
          }

          const data = await response.json();
          // Assuming Django returns a structure like { user: { id, email, first_name, last_name }, access_token, refresh_token }
          // Adjust 'data.user' and 'data.access_token' based on your actual Django response structure.
          // For dj-rest-auth with JWT, it typically returns { access_token, refresh_token, user: { id, email, ... } }
          const user = data.user; // This is your Django user object
          const accessToken = data.access_token; // JWT access token

          if (user && accessToken) {
            // Return a NextAuth User object. Add custom properties like accessToken and djangoUser.
            // The 'id' field is crucial and must be a string for NextAuth.
            return {
              id: user.id.toString(), // Ensure ID is a string
              email: user.email,
              name: user.first_name || user.email, // Use first_name if available, else email
              accessToken: accessToken,
              djangoUser: user as DjangoUser, // Cast to your custom DjangoUser type
            };
          }
          return null;
        } catch (error: any) {
          console.error("Credentials authorize failed:", error);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            // FIX: Add authorization parameters for offline access to get refresh token
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
        let djangoUser: DjangoUser | undefined;
        let userId: string | undefined; // To store the user's ID

        if (account.provider === "credentials") {
          // 'user' here is what was returned from the authorize function
          const credentialsUser = user as { id: string; email: string; name?: string; accessToken: string; djangoUser: DjangoUser; };
          accessToken = credentialsUser.accessToken;
          djangoUser = credentialsUser.djangoUser;
          userId = credentialsUser.id; // Get ID from credentials user
        } else if (account.provider === "google") {
          // FIX: Call Django's dj-rest-auth Google social login endpoint
          try {
            const djangoSocialAuthRes = await fetch(`${DJANGO_API_BASE_URL}/auth/google/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // For Google, dj-rest-auth expects the 'access_token' obtained from Google
              body: JSON.stringify({ access_token: account.access_token }),
            });

            if (djangoSocialAuthRes.ok) {
              const data = await djangoSocialAuthRes.json();
              // Assuming Django returns { access_token, refresh_token, user: { id, email, ... } }
              accessToken = data.access_token;
              djangoUser = data.user; // Your full Django user object
              userId = data.user.id.toString(); // Get ID from Django user
            } else {
              console.error("Django social auth failed:", await djangoSocialAuthRes.json());
            }
          } catch (error) {
            console.error("Error during Django social auth:", error);
          }
        }

        // Add custom properties to the JWT token
        if (accessToken) token.accessToken = accessToken;
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
      if (token.djangoUser) {
        session.user.djangoUser = token.djangoUser;
      }
      // If you added 'id' to the token in the jwt callback, add it to the session.user
      if (token.id) {
        session.user.id = token.id; // Ensure session.user.id is set
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Custom login page
  },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

