// frontend/my-app/src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import * as Sentry from "@sentry/nextjs";
import { ErrorBoundary } from 'react-error-boundary';

import { ColorModeScript } from '@chakra-ui/react';
import { theme } from '../theme'; // ✅ FIXED PATH

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop',
  description: 'Your one-stop shop for electronics',
};

const SentryFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div style={{ padding: '20px', textAlign: 'center', color: 'red', border: '1px solid red', margin: '20px' }}>
    <h2>An unexpected error occurred in the frontend.</h2>
    <p>We're sorry for the inconvenience. Our team has been notified.</p>
    <p style={{ fontSize: '0.8em', color: '#666', wordBreak: 'break-all' }}>Error Details: {error.message}</p>
    <button
      onClick={() => {
        Sentry.showReportDialog({ eventId: Sentry.lastEventId() });
        resetErrorBoundary();
      }}
      style={{
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      Report Feedback & Reload
    </button>
  </div>
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ErrorBoundary
          fallbackRender={SentryFallback}
          onError={(error, info) =>
            Sentry.captureException(error, {
              extra: { componentStack: info.componentStack },
            })
          }
        >
          <AppProviders session={session}>
            <Header />
            <main style={{ flexGrow: 1, minHeight: '80vh' }}>{children}</main>
            <Footer />
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}

