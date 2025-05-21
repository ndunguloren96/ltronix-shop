// src/components/ProductCard.tsx
'use client';

import {
  Box,
  Image,
  Text,
  Heading,
  Button,
  VStack, // For vertical stacking of elements within the card
  Link as ChakraLink // To use Chakra's Link component
} from '@chakra-ui/react';
import Link from 'next/link'; // Import Next.js Link for client-side navigation

// Define the shape of product data that this component expects.
interface ProductCardProps {
  id: string;
  name: string;
  price: string; // Keeping as string for now to include currency symbol
  imageUrl: string;
}

export const ProductCard = ({ id, name, price, imageUrl }: ProductCardProps) => {
  return (
    // Use Next.js Link for navigation to the product detail page.
    // The `passHref` prop is needed when using ChakraLink inside Next.js Link.
    <Link href={`/products/${id}`} passHref>
      <ChakraLink _hover={{ textDecoration: 'none' }} > {/* Remove underline on hover for the card itself */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden" // Ensures image corners are rounded with the card
          p={4}
          textAlign="center"
          boxShadow="sm"
          _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }} // Subtle hover effect
          transition="all 0.2s ease-in-out" // Smooth transition for hover effect
          height="100%" // Ensure cards in the grid have equal height
          display="flex"
          flexDirection="column"
          justifyContent="space-between" // Pushes Add to Cart to bottom if content varies
        >
          <VStack spacing={3} flex="1"> {/* flex="1" ensures content takes available space */}
            <Image
              src={imageUrl}
              alt={name}
              borderRadius="md" // Slightly rounded image corners
              objectFit="cover" // Cover the area, cropping if necessary
              width="100%" // Full width within the card padding
              maxH="200px" // Max height for consistency
              mb={2}
            />
            <Heading as="h3" size="md" noOfLines={2} textAlign="center">
              {name}
            </Heading>
            <Text fontWeight="bold" fontSize="xl" mt={2} color="brand.500">
              {price}
            </Text>
          </VStack>

          {/* Add to Cart Button (placeholder for now) */}
          <Button
            mt={4} // Margin top to separate from text
            colorScheme="brand"
            variant="solid"
            width="100%"
            onClick={(e) => {
              e.preventDefault(); // Prevent navigating when button is clicked
              console.log(`Added ${name} to cart!`);
              // Implement actual add to cart logic here later
            }}
          >
            Add to Cart
          </Button>
        </Box>
      </ChakraLink>
    </Link>
  );
};