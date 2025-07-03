import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Define your Django backend API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// NextAuth.js Google OAuth Provider Credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Django Backend's OAuth Toolkit Application Credentials
const DJANGO_OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_DJANGO_CLIENT_ID;
const DJANGO_OAUTH_CLIENT_SECRET = process.env.NEXT_PUBLIC_DJANGO_CLIENT_SECRET;

interface DjangoUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  key?: string;
}

export const authOptions = {
  providers: [
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
          const res = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const user: DjangoUser = {
              id: data.user?.pk || data.user?.id || data.pk || data.id,
              email: data.user?.email || credentials.email,
              first_name: data.user?.first_name,
              last_name: data.user?.last_name,
              key: data.key,
            };
            console.log('Django credentials login successful for user:', user.email, 'Token present:', !!user.key);
            return user;
          } else {
            const errorData = await res.json();
            console.error('Django credentials login failed (Status:', res.status, '):', errorData);
            return null;
          }
        } catch (err) {
          console.error('Error during Django API credentials login call:', err);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      authorization: { params: { access_type: 'offline', prompt: 'consent' } },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const djangoUser = user as DjangoUser;
        if (djangoUser.key) {
          token.accessToken = djangoUser.key;
        }
        token.id = djangoUser.id;
        token.djangoUserId = djangoUser.id;
        token.email = djangoUser.email;
        token.name = djangoUser.first_name || djangoUser.email;
      }

      if (account?.provider === 'google' && account.access_token) {
        if (!DJANGO_OAUTH_CLIENT_ID || !DJANGO_OAUTH_CLIENT_SECRET) {
          console.error('Django OAuth Toolkit Application client ID or secret missing in .env.local for Google convert-token. Please check your .env.local.');
          return token;
        }

        try {
          console.log('Attempting to convert Google token to Django token...');
          const requestBody = new URLSearchParams({
            grant_type: 'convert_token',
            backend: 'google-oauth2',
            client_id: DJANGO_OAUTH_CLIENT_ID,
            client_secret: DJANGO_OAUTH_CLIENT_SECRET,
            token: account.access_token,
          }).toString();

          console.log('Django convert-token request URL:', `${API_BASE_URL}/auth/convert-token/`);
          console.log('Django convert-token request body (form-urlencoded):', requestBody);

          const res = await fetch(`${API_BASE_URL}/auth/convert-token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: requestBody,
          });

          if (res.ok) {
            const djangoTokenData = await res.json();
            if (djangoTokenData && djangoTokenData.access_token) {
              token.accessToken = djangoTokenData.access_token;
              token.refreshToken = djangoTokenData.refresh_token;
              console.log('Google token successfully converted to Django token. Access Token received.');
            } else {
              console.warn('Django token conversion successful but no access_token or refresh_token found:', djangoTokenData);
            }
          } else {
            let errorData;
            const text = await res.text();
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = text;
            }
            console.error('Django token conversion failed (Status:', res.status, '):', errorData);
          }
        } catch (err) {
          console.error('Error during Django API social token conversion (network/unhandled exception):', err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string;
      }
      if (token.djangoUserId) {
        session.user.id = token.djangoUserId as string;
      }
      session.user.email = token.email as string;
      session.user.name = token.name as string;

      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://'),
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
