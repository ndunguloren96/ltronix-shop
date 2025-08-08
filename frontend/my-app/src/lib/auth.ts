// src/lib/auth.ts
import { type AuthOptions } from "next-auth";
import { type SessionStrategy } from "next-auth";
import { getServerSession } from "next-auth/next";

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// For custom DjangoUser and JWT types to ensure they are recognized
import type { DjangoUser } from "@/types/next-auth";

// Define your environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        // The frontend sends a 'django_login_response' with the successful login data
        django_login_response: { label: "Django Login Response", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.django_login_response) {
          console.error("Credentials authorize: Missing Django login response.");
          return null;
        }

        try {
          // Parse the JSON data sent from the frontend
          const data = JSON.parse(credentials.django_login_response);

          // Check for required fields from the Django API response
          if (data.user && data.access) {
            // Return a NextAuth User object, populating it with data from Django
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.first_name || data.user.email,
              accessToken: data.access,
              refreshToken: data.refresh,
              djangoUser: data.user as DjangoUser,
            };
          }
          console.warn("Credentials authorize: User or access token missing from Django response.");
          return null;
        } catch (error: any) {
          console.error("Credentials authorize failed to parse JSON:", error.message || error);
          return null;
        }
      },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
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
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        let accessToken: string | undefined;
        let refreshToken: string | undefined;
        let djangoUser: DjangoUser | undefined;
        let userId: string | undefined;

        if (account.provider === "credentials") {
          const credentialsUser = user as { id: string; email: string; name?: string; accessToken: string; refreshToken?: string; djangoUser: DjangoUser; };
          accessToken = credentialsUser.accessToken;
          refreshToken = credentialsUser.refreshToken;
          djangoUser = credentialsUser.djangoUser;
          userId = credentialsUser.id;
          console.log("JWT Callback (Credentials): User signed in. ID:", userId, "Email:", credentialsUser.email);
        } else if (account.provider === "google") {
          console.log("JWT Callback (Google): Attempting Django social auth...");
          try {
            const djangoSocialAuthRes = await fetch(`${DJANGO_API_BASE_URL}/auth/google/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: account.access_token }),
            });
            const data = await djangoSocialAuthRes.json();
            console.log("Django Google Social Auth Raw Response Data:", data);

            if (djangoSocialAuthRes.ok) {
              accessToken = data.access;
              refreshToken = data.refresh;
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

        if (accessToken) token.accessToken = accessToken;
        if (refreshToken) token.refreshToken = refreshToken;
        if (djangoUser) token.djangoUser = djangoUser;
        if (userId) token.id = userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.user.accessToken = token.accessToken;
      }
      if (token.refreshToken) {
        session.user.refreshToken = token.refreshToken;
      }
      if (token.djangoUser) {
        session.user.djangoUser = token.djangoUser;
      }
      if (token.id) {
        session.user.id = token.id;
      }
      console.log("Session Callback: Session updated. User ID:", session.user.id, "Authenticated:", !!session.user.accessToken);
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const getAuthHeader = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  if (session?.user?.accessToken) {
    return `Bearer ${session.user.accessToken}`;
  }
  return null;
};
