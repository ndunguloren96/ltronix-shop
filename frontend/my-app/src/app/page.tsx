'use client';

import { Box, SimpleGrid } from '@chakra-ui/react'; // Add SimpleGrid for layout
import { MyCard } from '@/components/MyCard'; // Import your custom card

export default function Home() {
  // Dummy product data for demonstration
  const products = [
    {
      id: 1,
      title: 'Gaming Laptop Pro',
      description: 'High-performance laptop for the ultimate gaming experience.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Laptop', // Placeholder image
      price: '$1299.00',
    },
    {
      id: 2,
      title: 'Wireless Headphones',
      description: 'Immersive sound with noise-cancelling technology.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Headphones', // Placeholder image
      price: '$199.99',
    },
    {
      id: 3,
      title: 'Smartwatch Series 7',
      description: 'Track your fitness and stay connected on the go.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Smartwatch', // Placeholder image
      price: '$349.00',
    },
  ];

  return (
    <Box p={8}> {/* Add some padding to the main box */}
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