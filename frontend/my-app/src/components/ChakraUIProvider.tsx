'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import React from 'react';

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

export function ChakraUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
}
