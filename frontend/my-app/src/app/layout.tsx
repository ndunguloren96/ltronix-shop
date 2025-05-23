// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
// --- THE FIX IS HERE: Change { Header } to Header ---
import Header from '@/components/Header'; // <-- Changed to default import
// --- END FIX ---
import { Footer } from '@/components/Footer';

// NEW IMPORT FOR THE WRAPPER COMPONENT (from previous fix)
import AccessibilityReporterWrapper from '@/components/AccessibilityReporterWrapper';


const inter = Inter({ subsets: ['latin'] });

// Define global metadata for your site (App Router standard)
export const metadata: Metadata = {
  title: {
    default: 'Ltronix Shop - Your #1 Electronics Destination',
    template: '%s - Ltronix Shop',
  },
  description: 'Shop the latest electronics, gadgets, and tech accessories at Ltronix Shop. Fast delivery, secure payments, and excellent customer service in Kenya.',
  keywords: [
    'Ltronix Shop', 'electronics', 'gadgets', 'tech accessories', 'online shop', 'Kenya',
    'smartphones', 'laptops', 'gaming', 'audio', 'wearables', 'best prices', 'fast delivery'
  ],
  openGraph: {
    title: 'Ltronix Shop - Your #1 Electronics Destination',
    description: 'Shop the latest electronics, gadgets and tech accessories at Ltronix Shop. Fast delivery, secure payments, and excellent customer service in Kenya.',
    url: 'https://ltronix.co.ke',
    siteName: 'Ltronix Shop',
    locale: 'en_KE',
    type: 'website',
    images: [
      {
        url: 'https://ltronix.co.ke/og-image-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Ltronix Shop - Electronics and Gadgets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ltronix Shop',
    description: 'Shop the latest electronics, gadgets and tech accessories with Ltronix Shop in Kenya.',
    images: ['https://ltronix.co.ke/twitter-image-default.jpg'],
    creator: '@ltronix_shop',
  },
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
          <Header /> {/* This line remains the same */}
          <AccessibilityReporterWrapper>{children}</AccessibilityReporterWrapper>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}