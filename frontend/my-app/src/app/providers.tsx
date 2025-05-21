'use client';

import { SessionProvider } from 'next-auth/react';
import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react'; // Import extendTheme
import React from 'react';

// Define your custom brand color
const colors = {
  brand: {
    50: '#F0F8FF',
    100: '#E0EEFF',
    200: '#B2D6FF',
    300: '#84BEFF',
    400: '#56A6FF',
    500: '#288EFF', // Your main brand color
    600: '#1F70CC',
    700: '#175299',
    800: '#0E3466',
    900: '#051633',
  },
};

const theme = extendTheme({ colors });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </SessionProvider>
  );
}