// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header'; // Your Header component
import { Footer } from '@/components/Footer'; // Your Footer component
import AxeReporter from '@/components/AxeReporter'; // Import the AxeReporter component

const inter = Inter({ subsets: ['latin'] });

// Define global metadata for your site (App Router standard)
export const metadata: Metadata = {
  title: {
    default: 'Ltronix Shop - Your #1 Electronics Destination',
    template: '%s - Ltronix Shop', // This will append " - Ltronix Shop" to page-specific titles
  },
  description: 'Shop the latest electronics, gadgets, and tech accessories at Ltronix Shop. Fast delivery, secure payments, and excellent customer service in Kenya.',
  keywords: [
    'Ltronix Shop', 'electronics', 'gadgets', 'tech accessories', 'online shop', 'Kenya',
    'smartphones', 'laptops', 'gaming', 'audio', 'wearables', 'best prices', 'fast delivery'
  ],
  openGraph: {
    title: 'Ltronix Shop - Your #1 Electronics Destination',
    description: 'Shop the latest electronics, gadgets, and tech accessories at Ltronix Shop. Fast delivery, secure payments, and excellent customer service in Kenya.',
    url: 'https://ltronix.co.ke', // IMPORTANT: Replace with your actual domain when deploying
    siteName: 'Ltronix Shop',
    locale: 'en_KE', // Specific to Kenya
    type: 'website',
    images: [
      {
        url: 'https://ltronix.co.ke/og-image-default.jpg', // IMPORTANT: Provide a path to an actual default OG image
        width: 1200,
        height: 630,
        alt: 'Ltronix Shop - Electronics and Gadgets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ltronix Shop',
    description: 'Shop the latest electronics, gadgets, and tech accessories with Ltronix Shop in Kenya.',
    images: ['https://ltronix.co.ke/twitter-image-default.jpg'], // IMPORTANT: Provide a path to an actual default Twitter image
    creator: '@ltronix_shop', // Optional: Your Twitter handle
  },
  // You can also add more meta tags like:
  // viewport: 'width=device-width, initial-scale=1',
  // themeColor: '#yourBrandColor', // Example: '#3182CE' if using brand.500
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest',
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
          {/* Conditionally wrap children with AxeReporter only in development */}
          {process.env.NODE_ENV === 'development' ? (
            <AxeReporter>{children}</AxeReporter>
          ) : (
            children
          )}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}