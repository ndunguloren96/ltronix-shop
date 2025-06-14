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
} from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';

import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
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
      <Link href={`/products/${id}`} passHref>
        <Box as="a" position="relative" height="200px" width="100%" display="block" _hover={{ cursor: 'pointer', opacity: 0.9 }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill // Use fill instead of layout="fill"
              style={{ objectFit: 'cover' }} // Use style prop instead of objectFit prop
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <Box height="200px" width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>
      </Link>

      <Box p={6}>
        <Stack spacing={3}>
          <Link href={`/products/${id}`} passHref>
            <Heading as="a" size="md" noOfLines={1} _hover={{ textDecoration: 'underline' }}>{name}</Heading>
          </Link>
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
          onClick={() => addItemToCart({ id, name, price: priceAsNumber })}
        >
          Add to cart
        </Button>
      </Box>
    </Box>
  );
};