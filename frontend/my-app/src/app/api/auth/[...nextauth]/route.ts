// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiClient from '@/lib/apiClient';
import { JWT } from 'next-auth/jwt';
import { DjangoUser } from '@/types/next-auth';

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

interface AuthResponse {
  access: string; // Changed from access_token to match dj-rest-auth's default
  refresh: string; // Changed from refresh_token to match dj-rest-auth's default
  user: DjangoUser;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // Ensure endpoint is correct for token refresh
    const refreshedTokens = await apiClient<RefreshTokenResponse>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // Assuming 1 day expiry for this example
      refreshToken: refreshedTokens.refresh ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        django_login_response: { label: 'Django Login Response', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.django_login_response) {
          const user = JSON.parse(credentials.django_login_response) as AuthResponse;
          
          // If the Django response is valid, return a NextAuth.js user object
          if (user && user.access) {
            return {
              id: String(user.user.id),
              email: user.user.email,
              name: user.user.first_name || user.user.email,
              accessToken: user.access, // Use 'access' from the Django response
              refreshToken: user.refresh, // Use 'refresh' from the Django response
            };
          }
        }
        return null; // If no credentials or response is invalid, return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === 'google') {
          try {
            const response = await apiClient<AuthResponse>(
              '/auth/google/',
              {
                method: 'POST',
                body: JSON.stringify({ access_token: account.access_token }),
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
            const { access, refresh, user: apiUser } = response; // Updated to `access` and `refresh`
            token.accessToken = access;
            token.refreshToken = refresh;
            token.id = String(apiUser.id);
            token.email = apiUser.email;
            token.name = apiUser.first_name || apiUser.email;
            token.djangoUser = apiUser;
          } catch (error) {
            console.error('Error converting Google token', error);
            return { ...token, error: 'GoogleTokenConversionError' };
          }
        } else {
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.id = String(user.id);
        }
      }

      if (typeof token.accessTokenExpires === 'number' && Date.now() < token.accessTokenExpires) {
        return token;
      }

      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.accessToken = token.accessToken as string;
      session.user.error = token.error as string | undefined;
      session.user.djangoUser = token.djangoUser as DjangoUser; // Use DjangoUser type
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
