// src/app/auth/forgot-password/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api'; // Default to local Django API if not set

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Make a direct POST request to your Django backend's password reset endpoint
      const res = await fetch(`${DJANGO_API_BASE_URL}/auth/password/reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast({
          title: 'Password Reset Email Sent',
          description: 'If an account with that email exists, you will receive a password reset link shortly.',
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
        // Optionally redirect to a confirmation page or login page
        router.push('/auth/login');
      } else {
        const errorData = await res.json();
        console.error('Django password reset request failed:', errorData);
        let errorMessage = 'Failed to send password reset email. Please try again.';

        if (errorData.email && Array.isArray(errorData.email)) {
          errorMessage = errorData.email[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        }

        toast({
          title: 'Password Reset Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected error during password reset request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" mb={6}>
            Forgot Your Password?
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600" mb={4}>
            Enter your email address below and we'll send you a link to reset your password.
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </FormControl>

              <MyButton
                type="submit"
                width="full"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Send Reset Link
              </MyButton>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" mt={4}>
            Remembered your password?{' '}
            <Link href="/auth/login" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">
                Log In
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
