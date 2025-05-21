// src/components/Footer.tsx
'use client'; // Footer might contain interactive elements or links

import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  Flex,
  Spacer,
  IconButton,
  Heading,
  SimpleGrid,
  HStack,
  Image // For payment logos or certifications
} from '@chakra-ui/react';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa'; // Example social icons (requires react-icons)

// You might need to install react-icons if you haven't already:
// npm install react-icons --legacy-peer-deps

export const Footer = () => {
  return (
    <Box
      bg="gray.800" // Dark background for the footer
      color="gray.200"
      py={10}
      px={4}
      mt="auto" // Pushes the footer to the bottom of the page
    >
      <Container maxW="6xl">
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 4 }} // Responsive grid columns
          spacing={8}
          pb={8}
        >
          {/* Column 1: About Us */}
          <Stack align={{ base: 'center', md: 'flex-start' }}>
            <Heading as="h4" size="md" mb={3} color="whiteAlpha.900">
              About Ltronix
            </Heading>
            <Link href="#" _hover={{ color: 'brand.200' }}>Our Story</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Careers</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Press</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Investor Relations</Link>
          </Stack>

          {/* Column 2: Customer Service */}
          <Stack align={{ base: 'center', md: 'flex-start' }}>
            <Heading as="h4" size="md" mb={3} color="whiteAlpha.900">
              Customer Service
            </Heading>
            <Link href="#" _hover={{ color: 'brand.200' }}>Contact Us</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>FAQ</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Shipping & Returns</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Order Tracking</Link>
          </Stack>

          {/* Column 3: My Account */}
          <Stack align={{ base: 'center', md: 'flex-start' }}>
            <Heading as="h4" size="md" mb={3} color="whiteAlpha.900">
              My Account
            </Heading>
            <Link href="#" _hover={{ color: 'brand.200' }}>Sign In</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>View Cart</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>My Wishlist</Link>
            <Link href="#" _hover={{ color: 'brand.200' }}>Account Settings</Link>
          </Stack>

          {/* Column 4: Social Media & Payment */}
          <Stack align={{ base: 'center', md: 'flex-start' }}>
            <Heading as="h4" size="md" mb={3} color="whiteAlpha.900">
              Connect With Us
            </Heading>
            <HStack spacing={4}>
              <IconButton
                as="a"
                href="#"
                aria-label="Twitter"
                icon={<FaTwitter />}
                variant="ghost"
                color="gray.200"
                _hover={{ color: 'brand.200' }}
              />
              <IconButton
                as="a"
                href="#"
                aria-label="Facebook"
                icon={<FaFacebook />}
                variant="ghost"
                color="gray.200"
                _hover={{ color: 'brand.200' }}
              />
              <IconButton
                as="a"
                href="https://www.instagram.com/loren_ndungu/"
                aria-label="Instagram"
                icon={<FaInstagram />}
                variant="ghost"
                color="gray.200"
                _hover={{ color: 'brand.200' }}
              />
              <IconButton
                as="a"
                href="https://www.linkedin.com/in/loren-ndungu"
                aria-label="LinkedIn"
                icon={<FaLinkedin />}
                variant="ghost"
                color="gray.200"
                _hover={{ color: 'brand.200' }}
              />
            </HStack>
            <Heading as="h4" size="md" mb={3} mt={4} color="whiteAlpha.900">
              Secure Payments
            </Heading>
            <HStack spacing={2}>
                {/* Placeholder images for payment methods */}
                <Image src="https://via.placeholder.com/40x25?text=VISA" alt="Visa" />
                <Image src="https://via.placeholder.com/40x25?text=M-PESA" alt="M-PESA" />
                <Image src="https://via.placeholder.com/40x25?text=MC" alt="Mastercard" />
            </HStack>
          </Stack>
        </SimpleGrid>

        {/* Copyright & Bottom Text */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify={{ base: 'center', md: 'space-between' }}
          align="center"
          pt={8}
          borderTop="1px solid"
          borderColor="gray.700"
        >
          <Text fontSize="sm" textAlign={{ base: 'center', md: 'left' }}>
            &copy; {new Date().getFullYear()} Ltronix Shop. All rights reserved.
          </Text>
          <Text fontSize="sm" textAlign={{ base: 'center', md: 'right' }} mt={{ base: 2, md: 0 }}>
            Powered by CH Technologies
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};