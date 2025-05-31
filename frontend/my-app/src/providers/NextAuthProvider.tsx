// src/providers/NextAuthProvider.tsx
'use client';

// This component wraps your Next.js application with NextAuth's SessionProvider.
// It allows all components within its scope to access the session data using `useSession()`.

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth'; // Import Session type

interface NextAuthProviderProps {
  children: React.ReactNode;
  // Next.js provides the session prop to the layout.
  // This is typically passed from the server-side `getSession` call or similar.
  session: Session | null;
}

export default function NextAuthProvider({ children, session }: NextAuthProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}