// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Define your Django backend URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

export const authOptions = {
  // Configure authentication providers
  providers: [
    // Existing Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('Authentication attempt: Missing email or password.');
          return null;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (res.ok) {
            const user = await res.json();
            // Assuming dj-rest-auth returns a 'key' for token-based auth
            // or implicitly sets a session cookie if TOKEN_MODEL is None and SESSION_LOGIN is True
            if ('key' in user && typeof user.key === 'string') {
              (user as any).accessToken = user.key; // Store Django's token key
            } else if (res.headers.get('set-cookie')) {
              // If using session auth, NextAuth might need to handle the session cookie
              // For 'jwt' strategy, we still prefer a token for consistency.
              console.log('Django login successful (Session based). User:', user.email);
            }
            console.log('Django login successful for user (Credentials):', user.email);
            return user;
          } else {
            const errorData = await res.json();
            console.error('Django login failed (Status:', res.status, '):', errorData);
            return null;
          }
        } catch (error) {
          console.error('Error during Django API login call:', error);
          return null;
        }
      },
    }),
    // NEW: Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { access_type: 'offline', prompt: 'consent' } },
    }),
  ],
  // Session strategy: 'jwt' is recommended for stateless APIs
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  // Callbacks to customize JWT and session data
  callbacks: {
    async jwt({ token, user, account }) {
      // Handle Credentials provider user object (from Django login)
      if (user) {
        if ('accessToken' in user && typeof user.accessToken === 'string') {
          token.accessToken = user.accessToken;
        }
        if ('id' in user) token.id = user.id;
        if ('email' in user) token.email = user.email;
        // Optionally store more user details from Django
      }

      // Handle Google OAuth provider
      if (account?.provider === 'google' && account.access_token) {
        try {
          // *** THIS IS THE CRITICAL CHANGE ***
          // Send the Google access token to Django's drf-social-oauth2 convert-token endpoint
          const res = await fetch(`${API_BASE_URL}/auth/convert-token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'convert_token',
              backend: 'google-oauth2', // This needs to match your SOCIAL_AUTH_AUTHENTICATION_BACKENDS entry
              client_id: process.env.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY, // Your Django backend's Google Client ID
              client_secret: process.env.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET, // Your Django backend's Google Client Secret
              token: account.access_token, // The Google access token received by NextAuth.js
            }),
          });

          if (res.ok) {
            const djangoTokenData = await res.json();
            // Assuming drf-social-oauth2 returns an access_token (which is a Django token)
            if (djangoTokenData && 'access_token' in djangoTokenData && typeof djangoTokenData.access_token === 'string') {
              token.accessToken = djangoTokenData.access_token; // Store Django's access token
              // You might get user info from Django's convert-token response too,
              // or you can make a separate call to /auth/user/ with this new Django token.
              // For simplicity, we'll assume we fetch user details later if needed.
              console.log('Django token conversion successful (Google). Django Access Token:', djangoTokenData.access_token);
            } else {
              console.warn('Django token conversion successful but no access_token found:', djangoTokenData);
            }
          } else {
            const errorData = await res.json();
            console.error('Django token conversion failed (Status:', res.status, '):', errorData);
            // Propagate the error to prevent login if conversion failed
            // throw new Error(errorData.detail || 'Django social token conversion failed');
          }
        } catch (error) {
          console.error('Error during Django API social token conversion:', error);
          // throw new Error('Could not connect to Django for social token conversion');
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, such as an access_token from a provider.
      if (token.accessToken) { // This is the Django token (from credentials or social)
        session.accessToken = token.accessToken as string;
      }

      // Ensure session.user exists before assigning properties
      session.user = session.user || {};
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      // Add other user properties you might want from the token
      // e.g., session.user.name = token.name as string;

      return session;
    },
  },
  // Custom pages for authentication flows
  pages: {
    signIn: '/auth/login', // Specifies your custom login page
  },
  // Secret for the NextAuth.js instance
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Uncomment for debugging in development
};

// Export GET and POST handlers
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);