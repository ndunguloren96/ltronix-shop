// src/app/page.tsx
'use client';

import {
  Box,
  SimpleGrid,
  VStack,
  Heading,
  Text,
  Button,
  Flex, // Added for layout
  Badge, // Added for cart item count
} from '@chakra-ui/react';
import { MyCard } from '@/components/MyCard';
import { MyButton } from '@/components/MyButton';
import { MyInput } from '@/components/MyInput';
import { MyModal, useDisclosure } from '@/components/MyModal';

// Import your Zustand stores
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  // For the modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Use the Zustand cart store
  const cartItems = useCartStore((state) => state.items);
  const addItemToCart = useCartStore((state) => state.addItem);
  const getTotalItemsInCart = useCartStore((state) => state.getTotalItems);
  const getTotalPriceInCart = useCartStore((state) => state.getTotalPrice);

  // Use the Zustand auth store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Dummy product data for demonstration
  const products = [
    {
      id: 1,
      title: 'Gaming Laptop Pro',
      description: 'High-performance laptop for the ultimate gaming experience.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Laptop',
      price: 1299.00, // Changed to number for cart store
    },
    {
      id: 2,
      title: 'Wireless Headphones',
      description: 'Immersive sound with noise-cancelling technology.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Headphones',
      price: 199.99, // Changed to number for cart store
    },
    {
      id: 3,
      title: 'Smartwatch Series 7',
      description: 'Track your fitness and stay connected on the go.',
      imageUrl: 'https://via.placeholder.com/200x200?text=Smartwatch',
      price: 349.00, // Changed to number for cart store
    },
  ];

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch" mb={10}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="2xl" color="gray.700">
            Welcome to Ltronix Shop!
          </Heading>
          <Box>
            <Text fontSize="lg" mr={2}>
              Cart: <Badge colorScheme="brand">{getTotalItemsInCart()}</Badge> items (Total: ${getTotalPriceInCart().toFixed(2)})
            </Text>
            {isAuthenticated ? (
              <Text fontSize="lg">
                Logged in as: **{user?.email}** (
                <Button variant="link" colorScheme="brand" onClick={logout}>
                  Logout
                </Button>
                )
              </Text>
            ) : (
              <Button variant="link" colorScheme="brand" onClick={() => login('user123', 'test@example.com')}>
                Login as Test User
              </Button>
            )}
          </Box>
        </Flex>

        <Text fontSize="xl" textAlign="center" color="gray.600">
          Your one-stop shop for electronics.
        </Text>

        {/* Section for Input Component and Modal Trigger */}
        <Box maxW="md" mx="auto" p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Account Actions</Heading>
          <MyInput
            label="Search term"
            placeholder="e.g., gaming laptop"
            mb={4} // Add margin-bottom to input
          />
          <MyInput
            label="Your Email"
            placeholder="Enter your email"
            type="email"
            error="Email is required"
            mb={4} // Add margin-bottom to input
          />
          <MyButton onClick={() => alert('Form Submitted!')} mb={4}> {/* Add margin-bottom to button */}
            Submit
          </MyButton>
          <Button variant="outline" colorScheme="brand" onClick={onOpen}> {/* Button to open the modal */}
            Open Info Modal
          </Button>
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
            // Convert price back to string for MyCard display, but use number for addItemToCart
            price={`$${product.price.toFixed(2)}`}
          >
            {/* Override MyCard's default footer with a single "Add to cart" button */}
            <Button
              variant='solid'
              colorScheme='brand'
              width="full" // Make button full width in card
              onClick={() => addItemToCart({
                id: product.id,
                name: product.title,
                price: product.price,
              })}
            >
              Add to cart
            </Button>
          </MyCard>
        ))}
      </SimpleGrid>

      {/* The MyModal component */}
      <MyModal
        isOpen={isOpen}
        onClose={onClose}
        title="Important Information"
        footerContent={
          <Button colorScheme="brand" onClick={onClose}>
            Close
          </Button>
        }
      >
        <Text>
          This is a reusable modal component for displaying alerts, forms, or any other content.
          It's ready for your production-ready e-commerce site!
        </Text>
      </MyModal>
    </Box>
  );
}