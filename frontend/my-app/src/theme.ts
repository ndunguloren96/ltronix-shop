// src/components/theme.ts
'use client'; // <--- ADD THIS LINE AT THE VERY TOP

import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Define your brand color based on your preference
const brandColors = {
  900: '#1a365d', // Darkest shade, e.g., for background
  800: '#153e75',
  700: '#2a69ac',
  // You can add more shades if needed
  500: '#3182CE', // A good blue for primary actions
  400: '#63B3ED',
  200: '#90CDF4', // Lighter shade, e.g., for hover states
  100: '#EBF8FF', // Lightest shade
};

// --- Add this config object for Chakra UI color mode ---
const config: ThemeConfig = {
  initialColorMode: 'dark', // Set your desired initial color mode (e.g., 'dark' as seen in your screenshot)
  useSystemColorMode: false, // Set to true if you want to respect OS preference, false to force initialColorMode
};
// --- End config object ---

export const theme = extendTheme({
  config, // Add the config object here
  colors: {
    brand: brandColors,
  },
  fonts: {
    heading: 'Inter, sans-serif', // Using Inter as a common modern font
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50', // Light gray background for the entire body
        color: 'gray.800', // Default text color
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
      variants: {
        brandSolid: { // A custom variant for a solid brand button
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.700',
          },
        },
      },
    },
    // Add more component customizations as needed.
  },
});
