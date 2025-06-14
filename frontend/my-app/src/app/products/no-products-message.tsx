// src/app/products/no-products-message.tsx
'use client'; // This is a Client Component

import { Alert, AlertIcon, AlertTitle, AlertDescription, Button, Flex } from '@chakra-ui/react';
import React from 'react';

export default function NoProductsMessage() {
  const handleReload = () => {
    window.location.reload(); // This is client-side interactivity
  };

  return (
    <Flex justify="center" align="center" minH="80vh" flexDirection="column" p={4}>
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          No Products Available
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          We couldn't load any products at the moment. Please check your backend API.
        </AlertDescription>
        <Button mt={4} onClick={handleReload}>
          Retry
        </Button>
      </Alert>
    </Flex>
  );
}