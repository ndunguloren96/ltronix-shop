// src/components/theme.ts
'use client';

import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Define your brand color based on your preference
const brandColors = {
  900: '#1a365d', // Darkest shade, e.g., for primary buttons/accents
  800: '#153e75',
  700: '#2a69ac',
  500: '#3182CE', // A good blue for primary actions
  400: '#63B3ED',
  200: '#90CDF4', // Lighter shade, e.g., for hover states
  100: '#EBF8FF', // Lightest shade
};

// --- Updated config object for Chakra UI color mode ---
const config: ThemeConfig = {
  initialColorMode: 'light', // FIX: Set initial color mode to 'light'
  useSystemColorMode: false, // Set to true if you want to respect OS preference, false to force initialColorMode
};
// --- End config object ---

export const theme = extendTheme({
  config, // Add the config object here
  colors: {
    brand: brandColors,
    // Define a neutral palette for backgrounds/surfaces to ensure good contrast
    // These will be used for elements like cards, inputs, etc.
    surface: {
      50: '#FFFFFF',  // FIX: Pure white for main backgrounds/surfaces in light mode
      100: '#F8F8F8', // Slightly off-white for subtle differentiation
      200: '#F0F0F0', // Light grey for elements like input backgrounds
      // Darker shades for potential future dark mode, or borders/shadows in light mode
      700: '#333333',
      800: '#222222',
      900: '#111111',
    },
    text: {
      900: '#1A202C', // FIX: Dark text for light backgrounds (main text color)
      800: '#2D3748', // Slightly lighter dark text
      700: '#4A5568', // Medium dark text
      500: '#718096', // Lighter grey text for secondary info
      100: '#FFFFFF', // FIX: White text for dark backgrounds (e.g., on brand buttons)
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
        // FIX: Set background to light surface and text to dark text for default light mode
        bg: 'surface.50', // Use pure white or very light grey for background
        color: 'text.900', // Use dark text for default
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
        // FIX: Card background will be white in light mode
        bg: 'white', // Ensure cards are white in light mode
        borderRadius: 'lg', // Rounded corners
        boxShadow: 'md', // Subtle shadow for depth
        borderWidth: '1px',
        // FIX: Use appropriate border color for light mode
        borderColor: 'gray.200', // Subtle border for light mode
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
            // FIX: Input background will be light gray in light mode
            bg: 'surface.200', // Light background for input in light mode
            // FIX: Input text will be dark in light mode
            color: 'text.900', // Dark text for light input
            _hover: {
              bg: 'gray.100', // Slightly lighter on hover
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
          // FIX: Clearer border for light mode
          borderColor: 'gray.400', // Clearer border
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
          // FIX: Ensure label text is dark in light mode
          color: 'text.900', // Ensure label text is visible
        },
      }),
    },
    Slider: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        track: {
          // FIX: Visible track for light mode
          bg: 'gray.200', // Visible track
        },
        thumb: {
          bg: 'brand.500', // Brand color for the thumb
          _focus: {
            boxShadow: '0 0 0 3px var(--chakra-colors-brand-200)', // Soft focus ring
          },
          // FIX: Ensure the thumb is always visible against the track
          border: '2px solid',
          borderColor: 'gray.800', // Dark border for light thumb
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
          // FIX: Text color for light mode
          color: 'text.900',
          _hover: {
            bg: 'gray.50', // Light hover background
          },
          _expanded: {
            bg: 'gray.50', // Light expanded background
            color: 'brand.500', // Highlight expanded section
          },
        },
        panel: {
          // Style for the accordion content
          // FIX: Text color for light mode
          color: 'text.900',
        },
      }),
    },
    Text: {
      baseStyle: (props: Record<string, any>) => ({ // Explicitly type 'props'
        // FIX: Default text color for light mode
        color: 'text.900', // Default text color for contrast
      }),
    },
  },
});

export default theme;
