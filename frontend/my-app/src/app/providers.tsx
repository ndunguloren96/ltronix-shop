// src/app/providers.tsx
'use client';

import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '../components/ErrorBoundary';
import theme from '../theme';
import CartInitializer from '../components/CartInitializer'; // Corrected import: removed curly braces

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

interface AppProvidersProps {
  children: React.ReactNode;
  session: any; // Session object from getServerSession
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <ErrorBoundary>
            {children}
            {/* NEW: Render CartInitializer here. It will run side effects related to cart sync. */}
            <CartInitializer />
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
    </SessionProvider>
  );
}

