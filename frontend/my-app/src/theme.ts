// src/theme.ts
import { extendTheme } from '@chakra-ui/react';

// 1. Define the custom theme
const theme = extendTheme({
    colors: {
        brand: {
            900: '#1a365d', // Dark blue
            800: '#153e75', // Medium blue
            700: '#2a69ac', // Light blue
        },
    },
    fonts: {
        heading: 'Montserrat, sans-serif',
        body: 'Open Sans, sans-serif',
    },
});

export default theme;