// frontend/my-app/src/components/ProductCard.tsx
'use client';

import {
  Box,
  Heading,
  Text,
  Stack,
  Divider,
  Link as ChakraLink,
} from '@chakra-ui/react';
// import Image from 'next/image'; // <-- You can comment out or remove this import
import NextLink from 'next/link';

interface ProductCardProps {
  // FIX: Changed id from string to number
  id: number;
  name: string;
  description: string;
  image_file?: string; // <-- CHANGE THIS: Renamed from imageUrl to image_file
  price: string;
  stock: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  image_file, // <-- CHANGE THIS: Renamed from imageUrl to image_file
  price,
}) => {
  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    // FIX: Ensure id is converted to string for the NextLink href
    <ChakraLink as={NextLink} href={`/products/${id.toString()}`} passHref _hover={{ textDecoration: 'none' }}>
      <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white" cursor="pointer">
        <Box position="relative" height="200px" width="100%" display="block">
          {image_file ? ( // <-- Use image_file here
            // CHANGE THIS: Using a standard <img> tag instead of Next.js Image for full URLs
            <img
              src={image_file} // <-- Use image_file here
              alt={name}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} // Added inline styles for img
            />
          ) : (
            <Box height="200px" width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>

        <Box p={4}>
          <Stack spacing={1}>
            <Heading size="md" noOfLines={1}>{name}</Heading>
            <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
            <Text color="brand.600" fontSize="xl" fontWeight="bold">
              {formatPrice(price)}
            </Text>
          </Stack>
        </Box>
      </Box>
    </ChakraLink>
  );
};

