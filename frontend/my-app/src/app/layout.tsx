// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // This correctly imports your Providers component
import Header from '@/components/Header'; 
import { Footer } from '@/components/Footer';
import AccessibilityReporterWrapper from '@/components/AccessibilityReporterWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ltronix Shop', 
  description: 'Your ultimate online electronics store', 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* This will now correctly provide Session and Chakra context */}
          <ChakraProvider>
            <Toaster position="top-right" />
            <Header /> {/* This should now correctly render */}
            <AccessibilityReporterWrapper>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AccessibilityReporterWrapper>
            <Footer />
          </ChakraProvider>
        </Providers>
      </body>
    </html>
  );
}