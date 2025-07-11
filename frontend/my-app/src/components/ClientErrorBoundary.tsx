'use client';

import * as Sentry from "@sentry/nextjs";
import { ErrorBoundary } from 'react-error-boundary';

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

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={SentryFallback}
      onError={(error, info) =>
        Sentry.captureException(error, {
          extra: { componentStack: info.componentStack },
        })
      }
    >
      {children}
    </ErrorBoundary>
  );
}