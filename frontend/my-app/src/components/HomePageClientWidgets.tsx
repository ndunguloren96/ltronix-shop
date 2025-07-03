// frontend/my-app/src/components/HomePageClientWidgets.tsx
'use client'; // IMPORTANT: This directive makes this a Client Component

import React, { useState } from 'react';
import {
  Box,
  SimpleGrid, // Keep SimpleGrid for future product display if needed, but not for now
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
import dynamic from 'next/dynamic';

// Import your Zustand stores (these are client-side only)
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MyModal, useDisclosure } from '@/components/MyModal'; // Import MyModal and useDisclosure

// Dynamically import the ChatSupportWidget - now correctly in a client component
const DynamicChatSupportWidget = dynamic(() => import('@/components/ChatSupportWidget'), {
  ssr: false, // ssr: false is allowed here because this is a client component
  loading: () => (
    <Box p={4} bg="gray.100" borderRadius="md" boxShadow="sm" textAlign="center" fontSize="sm" color="gray.500">
      Loading chat...
    </Box>
  ),
});

// Dummy product data removed as HomePage will now use ProductsClientPage
// which fetches real data. If you need specific sections (Recommended, Hot Deals)
// from fetched data, that logic will go into ProductsClientPage or a new component.

export default function HomePageClientWidgets() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showChat, setShowChat] = useState(false); // State to toggle chat widget
  const toast = useToast(); // Initialize useToast hook

  // State for customer feedback form
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Zustand auth store (cart store is directly used in ProductCard now)
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const user = useAuthStore((state) => state.user);
  // const login = useAuthStore((state) => state.login);
  // const logout = useAuthStore((state) => state.logout);

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
    <Box p={8}>
      {/* Customer Feedback Section */}
      <Box p={8} bg="gray.50" borderRadius="lg" mb={10}>
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
          It&apos;s ready for your production-ready e-commerce site!
        </Text>
      </MyModal>

      {/* Button to toggle chat widget (example of client-side interaction) */}
      <Flex justifyContent="center" mb={10}>
        <Button onClick={() => setShowChat(!showChat)} colorScheme="teal">
          {showChat ? 'Hide Chat Support' : 'Show Chat Support'}
        </Button>
      </Flex>


      {/* Render the dynamically imported component conditionally */}
      {showChat && (
        <Box position="fixed" bottom="4" right="4" zIndex="sticky">
          <DynamicChatSupportWidget />
        </Box>
      )}
    </Box>
  );
}
