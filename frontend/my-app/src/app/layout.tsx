// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer'; // Import your Footer component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ltronix Shop',
  description: 'Your one-stop shop for electronics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Footer /> {/* Add the Footer component here */}
        </Providers>
      </body>
    </html>
  );
}