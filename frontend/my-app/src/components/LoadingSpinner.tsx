'use client';

import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean; // New prop to make it full screen
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Processing your request...', // Default reassuring message
  size = 'xl', // Default size for visibility
  fullScreen = false,
}) => {
  return (
    <Center
      width={fullScreen ? '100vw' : '100%'} // Full viewport width or 100% of parent
      height={fullScreen ? '100vh' : '100%'} // Full viewport height or 100% of parent
      position={fullScreen ? 'fixed' : 'relative'} // Fixed for full screen, relative otherwise
      top={fullScreen ? '0' : 'auto'}
      left={fullScreen ? '0' : 'auto'}
      zIndex={fullScreen ? '9999' : 'auto'} // Ensure it's on top for full screen
      bg={fullScreen ? 'rgba(255, 255, 255, 0.8)' : 'transparent'} // Semi-transparent overlay for full screen
      flexDirection="column"
      aria-live="polite" // Announce to screen readers that content is loading
      aria-busy="true" // Indicate that the section is busy
    >
      <VStack spacing={4}>
        {/* The Spinner itself - strategically uses brand color */}
        <Spinner
          thickness="4px" // Thickness of the spinner line
          speed="0.65s" // Speed of the rotation
          emptyColor="gray.200" // Color of the "empty" part of the circle
          color="brand.500" // Use your primary brand color
          size={size}
          aria-label={message} // Accessible label for the spinner
        />
        {/* A simple, human-centric message */}
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          {message}
        </Text>
        {/* Optional: Add a subtle tag line if needed, e.g., "Powered by Ltronix" */}
        {/* <Text fontSize="sm" color="gray.500">
          Powered by Ltronix intelligence.
        </Text> */}
      </VStack>
    </Center>
  );
};

export default LoadingSpinner;