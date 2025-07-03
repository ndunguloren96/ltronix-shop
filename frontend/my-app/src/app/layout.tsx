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

// --- Part 7 Additions: Frontend Monitoring (Sentry ErrorBoundary only here) ---
import * as Sentry from "@sentry/nextjs"; // Import Sentry SDK (for ErrorBoundary)
import { ErrorBoundary } from '@sentry/nextjs'; // Sentry's recommended ErrorBoundary component

// --- FOUC Fix: Chakra UI ColorModeScript ---
import { ColorModeScript } from '@chakra-ui/react'; // Import ColorModeScript
import { theme } from '../theme'; // CORRECTED PATH: Import your Chakra UI theme from '../theme'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop', // Your actual site title
  description: 'Your one-stop shop for electronics', // Your actual site description
};

// Create a Fallback Component for Sentry ErrorBoundary
const SentryFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div style={{ padding: '20px', textAlign: 'center', color: 'red', border: '1px solid red', margin: '20px' }}>
    <h2>An unexpected error occurred in the frontend.</h2>
    <p>We're sorry for the inconvenience. Our team has been notified.</p>
    <p style={{ fontSize: '0.8em', color: '#666', wordBreak: 'break-all' }}>Error Details: {error.message}</p>
    <button
      onClick={() => {
        Sentry.showReportDialog({ eventId: Sentry.lastEventId() });
        resetErrorBoundary(); // Reset the error boundary to try re-rendering
      }}
      style={{
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Report Feedback & Reload
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
        {/* Datadog RUM Snippet - Replace with your actual client token and application ID */}
        <script>
          (function(h,o,u,n,d) {
            h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}};
            var t=o.createElement(u);t.async=1;t.src=n;
            o.getElementsByTagName(u)[0].parentNode.appendChild(t);
          })(window,document,'script','https://www.datadoghq-browser-agent.com/datadog-rum-latest.js','DD_RUM');
          DD_RUM.onReady(function() {
            DD_RUM.init({
              clientToken: 'YOUR_DATADOG_CLIENT_TOKEN',
              applicationId: 'YOUR_DATADOG_APPLICATION_ID',
              site: 'datadoghq.com',
              service: 'ltronix-shop-frontend',
              env: 'production',
              version: '1.0.0',
              sessionSampleRate: 100,
              sessionReplaySampleRate: 20,
              trackUserInteractions: true,
              trackResources: true,
              trackLongTasks: true,
              defaultPrivacyLevel: 'mask-user-input',
            });
          });
        </script>
        {/* CRITICAL FOUC FIX: Add ColorModeScript here */}
        {/* This script must be placed before any Chakra UI components are rendered */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} /> 

        {/* Sentry ErrorBoundary to catch React errors and report them */}
        <ErrorBoundary fallbackRender={SentryFallback}>
          {/* AppProviders wraps the entire application, including ChakraProvider and SessionProvider */}
          {/* Datadog RUM will be initialized within AppProviders' client-side context */}
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
