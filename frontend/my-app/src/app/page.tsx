// src/app/page.tsx
'use client';

import { Box, SimpleGrid, VStack, Heading, Text } from '@chakra-ui/react'; // Add VStack for vertical stacking
import { MyCard } from '@/components/MyCard';
import { MyButton } from '@/components/MyButton';
import { MyInput } from '@/components/MyInput'; // Import your custom input

export default function Home() {
  // Dummy product data for demonstration (keep this for the cards)
  const products = [
    {
      id: 1,
      title: 'Gaming Laptop Pro',
      description: 'High-performance laptop for the ultimate gaming experience.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Laptop',
      price: '$1299.00',
    },
    {
      id: 2,
      title: 'Wireless Headphones',
      description: 'Immersive sound with noise-cancelling technology.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Headphones',
      price: '$199.99',
    },
    {
      id: 3,
      title: 'Smartwatch Series 7',
      description: 'Track your fitness and stay connected on the go.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Smartwatch',
      price: '$349.00',
    },
  ];

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch" mb={10}> {/* Use VStack for overall vertical spacing */}
        <Heading as="h1" size="2xl" textAlign="center" color="gray.700">
          Welcome to Ltronix Shop!
        </Heading>
        <Text fontSize="xl" textAlign="center" color="gray.600">
          Your one-stop shop for electronics.
        </Text>

        {/* Section for Input Component */}
        <Box maxW="md" mx="auto" p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Search Products</Heading>
          <MyInput
            label="Search term"
            placeholder="e.g., gaming laptop"
            // You can add value and onChange props here for actual state management
          />
          <MyInput
            label="Your Email"
            placeholder="Enter your email"
            type="email"
            error="Email is required" // Example error message
          />
          <MyButton mt={4} onClick={() => alert('Search Clicked!')}>
            Search
          </MyButton>
        </Box>
      </VStack>

      {/* Section for Product Cards */}
      <Heading as="h2" size="xl" textAlign="center" mb={6} color="gray.700">
        Featured Products
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
        {products.map((product) => (
          <MyCard
            key={product.id}
            title={product.title}
            description={product.description}
            imageUrl={product.imageUrl}
            price={product.price}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}