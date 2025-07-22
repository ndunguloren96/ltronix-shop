// frontend/my-app/src/components/HomePageClientWidgets.tsx
'use client'; // IMPORTANT: This directive makes this a Client Component

import React, { useState } from 'react';
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
  useToast,
} from '@chakra-ui/react';
// Removed dynamic import for ChatSupportWidget
// Removed dynamic import for SentryFallback (not present in original, but for consistency if it were)

// Import your Zustand stores (these are client-side only)
import { useCartStore } from '@/store/useCartStore';
// Removed useAuthStore import as it's not needed for the Starter Launch
// import { useAuthStore } from '@/store/useAuthStore';
import { MyModal, useDisclosure } from '@/components/MyModal'; // Import MyModal and useDisclosure

export default function HomePageClientWidgets() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Removed showChat state as ChatSupportWidget is removed
  // const [showChat, setShowChat] = useState(false);
  const toast = useToast();

  // State for customer feedback form
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Removed Zustand auth store variables
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const user = useAuthStore((state) => state.user);
  // const login = useAuthStore((state) => state.login);
  // const logout = useAuthStore((state) => state.logout);

  // Handle feedback submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', { name: feedbackName, message: feedbackMessage });
    toast({
      title: 'Feedback Submitted!',
      description: 'Thank you for your valuable feedback. We appreciate it!',
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
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

      {/* Removed Button to toggle chat widget */}
      {/* Removed Render the dynamically imported component conditionally */}
    </Box>
  );
}

