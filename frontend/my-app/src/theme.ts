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
    // Define a neutral palette for backgrounds/surfaces to ensure good contrast
    // These will be used for elements like cards, inputs, etc., especially in dark mode
    surface: {
      50: '#F7FAFC', // Very light for light mode surfaces
      100: '#EDF2F7',
      200: '#E2E8F0',
      // For dark mode surfaces, use slightly lighter shades than the main background
      700: '#1A202C', // Slightly lighter than pure black, good for cards in dark mode
      800: '#171923', // Darker surface, closer to background
      900: '#0A0A0A', // Main dark background (from globals.css)
    },
    text: {
      900: '#1A202C', // Dark text for light backgrounds
      500: '#4A5568',
      100: '#E2E8F0', // Light text for dark backgrounds
    },
  },
  fonts: {
    heading: 'Inter, sans-serif', // Using Inter as a common modern font
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props: Record<string, any>) => ({ // Explicitly type 'props'
      // Ensure smooth transitions for color mode changes if implemented
      'html, body': {
        transitionProperty: 'background-color, color',
        transitionDuration: 'normal',
        bg: props.colorMode === 'dark' ? 'surface.900' : 'gray.50', // Apply background based on color mode
        color: props.colorMode === 'dark' ? 'text.100' : 'text.900', // Apply text color based on color mode
      },
      // You can add more global styles here if needed, e.g., scrollbar styling
    }),
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
    // --- New/Updated styles for Filter Section components ---
    Card: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        // Use a slightly lighter surface color for the card in dark mode
        // to make it distinct from the main page background.
        // In light mode, it will be a standard white/light gray.
        bg: props.colorMode === 'dark' ? 'surface.700' : 'white',
        borderRadius: 'lg', // Rounded corners
        boxShadow: 'md', // Subtle shadow for depth
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200', // Subtle border
      }),
      variants: {
        elevated: {
          // A variant if you want a more pronounced card
          boxShadow: 'xl',
        },
      },
    },
    Input: {
      variants: {
        filled: (props: Record<string, any>) => ({ // Explicitly type 'props'
          field: {
            bg: props.colorMode === 'dark' ? 'surface.800' : 'gray.100', // Darker background for input in dark mode
            color: props.colorMode === 'dark' ? 'text.100' : 'text.900', // Light text for dark input
            _hover: {
              bg: props.colorMode === 'dark' ? 'surface.700' : 'gray.200',
            },
            _focus: {
              borderColor: 'brand.500', // Highlight with brand color on focus
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
            borderRadius: 'md',
          },
        }),
      },
      defaultProps: {
        variant: 'filled', // Make 'filled' the default for inputs
      },
    },
    Checkbox: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        control: {
          borderColor: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400', // Clearer border
          _checked: {
            bg: 'brand.500', // Brand color when checked
            borderColor: 'brand.500',
            color: 'white',
            _hover: {
              bg: 'brand.600',
              borderColor: 'brand.600',
            },
          },
          _focus: {
            boxShadow: 'outline', // Standard focus outline
          },
        },
        label: {
          color: props.colorMode === 'dark' ? 'text.100' : 'text.900', // Ensure label text is visible
        },
      }),
    },
    Slider: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        track: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.200', // Visible track
        },
        thumb: {
          bg: 'brand.500', // Brand color for the thumb
          _focus: {
            boxShadow: '0 0 0 3px var(--chakra-colors-brand-200)', // Soft focus ring
          },
          // Ensure the thumb is always visible against the track
          border: '2px solid',
          borderColor: props.colorMode === 'dark' ? 'white' : 'gray.800',
        },
        filledTrack: {
          bg: 'brand.500', // Brand color for the filled part of the track
        },
      }),
    },
    // For collapsible sections like Categories/Brands/Price Range
    Accordion: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        button: {
          // Style for the accordion header
          color: props.colorMode === 'dark' ? 'text.100' : 'text.900',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
          },
          _expanded: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
            color: 'brand.500', // Highlight expanded section
          },
        },
        panel: {
          // Style for the accordion content
          color: props.colorMode === 'dark' ? 'text.100' : 'text.900',
        },
      }),
    },
    Text: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        color: props.colorMode === 'dark' ? 'text.100' : 'text.900', // Default text color for contrast
      }),
    },
  },
});

export default theme;
