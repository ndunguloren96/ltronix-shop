'use client'; // Important for client-side interactivity and Chakra UI usage

import { Box, Heading, Text } from '@chakra-ui/react';
import { MyButton } from '@/components/MyButton'; // Import your custom button
import React from 'react';

export default function Home() {
  return (
    <Box
      textAlign="center"
      py={10}
      px={6}
      minH="100vh" // Ensure it takes full viewport height
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bg="gray.50" // Light gray background
    >
      <Heading as="h1" size="2xl" mb={4} color="gray.700">
        Welcome to Ltronix Shop!
      </Heading>
      <Text fontSize="xl" color="gray.600" mb={8}>
        Your one-stop shop for electronics.
      </Text>

      <MyButton onClick={() => alert('Button Clicked!')}>
        Explore Products
      </MyButton>
    </Box>
  );
}