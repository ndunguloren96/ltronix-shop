// frontend/my-app/src/app/page.tsx
import ProductsClientPage from '../app/products/client_page'; // Path to your client component that displays products
import HomePageClientWidgets from '@/components/HomePageClientWidgets'; // NEW: Import the new client component for widgets
import React from 'react';
import { Box, Heading, Text, VStack, Button, Container }
 from '@chakra-ui/react';
import Image from 'next/image';

/**
 * Home page component.
 * This component renders the main page of the application.
 * @returns The home page component.
 */
export default function HomePage() {
  return (
    <>
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

    </>
  );
}