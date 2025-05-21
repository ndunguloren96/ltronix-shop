'use client';

import React from 'react'; // capitalized

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  Divider,
  List,
  ListItem,
  ListIcon,
  HStack,
  Spacer
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import { useParams } from 'next/navigation'; // Hook to access route parameters

// Placeholder data for a single product.
// In a real application, this would be fetched from an API based on the 'id'.
const mockProductDetails = {
  '1': {
    name: 'Premium Wireless Headphones',
    price: 'Ksh2,999.00',
    images: [
      'https://via.placeholder.com/600x400?text=Headphones+Main',
      'https://via.placeholder.com/150x100?text=Headphones+View1',
      'https://via.placeholder.com/150x100?text=Headphones+View2',
      'https://via.placeholder.com/150x100?text=Headphones+View3',
    ],
    description: 'Experience immersive sound with our Premium Wireless Headphones. Featuring noise-cancelling technology, a comfortable over-ear design, and long-lasting battery life. Perfect for music lovers and professionals alike.',
    specs: [
      'Bluetooth 5.2',
      'Active Noise Cancellation',
      'Up to 30 hours battery life',
      'Ergonomic design for comfort',
      'Built-in microphone for calls',
    ],
    brand: 'AudioTech',
    sku: 'HW-HP-001',
    rating: 4.5,
    reviews: 120,
  },
  '2': {
    name: 'Ultra HD 4K Smart TV',
    price: 'Ksh28,999.00',
    images: [
      'https://via.placeholder.com/600x400?text=Smart+TV+Main',
      'https://via.placeholder.com/150x100?text=Smart+TV+View1',
      'https://via.placeholder.com/150x100?text=Smart+TV+View2',
    ],
    description: 'Immerse yourself in stunning visuals with this Ultra HD 4K Smart TV. Enjoy vibrant colors, incredible detail, and access to all your favorite streaming apps. A truly cinematic experience at home.',
    specs: [
      '55-inch LED Display',
      '3840 x 2160 (4K UHD) Resolution',
      'Smart TV with built-in Wi-Fi',
      'Multiple HDMI and USB ports',
      'HDR10+ support',
    ],
    brand: 'VisionCraft',
    sku: 'EL-TV-002',
    rating: 4.8,
    reviews: 250,
  },
  // You can add more product details here matching the IDs from mockProducts in page.tsx
  // For demonstration, we'll only detail the first two.
  // If a product ID from the URL isn't found here, it will display a "Product Not Found" message.
};


export default function ProductDetailPage() {
  const params = useParams(); // Get route parameters, e.g., { id: '1' }
  const productId = params.id as string; // Assert id as string

  const product = mockProductDetails[productId as keyof typeof mockProductDetails];

  // If product is not found (e.g., direct navigation to an invalid ID)
  if (!product) {
    return (
      <Container maxW="container.md" py={10} textAlign="center">
        <Heading as="h1" size="xl" mb={4}>Product Not Found</Heading>
        <Text>The product you are looking for does not exist or has been removed.</Text>
        <Button mt={6} colorScheme="brand" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Container>
    );
  }

  // State to manage the currently displayed main image
  const [mainImage, setMainImage] = React.useState(product.images[0]);
  // Import React at the top of the file if you use React.useState
  // import React from 'react'; // Add this line if not already there

  return (
    <Container maxW="7xl" py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Left Column: Image Gallery */}
        <Box flex={{ base: '1', md: '0.6' }}>
          {/* Main Product Image */}
          <Image
            src={mainImage}
            alt={product.name}
            borderRadius="lg"
            boxShadow="md"
            width="100%"
            maxH="500px"
            objectFit="contain"
            mb={4}
          />
          {/* Thumbnail Gallery */}
          <HStack spacing={4} justifyContent="center" flexWrap="wrap">
            {product.images.map((img, index) => (
              <Image
                key={index}
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                boxSize="100px"
                objectFit="cover"
                borderRadius="md"
                cursor="pointer"
                border={mainImage === img ? '2px solid' : '1px solid'}
                borderColor={mainImage === img ? 'brand.500' : 'gray.200'}
                _hover={{ borderColor: 'brand.400', boxShadow: 'sm' }}
                onClick={() => setMainImage(img)}
              />
            ))}
          </HStack>
        </Box>

        {/* Right Column: Product Details */}
        <Box flex={{ base: '1', md: '0.4' }}>
          <Heading as="h1" size="xl" mb={2}>
            {product.name}
          </Heading>
          <Text fontSize="2xl" fontWeight="bold" color="brand.500" mb={4}>
            {product.price}
          </Text>

          <HStack mb={4}>
            <Flex alignItems="center">
              {Array(5)
                .fill('')
                .map((_, i) => (
                  <StarIcon
                    key={i}
                    color={i < Math.floor(product.rating) ? 'yellow.400' : 'gray.300'}
                  />
                ))}
              <Text ml={2} fontSize="sm" color="gray.600">
                ({product.reviews} reviews)
              </Text>
            </Flex>
            <Spacer />
            <Text fontSize="sm" color="gray.500">
              SKU: {product.sku}
            </Text>
          </HStack>

          <Divider my={4} />

          <Text fontSize="md" mb={4}>
            {product.description}
          </Text>

          <Heading as="h2" size="md" mb={2}>Specifications:</Heading>
          <List spacing={2} mb={6}>
            {product.specs.map((spec, index) => (
              <ListItem key={index}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {spec}
              </ListItem>
            ))}
          </List>

          {/* Add to Cart Section */}
          <Button colorScheme="brand" size="lg" width="full" mt={6}>
            Add to Cart
          </Button>
        </Box>
      </Flex>
    </Container>
  );
}