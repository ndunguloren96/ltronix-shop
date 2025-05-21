'use client'; // This page needs to be a client component to use NextAuth.js hooks

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
  useToast, // For displaying success/error messages
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react'; // Import signIn function
import React from 'react'; // Import React for useState
import { useRouter } from 'next/navigation'; // For programmatic navigation

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Call the signIn function from next-auth/react
    const result = await signIn('credentials', {
      redirect: false, // Prevent NextAuth.js from redirecting on its own
      email,
      password,
    });

    setIsSubmitting(false);

    if (result?.error) {
      toast({
        title: 'Login Failed',
        description: result.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (result?.ok) {
      toast({
        title: 'Login Successful',
        description: 'You have been logged in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/account'); // Redirect to a protected route after successful login
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Login to Your Account
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
                placeholder="Enter your password"
                required
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="brand" // Using your custom brand color
              size="lg"
              width="full"
              mt={4}
              isLoading={isSubmitting}
            >
              Login
            </Button>
            <Text fontSize="sm" mt={4} textAlign="center">
              Don't have an account?{' '}
              <Button variant="link" colorScheme="brand" onClick={() => router.push('/auth/signup')}>
                Sign Up
              </Button>
            </Text>
          </VStack>
        </form>
      </Box>
    </Container>
  );
}