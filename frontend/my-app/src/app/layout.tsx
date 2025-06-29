// frontend/my-app/src/app/layout.tsx
import './globals.css'; // Your global CSS imports
import { Inter } from 'next/font/google'; // Assuming you use Inter font

// Import your combined AppProviders
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
// -------------------------------------------------------------------

import { getServerSession } from 'next-auth'; // Import getServerSession for NextAuth.js
import { authOptions } from './api/auth/[...nextauth]/route'; // Import authOptions from your NextAuth config

// --- Part 7 Additions: Frontend Monitoring ---
import * as Sentry from "@sentry/nextjs"; // Import Sentry SDK
import { datadogRum } from '@datadog/browser-rum'; // Import Datadog RUM SDK
import { ErrorBoundary } from '@sentry/nextjs'; // Sentry's recommended ErrorBoundary component

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop', // Your actual site title
  description: 'Your one-stop shop for electronics', // Your actual site description
};

// Initialize Datadog RUM early (before any React rendering)
// Ensure NEXT_PUBLIC_DATADOG_APP_ID, NEXT_PUBLIC_DATADOG_CLIENT_TOKEN, NEXT_PUBLIC_DATADOG_SITE are set in .env.local
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DATADOG_APP_ID && process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN) {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com', // e.g., 'datadoghq.com' or 'eu.datadoghq.com'
    service: 'ltronix-shop-frontend', // Name of your service
    env: process.env.NEXT_PUBLIC_ENV || 'development', // e.g., 'development', 'staging', 'production'
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '1.0.0', // Use Vercel commit SHA or a default
    sampleRate: 100, // Capture 100% of sessions for development; adjust in production
    trackInteractions: true, // Track user interactions
    trackResources: true, // Track resource loading
    trackLongTasks: true, // Track long tasks
    defaultActionName: 'User Interaction', // Default name for user interaction actions
    beforeSend: (event) => {
      // Optional: Add logic to filter or modify RUM events before sending
      // For example, to remove sensitive data
      return event;
    },
  });
  datadogRum.startSessionReplayRecording(); // Start recording session replays
}

// Create a Fallback Component for Sentry ErrorBoundary
const SentryFallback = ({ error }: { error: Error }) => (
  <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
    <h2>An unexpected error occurred.</h2>
    <p>We're sorry for the inconvenience. Our team has been notified.</p>
    <p style={{ fontSize: '0.8em', color: '#666' }}>Error Details: {error.message}</p>
    <button onClick={() => Sentry.showReportDialog({ eventId: Sentry.lastEventId() })}>
      Report Feedback
    </button>
  </div>
);


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
        {/* Sentry ErrorBoundary to catch React errors and report them */}
        <ErrorBoundary fallback={SentryFallback}>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}

