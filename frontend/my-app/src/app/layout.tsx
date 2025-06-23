// frontend/my-app/src/app/layout.tsx
import './globals.css'; // Your global CSS imports
import { Inter } from 'next/font/google'; // Assuming you use Inter font

// Import your combined AppProviders (note the name change from 'Providers' to 'AppProviders')
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
// -------------------------------------------------------------------

import { getServerSession } from 'next-auth'; // Import getServerSession for NextAuth.js
import { authOptions } from './api/auth/[...nextauth]/route'; // Import authOptions from your NextAuth config

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop', // Your actual site title
  description: 'Your one-stop shop for electronics', // Your actual site description
};

// This is a Server Component, so we fetch the session here
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch session on the server side using getServerSession
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* AppProviders wraps the entire application */}
        {/* We pass the fetched session to SessionProvider, which is nested inside AppProviders */}
        <AppProviders session={session}>
          <Header /> {/* Your global header, now correctly imported */}
          {/* Main content area; flexGrow: 1 ensures it takes available space */}
          <main style={{ flexGrow: 1, minHeight: '80vh' }}>
            {children}
          </main>
          <Footer /> {/* Your global footer, now correctly imported */}
        </AppProviders>
      </body>
    </html>
  );
}
