// /var/www/ltronix-shop/frontend/my-app/src/components/Footer.tsx
'use client'; // This component might include interactive elements or relies on client-side features.

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Link as ChakraLink, // Alias Chakra UI's Link to prevent conflicts
  Divider,
  Container, // Added Container for main footer content alignment
  SimpleGrid,
  Heading,
} from '@chakra-ui/react';
import Image from 'next/image'; // Import Next.js Image component
import NextLink from 'next/link'; // Renamed Next.js Link to NextLink to avoid conflict

// You can add more icons if needed, e.g., for social media
// import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

// --- CRITICAL FIX: Changed to default export ---
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box bg="gray.800" color="gray.200" py={{ base: 8, md: 12 }} mt={10}>
      {/* Brands Carousel Section (New addition) */}
      <Box w="100%" bg="gray.700" py={4} mb={8} overflowX="auto" boxShadow="inner">
        <Text fontWeight="bold" fontSize="lg" mb={2} px={{ base: 4, md: 8 }} color="whiteAlpha.800">
          Trusted Brands
        </Text>
        <HStack spacing={{ base: 6, md: 10 }} px={{ base: 4, md: 8 }} minW="max-content" justifyContent="space-between">
          {/* Placeholder brand images for a horizontally scrollable carousel */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Box
              key={i}
              minW="100px" // Minimum width for each brand logo container
              flexShrink={0} // Prevent items from shrinking
              bg="whiteAlpha.900"
              p={2}
              borderRadius="md"
              boxShadow="sm"
            >
              <Image
                src={`/brands/brand-placeholder-${i}.png`} // Path to your brand images
                alt={`Brand ${i} Logo`}
                width={80} // Explicit width for Next.js Image
                height={80} // Explicit height for Next.js Image
                style={{ objectFit: 'contain' }} // Use style prop instead of objectFit prop (fixes legacy prop warning)
                quality={80} // Image quality
                // style prop filter is already good
                // style={{ filter: 'grayscale(100%) opacity(70%)' }} // Example: grayscale effect
              />
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Main Footer Content */}
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8} pb={8}>
          <VStack align="flex-start" spacing={3}>
            <Heading size="md" color="whiteAlpha.900">Ltronix Shop</Heading>
            <Text fontSize="sm">
              Your trusted source for the latest electronics, gadgets, and tech innovations.
              Delivering quality and service across Kenya.
            </Text>
            {/* You can add more contact info or a mini-logo here */}
          </VStack>

          <VStack align="flex-start" spacing={3}>
            <Heading size="md" color="whiteAlpha.900">Customer Service</Heading>
            {/* CRITICAL FIX: Use ChakraLink as NextLink and passHref */}
            <ChakraLink as={NextLink} href="/contact-us" fontSize="sm" _hover={{ color: 'brand.300' }}>Contact Us</ChakraLink>
            <ChakraLink as={NextLink} href="/faqs" fontSize="sm" _hover={{ color: 'brand.300' }}>FAQs</ChakraLink>
            <ChakraLink as={NextLink} href="/shipping-returns" fontSize="sm" _hover={{ color: 'brand.300' }}>Shipping & Returns</ChakraLink>
            <ChakraLink as={NextLink} href="/warranty" fontSize="sm" _hover={{ color: 'brand.300' }}>Warranty Info</ChakraLink>
          </VStack>

          <VStack align="flex-start" spacing={3}>
            <Heading size="md" color="whiteAlpha.900">Explore</Heading>
            {/* CRITICAL FIX: Use ChakraLink as NextLink and passHref */}
            <ChakraLink as={NextLink} href="/products" fontSize="sm" _hover={{ color: 'brand.300' }}>All Products</ChakraLink>
            <ChakraLink as={NextLink} href="/products/categories" fontSize="sm" _hover={{ color: 'brand.300' }}>Categories</ChakraLink>
            <ChakraLink as={NextLink} href="/products/hot-deals" fontSize="sm" _hover={{ color: 'brand.300' }}>Hot Deals</ChakraLink>
            <ChakraLink as={NextLink} href="/blog" fontSize="sm" _hover={{ color: 'brand.300' }}>Blog</ChakraLink>
          </VStack>

          <VStack align="flex-start" spacing={3}>
            <Heading size="md" color="whiteAlpha.900">My Account</Heading>
            {/* CRITICAL FIX: Use ChakraLink as NextLink and passHref */}
            <ChakraLink as={NextLink} href="/account" fontSize="sm" _hover={{ color: 'brand.300' }}>Account Dashboard</ChakraLink>
            <ChakraLink as={NextLink} href="/account/orders" fontSize="sm" _hover={{ color: 'brand.300' }}>My Orders</ChakraLink>
            <ChakraLink as={NextLink} href="/account/wishlist" fontSize="sm" _hover={{ color: 'brand.300' }}>Wishlist</ChakraLink>
            <ChakraLink as={NextLink} href="/cart" fontSize="sm" _hover={{ color: 'brand.300' }}>Shopping Cart</ChakraLink>
          </VStack>
        </SimpleGrid>

        <Divider borderColor="gray.600" my={8} />

        {/* Copyright and Social Media */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          pt={4}
        >
          <Text fontSize="sm" textAlign={{ base: 'center', md: 'left' }} mb={{ base: 4, md: 0 }}>
            &copy; {currentYear} Ltronix Shop. All rights reserved.
          </Text>
          <HStack spacing={4}>
            {/* Placeholder for social media icons */}
            {/* <IconButton aria-label="Facebook" icon={<FaFacebook />} variant="ghost" color="gray.200" _hover={{ color: 'brand.300' }} />
            <IconButton aria-label="Twitter" icon={<FaTwitter />} variant="ghost" color="gray.200" _hover={{ color: 'brand.300' }} />
            <IconButton aria-label="Instagram" icon={<FaInstagram />} variant="ghost" color="gray.200" _hover={{ color: 'brand.300' }} /> */}
            {/* CRITICAL FIX: Use ChakraLink as NextLink and passHref */}
            <ChakraLink as={NextLink} href="/privacy-policy" fontSize="sm" _hover={{ color: 'brand.300' }}>Privacy Policy</ChakraLink>
            <ChakraLink as={NextLink} href="/terms-of-service" fontSize="sm" _hover={{ color: 'brand.300' }}>Terms of Service</ChakraLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
