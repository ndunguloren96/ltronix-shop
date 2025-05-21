// src/app/products/page.tsx
'use client';

import { Box, Container, Heading, SimpleGrid, Text, Image } from '@chakra-ui/react';
import { ProductCard } from '@/components/ProductCard'; // Import the new ProductCard component

// Placeholder data for products (will be replaced with actual API calls later)
const mockProducts = [
  { id: '1', name: 'Premium Wireless Headphones', price: 'Ksh2,999.00', imageUrl: 'https://via.placeholder.com/250/200?text=Headphones' },
  { id: '2', name: 'Ultra HD 4K Smart TV', price: 'Ksh28,999.00', imageUrl: 'https://via.placeholder.com/250/200?text=Smart+TV' },
  { id: '3', name: 'High-Performance Gaming Laptop', price: 'Ksh55,999.00', imageUrl: 'https://via.placeholder.com/250/200?text=Laptop' },
  { id: '4', name: 'Compact Digital Camera', price: 'Ksh7,500.00', imageUrl: 'https://via.placeholder.com/250/200?text=Camera' },
  { id: '5', name: 'Smart Fitness Tracker', price: 'Ksh3,200.00', imageUrl: 'https://via.placeholder.com/250/200?text=Tracker' },
  { id: '6', name: 'Portable Bluetooth Speaker', price: 'Ksh750.00', imageUrl: 'https://via.placeholder.com/250/200?text=Speaker' },
  { id: '7', name: 'External SSD 1TB', price: 'Ksh2,800.00', imageUrl: 'https://via.placeholder.com/250/200?text=SSD' },
  { id: '8', name: 'Wireless Charging Pad', price: 'Ksh2350.00', imageUrl: 'https://via.placeholder.com/250/200?text=Charger' },
];

export default function ProductsPage() {
  return (
    <Container maxW="6xl" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        All Products
      </Heading>
      <SimpleGrid
        columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
        spacing={6}
      >
        {mockProducts.map(product => (
          // Use the ProductCard component, passing product data as props
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}