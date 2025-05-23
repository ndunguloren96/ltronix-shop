// src/app/page.tsx
'use client';

import React, { useState } from 'react'; // Ensure React is imported
import {
  Box,
  SimpleGrid,
  VStack,
  Heading,
  Text,
  Button,
  Flex,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast, // To provide feedback after submission
} from '@chakra-ui/react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { ProductCard } from '@/components/ProductCard';
import { MyModal, useDisclosure } from '@/components/MyModal';

// Import your Zustand stores
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';


// Dynamically import the ChatSupportWidget
const DynamicChatSupportWidget = dynamic(() => import('@/components/ChatSupportWidget'), {
  ssr: false,
  loading: () => (
    <Box p={4} bg="gray.100" borderRadius="md" boxShadow="sm" textAlign="center" fontSize="sm" color="gray.500">
      Loading chat...
    </Box>
  ),
});

export default function Home() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showChat, setShowChat] = useState(false);
  const toast = useToast(); // Initialize useToast hook

  // State for customer feedback form
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Zustand auth store (cart store is directly used in ProductCard now)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Dummy product data for demonstration (expanded for more categories)
  const products = [
    {
      id: 1,
      title: 'Ltronix Gaming Laptop Pro',
      description: 'Experience unparalleled performance with the latest Ltronix gaming laptop. Designed for the ultimate gaming experience with RTX graphics and i9 processor.',
      imageUrl: '/images/products/gaming-laptop.jpg',
      imageAlt: 'Ltronix Gaming Laptop Pro',
      price: 1299.00,
    },
    {
      id: 2,
      title: 'Ltronix Wireless Headphones Pro',
      description: 'Immersive sound with advanced noise-cancelling technology. Perfect for music lovers and professionals on the go.',
      imageUrl: '/images/products/wireless-headphones.jpg',
      imageAlt: 'Ltronix Wireless Headphones',
      price: 199.99,
    },
    {
      id: 3,
      title: 'Ltronix Smartwatch Series 7',
      description: 'Track your fitness, monitor health, and stay connected on the go with the stylish Series 7 smartwatch. Long-lasting battery.',
      imageUrl: '/images/products/smartwatch-7.jpg',
      imageAlt: 'Ltronix Smartwatch Series 7',
      price: 349.00,
    },
    {
      id: 4,
      title: 'Ltronix 4K Smart TV 65"',
      description: 'Bring cinema home with crystal-clear 4K resolution and smart features. Enjoy your favorite content like never before with vibrant colors.',
      imageUrl: '/images/products/4k-smart-tv.jpg',
      imageAlt: 'Ltronix 4K Smart TV',
      price: 799.00,
    },
    {
      id: 5,
      title: 'Ltronix Compact Drone',
      description: 'Capture stunning aerial footage with this easy-to-fly compact drone. Perfect for beginners and experienced pilots alike.',
      imageUrl: '/images/products/drone.jpg', // Assuming you'll add this image
      imageAlt: 'Ltronix Compact Drone',
      price: 499.00,
    },
    {
      id: 6,
      title: 'Ltronix Portable Bluetooth Speaker',
      description: 'Powerful sound in a portable package. Take your music anywhere with this long-lasting, waterproof Bluetooth speaker.',
      imageUrl: '/images/products/bluetooth-speaker.jpg', // Assuming you'll add this image
      imageAlt: 'Ltronix Portable Bluetooth Speaker',
      price: 89.99,
    },
  ];

  // Derive product sections
  const recommendedProducts = products.slice(0, 3); // First 3 products
  const hotDeals = products.slice(products.length - 3, products.length); // Last 3 products as hot deals
  const trending = products.slice(1, 4); // Middle 3 products for trending

  // Handle feedback submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the feedback to your backend API
    console.log('Feedback submitted:', { name: feedbackName, message: feedbackMessage });
    toast({
      title: 'Feedback Submitted!',
      description: 'Thank you for your valuable feedback. We appreciate it!',
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
    // Clear the form
    setFeedbackName('');
    setFeedbackMessage('');
  };

  return (
    <Box> {/* This outer Box correctly wraps all content */}
      {/* Hero Section with an LCP-priority Image */}
      <Box position="relative" width="100%" height={{ base: '300px', md: '450px', lg: '550px' }} overflow="hidden">
        <Image
          src="/hero-banner.png"
          alt="Discover the latest electronics at Ltronix Shop"
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="100vw"
        />
        <Container maxW="container.xl" h="100%" display="flex" alignItems="center" justifyContent="center">
          <VStack
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            color="white"
            textAlign="center"
            zIndex="1"
            textShadow="2px 2px 4px rgba(0,0,0,0.7)"
            spacing={4}
            maxW="2xl"
          >
            <Heading as="h1" size={{ base: 'xl', md: '2xl', lg: '3xl' }}>
              Welcome to Ltronix Shop!
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }}>
              Your ultimate destination for cutting-edge electronics and gadgets.
            </Text>
            <Button colorScheme="brand" size="lg" mt={4} onClick={() => alert('Shop Now clicked!')}>
              Shop Now!
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Main content wrapper */}
      <Box p={8}>
        {/* Recommended Products Section */}
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="gray.700">
          Recommended for You
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10} mb={10}>
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </SimpleGrid>

        <Divider my={10} /> {/* Visual separator */}

        {/* Hot Deals Section */}
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="red.500">
          Hot Deals! 🔥
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10} mb={10}>
          {hotDeals.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </SimpleGrid>

        <Divider my={10} /> {/* Visual separator */}

        {/* Trending Products Section */}
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="orange.400">
          Trending Now
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10} mb={10}>
          {trending.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </SimpleGrid>

        <Divider my={10} /> {/* Visual separator */}

        {/* Shop by Category Section (Placeholder) */}
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="brand.700">
          Shop by Category
        </Heading>
        <Box p={8} bg="gray.50" borderRadius="lg" textAlign="center" mb={10}> {/* Added mb={10} for spacing */}
          <Text fontSize="lg" color="gray.600" mb={4}>
            Explore our wide range of electronics by category.
          </Text>
          <Button colorScheme="brand" size="lg" as='a' href="/products/categories">
            View All Categories
          </Button>
          {/* TODO: Implement a more detailed category grid or list here if desired */}
        </Box>

        <Divider my={10} /> {/* Visual separator */}

        {/* Customer Feedback Section (NEW) */}
        <Box p={8} bg="gray.50" borderRadius="lg" mb={10}> {/* Use mb for spacing */}
          <Heading as="h2" size="xl" textAlign="center" mb={6} color="blue.600">
            We Value Your Feedback!
          </Heading>
          <Text fontSize="lg" textAlign="center" color="gray.600" mb={8}>
            Help us improve your shopping experience by sharing your thoughts.
          </Text>
          <Flex justifyContent="center">
            <Box as="form" onSubmit={handleSubmitFeedback} width={{ base: '100%', md: '80%', lg: '60%' }}>
              <VStack spacing={4}>
                <FormControl id="feedback-name" isRequired>
                  <FormLabel>Your Name</FormLabel>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                  />
                </FormControl>
                <FormControl id="feedback-message" isRequired>
                  <FormLabel>Your Feedback</FormLabel>
                  <Textarea
                    placeholder="Tell us about your experience, suggestions, or any issues you faced..."
                    rows={6}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                  />
                </FormControl>
                <Button type="submit" colorScheme="blue" size="lg" width="full">
                  Submit Feedback
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Box>


        {/* The MyModal component (still available but only pops up) */}
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

        {/* Render the dynamically imported component */}
        {showChat && (
          <Box position="fixed" bottom="4" right="4" zIndex="sticky">
            <DynamicChatSupportWidget />
          </Box>
        )}
      </Box>
    </Box>
  );
}