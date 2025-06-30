// frontend/my-app/src/app/page.tsx
// This is now a pure Server Component, so no 'use client' directive here.

import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { fetchProducts } from '../api/products'; // CRITICAL FIX: Corrected import path
import ProductsClientPage from '../app/products/client_page'; // Path to your client component that displays products
import HomePageClientWidgets from '@/components/HomePageClientWidgets'; // NEW: Import the new client component for widgets
import React from 'react';
import { Box, Heading, Text, VStack, Button, Flex, Container }
 from '@chakra-ui/react';
import Image from 'next/image';

// Define Product interface (should ideally be imported from src/api/products.ts or a shared types file)
// Re-declaring here for clarity, but import is preferred.
interface Product {
  id: string; // Ensure this matches your backend's product ID type
  name: string;
  price: string; // Django DecimalField often comes as a string in JSON
  description: string;
  image_url?: string;
  category?: string;
  brand?: string;
  // Add other fields you expect from your ProductSerializer
}

export default async function HomePage() {
  const queryClient = new QueryClient(); // Create a new QueryClient instance for each request on the server

  try {
    // Prefetch product data on the server using the shared fetchProducts function.
    await queryClient.fetchQuery({
      queryKey: ['products'], // This key MUST match what ProductsClientPage uses
      queryFn: fetchProducts,
    });
  } catch (error) {
    console.error("Failed to prefetch products for Home page:", error);
  }

  // Dehydrate the query client's state to pass it from the server to the client.
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      {/* Hero Section with an LCP-priority Image */}
      <Box position="relative" width="100%" height={{ base: '300px', md: '450px', lg: '550px' }} overflow="hidden">
        <Image
          src="/hero-banner.png"
          alt="Discover the latest electronics at Ltronix Shop"
          fill
          style={{ objectFit: 'cover' }}
          priority // Marks this as a high-priority image for LCP
          sizes="100vw" // Image will span full viewport width
        />
        <Container maxW="container.xl" h="100%" display="flex" alignItems="center" justifyContent="center">
          <VStack
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            color="white"
            textAlign="center"
            zIndex="1"
            textShadow="2px 2px 4px rgba(0,0,0,0.7)"
            spacing={4}
            maxW="2xl"
          >
            <Heading as="h1" size={{ base: 'xl', md: '2xl', lg: '3xl' }}>
              Welcome to Ltronix Shop!
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }}>
              Your ultimate destination for cutting-edge electronics and gadgets.
            </Text>
            <Button colorScheme="brand" size="lg" mt={4} as="a" href="/products">
              Shop Now!
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Render ProductsClientPage here. It will automatically get products from the hydrated cache. */}
      {/* Pass isHomePage prop to ProductsClientPage so it can adjust its UI (e.g., hide filters) */}
      <ProductsClientPage isHomePage={true} />

      {/* Render the new client component for other interactive widgets */}
      <HomePageClientWidgets />

    </HydrationBoundary>
  );
}
