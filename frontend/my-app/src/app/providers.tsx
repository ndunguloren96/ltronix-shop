// src/app/providers.tsx
'use client'; // This component will be a client component

import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js'; // For Next.js App Router caching
import { theme } from '@/theme'; // Import your custom theme

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}