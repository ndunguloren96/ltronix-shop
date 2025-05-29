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
            if ('key' in user && typeof user.key === 'string') {
              (user as any).accessToken = user.key;
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
      // Request refresh token for long-lived access
      authorization: { params: { access_type: 'offline', prompt: 'consent' } },
      // Added authorization parameters to correctly fetch refresh token
      // This helps with managing long-lived sessions or re-authenticating without user interaction.
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
      if (user) {
        // For credentials provider, user object contains accessToken, id, email from Django
        if ('accessToken' in user && typeof user.accessToken === 'string') {
          token.accessToken = user.accessToken;
        }
        if ('id' in user) token.id = user.id;
        if ('email' in user) token.email = user.email;
      }

      // For Google (or other OAuth) provider, handle linking social accounts to your Django backend here.
      if (account?.provider === 'google' && account.access_token) {
        try {
          // Send the Google access token to your Django backend's social login endpoint
          // Use the 'access_token' from the Google account, which django-allauth's
          // Google provider expects to exchange for a Django user and token.
          const res = await fetch(`${API_BASE_URL}/auth/google/`, { // Changed /auth/google/login/ to /auth/google/ based on common allauth patterns. Verify your Django URL for Google social login.
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: account.access_token,
              id_token: account.id_token, // id_token is also often useful for verification
            }),
          });

          if (res.ok) {
            const djangoUser = await res.json();
            // Assuming your Django backend returns a key (token) upon successful social login
            if (djangoUser && 'key' in djangoUser && typeof djangoUser.key === 'string') {
              token.accessToken = djangoUser.key; // Store Django's token
              token.id = djangoUser.user.pk; // Store Django user ID
              token.email = djangoUser.user.email; // Store Django user email
              console.log('Django social login successful for user (Google):', djangoUser.user.email);
            } else {
              console.warn('Django social login successful but no key found:', djangoUser);
            }
          } else {
            const errorData = await res.json();
            console.error('Django social login failed (Status:', res.status, '):', errorData);
            // Optionally, you might want to throw an error here to prevent login
            // throw new Error(errorData.detail || 'Django social login failed');
          }
        } catch (error) {
          console.error('Error during Django API social login call:', error);
          // throw new Error('Could not connect to Django for social login');
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, such as an access_token from a provider.
      if (token.accessToken) { // From Django credentials or social login
        session.accessToken = token.accessToken as string;
      }
      // Note: We are now primarily relying on the Django backend to provide a unified token.
      // If you still need the raw googleAccessToken on the frontend for specific Google API calls,
      // you would store it in the token object in the jwt callback. For now, it's removed
      // to simplify and unify auth through Django.
      // if (token.googleAccessToken) {
      //   session.googleAccessToken = token.googleAccessToken as string;
      // }

      // Ensure session.user exists before assigning properties
      session.user = session.user || {};
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      // If you're getting user name from Google and storing it in Django:
      // if (token.name) session.user.name = token.name as string;

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