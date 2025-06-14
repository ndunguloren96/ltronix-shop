// src/app/products/[id]/page.tsx
import React from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Divider,
  List,
  ListItem,
  ListIcon,
  HStack,
  Spacer,
  VStack,
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image_url?: string;
  brand?: string;
  sku?: string;
  rating?: number;
  reviews_count?: number;
}

export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';
    const res = await fetch(`${apiUrl}/products/`, {
      cache: 'force-cache',
    });

    if (!res.ok) {
      console.error(`Failed to fetch product IDs for generateStaticParams: ${res.status} ${res.statusText}`);
      return [];
    }

    const products: Product[] = await res.json();
    return products.map((product) => ({
      id: product.id.toString(),
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

async function getProduct(id: string): Promise<Product> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';
    const res = await fetch(`${apiUrl}/products/${id}/`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      console.error(`Failed to fetch product ${id}: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch product ${id}: ${res.statusText}`);
    }

    const product: Product = await res.json();
    return product;
  } catch (error) {
    console.error(`Error fetching product ${id} in getProduct:`, error);
    notFound();
  }
}

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const mockSpecs = [
    'Fast delivery nationwide',
    '1-year warranty',
    '24/7 customer support',
    'Secure payment options',
  ];

  return (
    <Container maxW="7xl" py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Box flex={{ base: '1', md: '0.6' }}>
          {product.image_url ? (
            <Box position="relative" height={{ base: "300px", md: "500px" }} width="100%" borderRadius="lg" overflow="hidden" boxShadow="md">
              <Image
                src={product.image_url}
                alt={product.name}
                fill // Use fill instead of layout="fill"
                style={{ objectFit: 'contain' }} // Use style prop instead of objectFit prop
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
              />
            </Box>
          ) : (
            <Box height={{ base: "300px", md: "500px" }} width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" boxShadow="md">
              <Text color="gray.500" fontSize="xl">No Image Available</Text>
            </Box>
          )}
        </Box>

        <Box flex={{ base: '1', md: '0.4' }}>
          <VStack align="stretch" spacing={4}>
            <Heading as="h1" size="xl">{product.name}</Heading>
            <Text fontSize="3xl" fontWeight="bold" color="brand.500">
              {formatPrice(product.price)}
            </Text>

            <HStack align="center" spacing={2}>
              {Array(5)
                .fill('')
                .map((_, i) => (
                  <StarIcon
                    key={i}
                    color={product.rating && i < Math.floor(product.rating) ? 'yellow.400' : 'gray.300'}
                  />
                ))}
              <Text ml={2} fontSize="md" color="gray.600">
                ({product.reviews_count || 0} reviews)
              </Text>
              <Spacer />
              {product.sku && (
                <Text fontSize="sm" color="gray.500">
                  SKU: {product.sku}
                </Text>
              )}
            </HStack>

            {product.brand && (
              <Text fontSize="md" color="gray.600">
                Brand: <Text as="span" fontWeight="semibold">{product.brand}</Text>
              </Text>
            )}

            <Divider my={2} />

            <Text fontSize="lg" color="gray.700" whiteSpace="pre-wrap">
              {product.description}
            </Text>

            <Heading as="h2" size="md" pt={2}>Key Features:</Heading>
            <List spacing={2}>
              {mockSpecs.map((spec, index) => (
                <ListItem key={index}>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  {spec}
                </ListItem>
              ))}
            </List>

            <Button colorScheme="brand" size="lg" width="full" mt={6}>
              Add to Cart
            </Button>

            <Link href="/products" passHref>
              <Button as="a" variant="outline" colorScheme="gray" width="full">
                Back to All Products
              </Button>
            </Link>
          </VStack>
        </Box>
      </Flex>
    </Container>
  );
}