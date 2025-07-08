// frontend/my-app/src/app/layout.tsx

import './globals.css';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { ClientErrorBoundary } from '../components/ClientErrorBoundary';
import { ColorModeScript } from '@chakra-ui/react';
import chakraTheme from '../chakra.config';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop',
  description: 'Your one-stop shop for electronics',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        {/* Chakra UI FOUC Fix: Must be placed before body */}
        <ColorModeScript initialColorMode={chakraTheme.config.initialColorMode} />
      </head>
      <body className={inter.className}>
        <ClientErrorBoundary>
          <AppProviders session={session}>
            <Header />
            <main style={{ flexGrow: 1, minHeight: '80vh' }}>{children}</main>
            <Footer />
          </AppProviders>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
