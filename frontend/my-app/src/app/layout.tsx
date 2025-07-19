// frontend/my-app/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'; // Assuming this provides ChakraProvider
import Header from '../components/Header';
import Footer from '../components/Footer'; // Assuming you have a Footer component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ltronix Shop',
  description: 'Your one-stop shop for electronics and gadgets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Header is outside of main content area for consistency */}
          <Header />
          {children}
          {/* Footer is outside of main content area for consistency */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
