// src/theme.ts
'use client';

import { extendTheme } from '@chakra-ui/react';
import config from './chakra.config';

const brandColors = {
  900: '#1a365d',
  800: '#153e75',
  700: '#2a69ac',
  500: '#3182CE',
  400: '#63B3ED',
  200: '#90CDF4',
  100: '#EBF8FF',
};

const theme = extendTheme({
  config,
  colors: {
    brand: brandColors,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
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
        brandSolid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.700',
          },
        },
      },
    },
  },
});

export default theme;

