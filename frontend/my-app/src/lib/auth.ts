// src/lib/auth.ts
import { type AuthOptions } from "next-auth";
import { type SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// Import OAuthConfig for type safety when defining custom OAuth providers
import { OAuthConfig } from "next-auth/providers/oauth";

// For custom DjangoUser and JWT types to ensure they are recognized
import type { DjangoUser } from "@/types/next-auth";

// Define your environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// IMPORTANT: Define these new environment variables for your Django OAuth Toolkit
// This should be the base URL of your Django backend, WITHOUT '/api/v1' or trailing slash.
// Examples:'http://localhost:8000'
const DJANGO_OAUTH_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL; // Or whatever you name this ENV var
const DJANGO_CLIENT_ID = process.env.NEXT_PUBLIC_DJANGO_CLIENT_ID;
const DJANGO_CLIENT_SECRET = process.env.NEXT_PUBLIC_DJANGO_CLIENT_SECRET;

// --- Debugging Logs for new ENV vars ---
console.log('NEXT_PUBLIC_DJANGO_BASE_URL:', DJANGO_OAUTH_BASE_URL);
console.log('NEXT_PUBLIC_DJANGO_CLIENT_ID:', DJANGO_CLIENT_ID);
console.log('NEXT_PUBLIC_DJANGO_CLIENT_SECRET:', DJANGO_CLIENT_SECRET ? '*****' : 'Undefined'); // Mask secret
// --- End Debugging Logs ---


export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Attempting credentials login for:", credentials?.email);
        // This is where your actual Django backend API call for credentials login should be.
        // Example (replace with your actual login API call):
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/auth/jwt/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
          });

          if (res.ok) {
            const data = await res.json();
            // Assuming your Django login API returns access_token and user data
            const user: DjangoUser = {
              id: data.user.id.toString(), // Ensure ID is a string
              email: data.user.email,
              name: data.user.first_name || data.user.email, // Use name if available
              accessToken: data.access, // The access token from Django
              refreshToken: data.refresh, // The refresh token from Django
              // Add other Django user fields you need
              djangoUser: data.user, // Store the full Django user object
            };
            return user;
          } else {
            console.error("Credentials login failed:", await res.json());
            return null;
          }
        } catch (error) {
          console.error("Error during credentials login:", error);
          return null;
        }
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

    // --- NEW: Django OAuth Toolkit Provider ---
    // Only add this provider if the necessary environment variables are set
    ...(DJANGO_OAUTH_BASE_URL && DJANGO_CLIENT_ID && DJANGO_CLIENT_SECRET
      ? [
          {
            id: "django-oauth", // This ID determines the callback path: /api/auth/callback/django-oauth
            name: "Django OAuth",
            type: "oauth",
            version: "2.0", // Django OAuth Toolkit uses OAuth 2.0

            // Django OAuth Toolkit Endpoints (adjust paths if yours are different)
            authorization: {
              url: `${DJANGO_OAUTH_BASE_URL}/o/authorize/`,
              params: { scope: "read write openid profile email" }, // Common scopes, adjust as per your Django setup
            },
            token: {
              url: `${DJANGO_OAUTH_BASE_URL}/o/token/`,
              // No params needed here typically, as client_id/secret are sent via basic auth or post body
            },
            userinfo: {
              url: `${DJANGO_OAUTH_BASE_URL}/o/userinfo/`,
              // This endpoint typically requires an Authorization: Bearer <access_token> header
              // NextAuth.js handles this automatically for OAuth providers.
            },
            // Client ID and Secret obtained from your Django OAuth Toolkit application
            clientId: DJANGO_CLIENT_ID,
            clientSecret: DJANGO_CLIENT_SECRET,

            // Map the profile data received from Django's userinfo endpoint to NextAuth.js's expected format
            profile(profile: any): DjangoUser {
              console.log("Django OAuth Profile received:", profile);
              return {
                id: profile.sub || profile.id.toString(), // 'sub' is standard for OIDC, 'id' for DOT
                name: profile.name || profile.email,
                email: profile.email,
                image: profile.picture || null, // If Django userinfo provides a picture URL
                // Store the full Django user profile if needed
                djangoUser: profile,
                // Access and refresh tokens will be added in the jwt callback
              };
            },
            // This is important for "Public" clients (like your Next.js app)
            // It tells NextAuth.js not to send the client_secret in the token request body,
            // as public clients cannot securely store secrets.
            checks: ["pkce", "state"], // PKCE (Proof Key for Code Exchange) is highly recommended for public clients
          } as OAuthConfig<DjangoUser>, // Type assertion
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

        if (account.provider === "credentials") {
          // If your `authorize` method returns { id, name, email, accessToken, djangoUser }, cast it.
          const credentialsUser = user as DjangoUser; // Assuming DjangoUser type includes accessToken and djangoUser
          accessToken = credentialsUser.accessToken;
          djangoUser = credentialsUser.djangoUser;
          if (credentialsUser.id) {
            token.id = credentialsUser.id;
          }
        } else if (account.provider === "google") {
          // For Google, you'll exchange the OAuth token for your Django backend's token
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
        } else if (account.provider === "django-oauth") {
          // --- NEW: Handle Django OAuth Toolkit callback ---
          // When using a custom OAuthProvider, NextAuth.js automatically handles
          // the code exchange and fetches userinfo.
          // The 'account' object will contain the access_token from Django.
          // The 'user' object will be the result of your 'profile' callback.
          accessToken = account.access_token;
          // The 'djangoUser' should already be populated by the 'profile' callback
          // if you returned 'djangoUser: profile' from there.
          djangoUser = user.djangoUser; // Assuming 'user' (from profile callback) has djangoUser
          token.id = user.id; // Ensure user ID is set on the token
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
