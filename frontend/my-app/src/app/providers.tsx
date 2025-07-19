// frontend/my-app/src/app/providers.tsx
'use client';

import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
// REMOVED: import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '../components/ErrorBoundary';
import theme from '../theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});

// REMOVED: session prop from interface
interface ProvidersProps { // Renamed from AppProvidersProps to ProvidersProps
  children: React.ReactNode;
}

// Renamed from AppProviders to Providers, and removed session prop
export function Providers({ children }: ProvidersProps) {
  return (
    // REMOVED: <SessionProvider session={session}>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster
          position="bottom-center"
          toastOptions={{
            success: { style: { background: '#4CAF50', color: 'white' } },
            error: { style: { background: '#F44336', color: 'white' } },
            style: { borderRadius: '8px', padding: '12px 16px', color: '#333' },
          }}
        />
      </ChakraProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
    // REMOVED: </SessionProvider>
  );
}
