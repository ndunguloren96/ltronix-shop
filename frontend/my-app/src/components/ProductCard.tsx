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
import Image from 'next/image'; // Ensure this import is present
import NextLink from 'next/link';

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  image_file?: string;
  price: string;
  stock: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  image_file,
  price,
}) => {
  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    // Using Kenya Shillings (KES) and proper formatting
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <ChakraLink as={NextLink} href={`/products/${id.toString()}`} passHref _hover={{ textDecoration: 'none' }}>
      <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white" cursor="pointer">
        <Box position="relative" height="200px" width="100%" display="block">
          {image_file ? (
            <Image // Changed <img> to <Image>
              src={image_file}
              alt={name}
              fill // Use fill to make the image cover the parent Box
              style={{ objectFit: 'cover' }} // Equivalent to object-fit: cover
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Optimize image loading based on viewport
              priority={false} // Adjust based on whether this image is critical for LCP
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
