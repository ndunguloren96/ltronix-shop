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
import Image from 'next/image';
import NextLink from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: string;
  stock: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  imageUrl,
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
    <ChakraLink as={NextLink} href={`/products/${id}`} passHref _hover={{ textDecoration: 'none' }}>
      <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white" cursor="pointer">
        <Box position="relative" height="200px" width="100%" display="block">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              unoptimized={true}
            />
          ) : (
            <Box height="200px" width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>

        <Box p={4}> {/* Reduced padding for more compact look */}
          <Stack spacing={1}> {/* Reduced spacing */}
            <Heading size="md" noOfLines={1}>{name}</Heading>
            <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
            <Text color="brand.600" fontSize="xl" fontWeight="bold"> {/* Slightly smaller price font */}
              {formatPrice(price)}
            </Text>
          </Stack>
        </Box>
      </Box>
    </ChakraLink>
  );
};
