'use client'; // This page needs to be a client component

import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    // --- STUB: In a real application, you would send this data to your backend API ---
    // Example:
    // try {
    //   const response = await fetch('/api/register', { // Your backend API endpoint
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password }),
    //   });
    //   const data = await response.json();
    //   if (response.ok) {
    //     toast({ title: 'Registration Successful', description: 'Please log in.', status: 'success' });
    //     router.push('/auth/login');
    //   } else {
    //     toast({ title: 'Registration Failed', description: data.message || 'An error occurred.', status: 'error' });
    //   }
    // } catch (error) {
    //   toast({ title: 'Error', description: 'Network error or server unavailable.', status: 'error' });
    // } finally {
    //   setIsSubmitting(false);
    // }
    // --- END STUB ---

    // For now, just simulate success and redirect
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Signup Successful (Stub)',
        description: 'You can now login with "user@example.com" and "password123".',
        status: 'info', // Use info status for a stub
        duration: 7000,
        isClosable: true,
      });
      router.push('/auth/login'); // Redirect to login after "signup"
    }, 1500);
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Create Your Account
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="email">
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                required
              />
            </FormControl>
            <FormControl id="confirm-password">
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={isSubmitting}
            >
              Sign Up
            </Button>
            <Text fontSize="sm" mt={4} textAlign="center">
              Already have an account?{' '}
              <Button variant="link" colorScheme="brand" onClick={() => router.push('/auth/login')}>
                Login
              </Button>
            </Text>
          </VStack>
        </form>
      </Box>
    </Container>
  );
}