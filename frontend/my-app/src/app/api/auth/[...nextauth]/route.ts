import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiClient from '@/lib/apiClient';
import { JWT } from 'next-auth/jwt';

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    pk: string;
    email: string;
    first_name: string;
  };
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }
        try {
          const user = await apiClient<AuthResponse>('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (user && user.access_token) {
            return {
              id: user.user.pk,
              email: user.user.email,
              name: user.user.first_name,
              accessToken: user.access_token,
              refreshToken: user.refresh_token,
            };
          }
          return null;
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Invalid credentials');
        }
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
            const { access_token, refresh_token, user: apiUser } = response;
            token.accessToken = access_token;
            token.refreshToken = refresh_token;
            token.id = apiUser.pk;
            token.email = apiUser.email;
            token.name = apiUser.first_name;
          } catch (error) {
            console.error('Error converting Google token', error);
            return { ...token, error: 'GoogleTokenConversionError' };
          }
        } else {
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.id = user.id;
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
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
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