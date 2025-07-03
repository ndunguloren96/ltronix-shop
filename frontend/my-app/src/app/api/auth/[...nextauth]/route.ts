import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Define your Django backend API base URL from environment variables
// This should be the root of your Django API, e.g., https://your-ngrok-url.ngrok-free.app/api/v1
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// NextAuth.js Google OAuth Provider Credentials (from Google Cloud Console, for NextAuth to talk to Google)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Django Backend's OAuth Toolkit Application Credentials (from Django Admin -> OAuth Toolkit -> Applications)
// These are the client_id and client_secret for the 'Confidential' OAuth2 Application
// that NextAuth.js will send to Django's /convert-token/ endpoint.
const DJANGO_OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_DJANGO_CLIENT_ID;
const DJANGO_OAUTH_CLIENT_SECRET = process.env.NEXT_PUBLIC_DJANGO_CLIENT_SECRET;

// Type definition for the user object expected from Django login/registration
interface DjangoUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  key?: string; // dj-rest-auth token (if TOKEN_MODEL is used and returned)
}

export export const authOptions = {
  // You had httpOptions here, which is not a standard NextAuth.js option for `authOptions`.
  // If you intended to set a fetch timeout, it should be applied to individual fetch calls.
  // Removing it to avoid misconfiguration.

  providers: [
    // 1. Credentials Provider (Email/Password Login)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('Authentication attempt (Credentials): Missing email or password.');
          return null;
        }

        try {
          // Call Django's dj-rest-auth login endpoint
          const res = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // dj-rest-auth login expects JSON
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            // Assuming dj-rest-auth returns { key: "your_token", user: { id, email, ... } }
            // or { token: "your_token", user: { id, email, ... } } depending on TOKEN_MODEL
            const user: DjangoUser = {
              id: data.user?.pk || data.user?.id || data.pk || data.id, // Prioritize user.pk/id, then root pk/id
              email: data.user?.email || credentials.email,
              first_name: data.user?.first_name,
              last_name: data.user?.last_name,
              key: data.key, // The token from dj-rest-auth
            };

            // Log for debugging
            console.log('Django credentials login successful for user:', user.email, 'Token present:', !!user.key);
            return user;
          } else {
            const errorData = await res.json();
            console.error('Django credentials login failed (Status:', res.status, '):', errorData);
            return null; // Return null on failure
          }
        } catch (err) {
          console.error('Error during Django API credentials login call:', err);
          return null; // Return null on network/unexpected errors
        }
      },
    }),

    // 2. Google OAuth Provider
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID!, // Ensure environment variable is set
      clientSecret: GOOGLE_CLIENT_SECRET!, // Ensure environment variable is set
      // Request offline access for a refresh token and force consent screen
      authorization: { params: { access_type: 'offline', prompt: 'consent' } },
    }),
  ],

  // Session configuration
  session: {
    strategy: 'jwt', // Use JWT strategy for stateless API communication
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // JWT signing secret
  },

  // Callbacks to customize JWT and session data
  callbacks: {
    // This callback is called when a JWT is created, updated, or when the user signs in/up.
    async jwt({ token, user, account }) {
      // Step 1: Handle initial user object from `authorize` (Credentials Provider)
      if (user) {
        const djangoUser = user as DjangoUser; // Cast `user` to our DjangoUser interface
        if (djangoUser.key) {
          token.accessToken = djangoUser.key; // Store Django's token for API calls
        }
        token.id = djangoUser.id; // NextAuth's internal user ID
        token.djangoUserId = djangoUser.id; // Explicitly store Django's user ID
        token.email = djangoUser.email;
        token.name = djangoUser.first_name || djangoUser.email; // Use first_name if available
      }

      // Step 2: Handle Google OAuth provider token conversion to Django token
      if (account?.provider === 'google' && account.access_token) {
        // Ensure backend credentials are available
        if (!DJANGO_OAUTH_CLIENT_ID || !DJANGO_OAUTH_CLIENT_SECRET) {
          console.error('Django OAuth Toolkit Application client ID or secret missing in .env.local for Google convert-token. Please check your .env.local.');
          // Do NOT return null here as it prevents the token from being updated.
          // The login will proceed but without a Django token in the session.
          return token;
        }

        try {
          // Log the exact URL and body to debug network issues
          console.log('Attempting to convert Google token to Django token...');
          const requestBody = new URLSearchParams({
            grant_type: 'convert_token',
            backend: 'google-oauth2', // Must match your SOCIAL_AUTH_AUTHENTICATION_BACKENDS entry in Django
            client_id: DJANGO_OAUTH_CLIENT_ID, // Django Backend's OAuth Toolkit App Client ID
            client_secret: DJANGO_OAUTH_CLIENT_SECRET, // Django Backend's OAuth Toolkit App Client Secret
            token: account.access_token, // Google's access token received by NextAuth.js
          }).toString();

          console.log('Django convert-token request URL:', `${API_BASE_URL}/auth/convert-token/`);
          console.log('Django convert-token request body (form-urlencoded):', requestBody);

          // Call Django's drf-social-oauth2 convert-token endpoint
          const res = await fetch(`${API_BASE_URL}/auth/convert-token/`, {
            method: 'POST',
            // CRITICAL: Content-Type must be 'application/x-www-form-urlencoded' for drf-social-oauth2's convert-token
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: requestBody,
          });

          if (res.ok) {
            const djangoTokenData = await res.json();
            if (djangoTokenData && djangoTokenData.access_token) {
              token.accessToken = djangoTokenData.access_token; // Store Django's access token
              token.refreshToken = djangoTokenData.refresh_token; // Store Django's refresh token
              // You can optionally make another call to /api/v1/auth/user/ here
              // using `token.accessToken` to fetch and store more Django user details if needed.
              console.log('Google token successfully converted to Django token. Access Token received.');
            } else {
              console.warn('Django token conversion successful but no access_token or refresh_token found:', djangoTokenData);
            }
          } else {
            // --- FIX: handle non-JSON error responses (like HTML error pages) gracefully ---
            let errorData;
            const text = await res.text();
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = text;
            }
            console.error('Django token conversion failed (Status:', res.status, '):', errorData);
            // This is where "invalid_client" or "unauthorized" errors from Django would appear.
          }
        } catch (err) {
          console.error('Error during Django API social token conversion (network/unhandled exception):', err);
        }
      }
      return token;
    },

    // This callback is called whenever a session is accessed (e.g., via useSession)
    async session({ session, token }) {
      // Add custom properties from the JWT token to the session object
      // These properties will be available on the client-side via useSession()
      if (token.accessToken) {
        session.accessToken = token.accessToken as string; // Django token for backend API calls
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string; // Django refresh token
      }
      if (token.djangoUserId) {
        session.user.id = token.djangoUserId as string; // Ensure Django user ID is in session.user
      }
      session.user.email = token.email as string;
      session.user.name = token.name as string;

      return session;
    },
  },

  // Custom pages for authentication flows
  pages: {
    signIn: '/auth/login', // Specifies your custom login page
    error: '/auth/login', // Redirect to login page on OAuthCallback errors
  },

  // Cookie settings (important for cross-domain and security)
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // CRITICAL: 'secure' should be true if your NEXTAUTH_URL is HTTPS (e.g., Ngrok for frontend)
        // For http://localhost:3000, secure: false is typically okay and needed.
        // It should be true only if the connection between browser and Next.js is HTTPS.
        secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://'),
      },
    },
    // The 'state' and 'pkce.code_verifier' cookies (implicitly handled by NextAuth)
    // also need to respect the domain/secure settings implied by NEXTAUTH_URL.
  },

  // Secret for the NextAuth.js instance (used for JWT signing and cookie encryption)
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug logging in development for easier troubleshooting
  debug: process.env.NODE_ENV === 'development',
};

// Export GET and POST handlers for Next.js API Routes
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
