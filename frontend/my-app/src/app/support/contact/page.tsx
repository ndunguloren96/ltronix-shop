'use client'; // This will be a client component for form handling

import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import React from 'react';

export default function ContactPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const toast = useToast();

  const validateForm = () => {
    if (!name || !email || !subject || !message) {
      setError('All fields are required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError(null); // Clear previous errors
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: error || 'Please fill in all required fields correctly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // --- STUB: In a real application, you would send this data to your backend API ---
      // Example:
      // const response = await fetch('/api/contact', { // Your backend API endpoint
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, subject, message }),
      // });
      // const data = await response.json();
      //
      // if (response.ok) {
      //   setSuccess('Your message has been sent successfully!');
      //   setName('');
      //   setEmail('');
      //   setSubject('');
      //   setMessage('');
      //   toast({
      //     title: 'Message Sent',
      //     description: 'We will get back to you shortly.',
      //     status: 'success',
      //     duration: 5000,
      //     isClosable: true,
      //   });
      // } else {
      //   setError(data.message || 'Failed to send message. Please try again.');
      //   toast({
      //     title: 'Error',
      //     description: data.message || 'Failed to send message.',
      //     status: 'error',
      //     duration: 5000,
      //     isClosable: true,
      //   });
      // }
      // --- END STUB ---

      // Simulate API call success
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      setSuccess('Your message has been sent successfully! (Stub)');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      toast({
        title: 'Message Sent (Stub)',
        description: 'Simulated success. In a real app, this would go to your backend.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (err: any) {
      setError(err.message || 'A network error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'A network error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Contact Us
        </Heading>
        <Text textAlign="center" mb={6}>
          Have a question or need support? Fill out the form below and we'll get back to you.
        </Text>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        {success && (
          <Alert status="success" mb={4}>
            <AlertIcon />
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="name" isRequired>
              <FormLabel>Your Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </FormControl>
            <FormControl id="email" isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@example.com"
              />
            </FormControl>
            <FormControl id="subject" isRequired>
              <FormLabel>Subject</FormLabel>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Order Inquiry, Technical Support"
              />
            </FormControl>
            <FormControl id="message" isRequired>
              <FormLabel>Message</FormLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={isSubmitting}
              loadingText="Sending..."
            >
              Send Message
            </Button>
          </VStack>
        </form>
      </Box>
    </Container>
  );
}