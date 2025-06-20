// frontend/my-app/src/components/ProductCard.tsx
'use client';

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Stack,
  Divider,
  Link as ChakraLink,
} from '@chakra-ui/react';
import Image from 'next/image'; // Import Next.js Image
import NextLink from 'next/link';

import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // Ensure this is consistently named
  price: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  price,
}) => {
  const addItemToCart = useCartStore((state) => state.addItem);

  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceAsNumber = parseFloat(price);

  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white">
      <ChakraLink as={NextLink} href={`/products/${id}`} passHref>
        <Box position="relative" height="200px" width="100%" display="block" _hover={{ cursor: 'pointer', opacity: 0.9 }}>
          {imageUrl ? (
            <Image
              src={imageUrl} // Use the provided imageUrl
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <Box height="200px" width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>
      </ChakraLink>

      <Box p={6}>
        <Stack spacing={3}>
          <ChakraLink as={NextLink} href={`/products/${id}`} passHref>
            <Heading size="md" noOfLines={1} _hover={{ textDecoration: 'underline' }}>{name}</Heading>
          </ChakraLink>
          <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
          <Text color="brand.600" fontSize="2xl" fontWeight="bold">
            {formatPrice(price)}
          </Text>
        </Stack>
      </Box>

      <Divider />

      <Box p={6}>
        <Button
          variant='solid'
          colorScheme='brand'
          width="full"
          // CRITICAL FIX: Pass image_url to addItemToCart
          onClick={() => addItemToCart({ id, name, price: priceAsNumber, image_url: imageUrl })}
        >
          Add to cart
        </Button>
      </Box>
    </Box>
  );
};
