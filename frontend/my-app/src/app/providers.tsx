// /var/www/ltronix-shop/frontend/my-app/src/app/providers.tsx
'use client';

import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // <<-- CORRECTED IMPORT HERE -->>


const colors = {
  brand: {
    50: '#F0F8FF',
    100: '#E0EEFF',
    200: '#B2D6FF',
    300: '#84BEFF',
    400: '#56A6FF',
    500: '#288EFF',
    600: '#1F70CC',
    700: '#175299',
    800: '#0E3466',
    900: '#051633',
  },
};

const theme = extendTheme({ colors });

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
  session: any;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          {children}
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
