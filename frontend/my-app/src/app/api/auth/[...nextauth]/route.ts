// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'your@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (credentials?.email === 'user@example.com' && credentials?.password === 'password123') {
          return { id: '1', name: 'Donald Trump', email: 'user@example.com' };
        } else {
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // debug: process.env.NODE_ENV === 'development',
};

// THE KEY CHANGE: Export GET and POST directly by calling NextAuth with the options
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);

//can also be used:  export { handler as GET, handler as POST }; 