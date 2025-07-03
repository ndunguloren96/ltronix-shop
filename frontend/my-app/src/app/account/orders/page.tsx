// frontend/my-app/src/app/account/orders/page.tsx
'use client'; // This will be a client component as it will interact with data hooks

import { Box, Heading, Text, Center, VStack, Spinner } from '@chakra-ui/react';
import React from 'react';
// We will add TanStack Query hooks here later to fetch order history

export default function OrderHistoryPage() {
  // In the next step, we'll implement useQuery to fetch orders here.
  // For now, this is a placeholder to establish the route.

  // Example of a loading state (will be replaced by actual useQuery isLoading)
  const isLoading = false; // Set to true when implementing real data fetching
  const orders = []; // This will be populated by fetched orders

  if (isLoading) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">Loading your order history...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Your Order History
      </Heading>

      {orders.length === 0 ? (
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="md" color="gray.600">You haven&apos;t placed any orders yet.</Text>
          {/* Add a link to products page if desired */}
        </VStack>
      ) : (
        // Render your order list here once data is available
        <Text>Order history will be displayed here.</Text>
      )}
    </Box>
  );
}
