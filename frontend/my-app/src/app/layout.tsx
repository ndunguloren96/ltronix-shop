'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { usePathname } from 'next/navigation';

import { ClientErrorBoundary } from '../components/ClientErrorBoundary';
import { ColorModeScript } from '@chakra-ui/react';
import chakraConfig from '../chakra.config';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showFooter = !pathname.startsWith('/auth');

  return (
    <html lang="en">
      <head>
        {/* Chakra UI FOUC Fix: Must be placed before body */}
        <ColorModeScript initialColorMode={chakraConfig.initialColorMode} />
      </head>
      <body className={inter.className}>
        <ClientErrorBoundary>
          <AppProviders session={null}>
            <Header />
            <main style={{ flexGrow: 1, minHeight: '80vh' }}>{children}</main>
            {showFooter && <Footer />}
          </AppProviders>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}

