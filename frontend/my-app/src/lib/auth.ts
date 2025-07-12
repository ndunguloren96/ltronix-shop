// src/lib/auth.ts
import { type AuthOptions } from "next-auth"; // Use 'type' import if NextAuth.js is v5+
import { type SessionStrategy } from "next-auth"; // Explicitly import SessionStrategy

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// For custom DjangoUser and JWT types to ensure they are recognized
import type { DjangoUser } from "@/types/next-auth"; // Ensure this path is correct if DjangoUser is in a different file

// Define your environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your existing authorize logic from Django
        // This is where you call your Django backend to authenticate.
        // Make sure it returns a 'User' object that NextAuth expects.
        // It should look like:
        // const user = await djangoAuthCall(credentials.email, credentials.password);
        // if (user) {
        //   return user; // NextAuth expects { id: string; name?: string | null; email?: string | null; image?: string | null; }
        // }
        // return null;

        // Placeholder for compilation, replace with your actual Django authentication logic
        console.log("Attempting credentials login for:", credentials?.email);
        if (credentials?.email === "test@example.com" && credentials?.password === "password") {
          return { id: "1", name: "Test User", email: "test@example.com" };
        }
        return null;
      },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  // Session configuration
  session: {
    // FIX APPLIED HERE: Ensure 'jwt' is explicitly typed as SessionStrategy
    strategy: "jwt" as SessionStrategy, // Or "database" if you use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // JWT callbacks (critical for passing accessToken and djangoUser)
  callbacks: {
    async jwt({ token, user, account }) {
      // Step 1: Initial sign-in (user and account are available)
      if (account && user) {
        // If coming from credentials provider, 'user' is your Django user object.
        // If coming from OAuth, 'user' will be the profile from OAuth, and you'll
        // need to call your Django backend to get a token and your DjangoUser data.
        let accessToken: string | undefined;
        let djangoUser: DjangoUser | undefined;

        if (account.provider === "credentials") {
          // Assuming your authorize callback returns a user object
          // that contains accessToken and djangoUser.
          // Adjust this based on what your credentials authorize returns.
          // Example:
          // const res = await yourDjangoLoginApiCall(user.email, user.password);
          // if (res.ok) {
          //   const data = await res.json();
          //   accessToken = data.access_token;
          //   djangoUser = data.user; // Your full Django user object
          // }
          // For now, let's assume 'user' itself has the access token
          // If your `authorize` method returns { id, name, email, accessToken, djangoUser }, cast it.
          const credentialsUser = user as { id: string; name?: string; email?: string; accessToken?: string; djangoUser?: DjangoUser; };
          accessToken = credentialsUser.accessToken;
          djangoUser = credentialsUser.djangoUser;

          // Also set the ID from credentials if it exists
          if (credentialsUser.id) {
            token.id = credentialsUser.id;
          }

        } else if (account.provider === "google") {
          // For Google, you'll typically exchange the OAuth token for your Django backend's token
          // Example: Call your Django social login endpoint
          try {
            const djangoSocialAuthRes = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/auth/google/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: account.access_token }), // Use Google's access_token
            });

            if (djangoSocialAuthRes.ok) {
              const data = await djangoSocialAuthRes.json();
              accessToken = data.access_token;
              djangoUser = data.user; // Your full Django user object
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
        session.user.id = token.id;
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
