'use client';

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import React from 'react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: (...args: Array<unknown>) => void;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <VStack
      role="alert"
      spacing={4}
      p={8}
      bg="red.50"
      color="red.800"
      borderRadius="md"
      textAlign="center"
      maxWidth="md"
      mx="auto"
      my={10}
      boxShadow="lg"
    >
      <Heading size="lg" color="red.700">Something went wrong!</Heading>
      <Text fontWeight="bold">Error Details:</Text>
      <Text color="red.600" fontFamily="mono" whiteSpace="pre-wrap" wordBreak="break-word">
        {error.message}
      </Text>
      {process.env.NODE_ENV === 'development' && (
        <Box textAlign="left" w="full">
          <Text fontSize="sm" color="red.500">Stack:</Text>
          <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap" wordBreak="break-word">
            {error.stack}
          </Text>
        </Box>
      )}
      <Button onClick={resetErrorBoundary} colorScheme="red" mt={4}>
        Try again
      </Button>
    </VStack>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleReset = () => {
    // Optional: Log successful reset or navigate away
    console.log('Error boundary reset!');
  };

  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error('Caught an error in ErrorBoundary:', error, info.componentStack);
    // Here you can send error info to Sentry/Bugsnag if needed
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}
