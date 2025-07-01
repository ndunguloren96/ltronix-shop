import './globals.css';
import { Inter } from 'next/font/google';

// AppProviders wraps all context providers
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

// --- Sentry & Datadog RUM instrumentation ---
import * as Sentry from '@sentry/nextjs';
import { datadogRum } from '@datadog/browser-rum';

// Sentry setup (SSR-safe)
if (typeof window === 'undefined') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV,
    tracesSampleRate: 0.5,
    release: process.env.NEXT_PUBLIC_RELEASE_VERSION || 'dev',
  });
}

// Datadog RUM setup (client only)
if (typeof window !== 'undefined' && window.DD_RUM === undefined) {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    site: process.env.NEXT_PUBLIC_DATADOG_SITE,
    service: 'ltronix-shop-frontend',
    env: process.env.NEXT_PUBLIC_ENV,
    version: process.env.NEXT_PUBLIC_RELEASE_VERSION || 'dev',
    sampleRate: 100,
    trackInteractions: true,
    defaultPrivacyLevel: 'mask-user-input',
  });
  datadogRum.startSessionReplayRecording();
}

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
      <body className={inter.className}>
        <AppProviders session={session}>
          <Header />
          <main style={{ flexGrow: 1, minHeight: '80vh' }}>
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
