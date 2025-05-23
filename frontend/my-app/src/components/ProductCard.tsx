'use client'; // This component uses client-side hooks like useCartStore

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Stack, // Added Stack for consistent spacing
  Divider, // Added Divider
} from '@chakra-ui/react';
import Image from 'next/image'; // Next.js Image component

// Import your Zustand cart store
import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  price: number; // Price should be a number for calculation
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  imageAlt,
  price,
}) => {
  const addItemToCart = useCartStore((state) => state.addItem);

  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white">
      {/* Product Image */}
      <Box position="relative" height="200px" width="100%">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill // Makes the image fill the parent Box
          style={{ objectFit: 'cover' }} // Ensures the image covers the area
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizing
        />
      </Box>

      {/* Product Info */}
      <Box p={6}>
        <Stack spacing={3}>
          <Heading size="md" noOfLines={1}>{title}</Heading> {/* Limit title to one line */}
          <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
          <Text color="brand.600" fontSize="2xl" fontWeight="bold">
            KES {price.toFixed(2)}
          </Text>
        </Stack>
      </Box>

      <Divider />

      {/* Add to Cart Button */}
      <Box p={6}>
        <Button
          variant='solid'
          colorScheme='brand'
          width="full"
          onClick={() => addItemToCart({ id, name: title, price })}
        >
          Add to cart
        </Button>
      </Box>
    </Box>
  );
};