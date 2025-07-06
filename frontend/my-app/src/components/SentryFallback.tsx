    // src/components/SentryFallback.tsx
    'use client'; // This component runs on the client

    import React from 'react';
    import * as Sentry from "@sentry/nextjs"; // Import Sentry SDK
    import { FallbackProps } from 'react-error-boundary'; // Import FallbackProps type

    // This component will be used as the fallbackRender prop for ErrorBoundary
    export const SentryFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
      // Ensure Sentry is initialized on the client if not already
      // (though it should be via Sentry.init in your next.config.js or _app.tsx/layout.tsx if configured for client)

      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red', border: '1px solid red', margin: '20px' }}>
          <h2>An unexpected error occurred in the frontend.</h2>
          <p>We're sorry for the inconvenience. Our team has been notified.</p>
          <p style={{ fontSize: '0.8em', color: '#666', wordBreak: 'break-all' }}>Error Details: {error.message}</p>
          <button
            onClick={() => {
              // Only show report dialog if Sentry is active and available on the client
              if (Sentry.lastEventId()) {
                Sentry.showReportDialog({ eventId: Sentry.lastEventId() });
              }
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
    };
    
