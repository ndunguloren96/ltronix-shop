'use client';

import { SessionProvider } from 'next-auth/react';
import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react'; // Import extendTheme
import { Toaster } from 'react-hot-toast';
import React from 'react'; // React import is good practice, though often inferred in newer React versions

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
  // You can add other color definitions or extend existing ones here if needed
};

// Extend the default Chakra UI theme with your custom colors
const theme = extendTheme({ colors });

// This component wraps your application's children with all necessary providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // SessionProvider makes the NextAuth.js session available to all client components
    <SessionProvider>
      {/* ChakraProvider applies your custom theme to all Chakra UI components */}
      <ChakraProvider theme={theme}>
        {children}
        <Toaster
          position="bottom-center" // Adjust position as needed
          toastOptions={{
            // Customize toast options
            success: {
              style: {
                background: '#4CAF50', // Green
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#F44336', // Red
                color: 'white',
              },
            },
            // You can add more styles for other toast types like 'loading', 'custom'
            style: {
              // Default styles for all toasts
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#333',
            },
          }}
        />
      </ChakraProvider>
    </SessionProvider>
  );
}