// src/app/auth/signup/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton'; // Adjust path if necessary
import  GoogleSignInButton  from '../../../components/GoogleSignInButton'; // Adjust path if necessary
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Signup Error',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Direct API call for email/password signup
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Account created.',
          description: 'Your account has been created successfully. Please login.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        router.push('/auth/login'); // Redirect to login page after successful registration
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.email?.[0] || errorData.password?.[0] || 'An unexpected error occurred.';
        toast({
          title: 'Signup Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Error',
        description: 'Could not connect to the server. Please try again later.',
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
            Create Your Account
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600">
            Sign up to start shopping and manage your orders.
          </Text>

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
                <FormHelperText>Must be at least 8 characters.</FormHelperText>
              </FormControl>

              <FormControl id="confirm-password" isInvalid={!!passwordError}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                {passwordError && (
                  <FormHelperText color="red.500">{passwordError}</FormHelperText>
                )}
              </FormControl>

              {/* Explicit Sign Up Button */}
              <MyButton
                type="submit" // Set type to submit for form submission
                width="full"
                isLoading={isLoading}
                isDisabled={!!passwordError || isLoading}
              >
                Sign Up
              </MyButton>
            </VStack>
          </form>

          <Text textAlign="center" mt={4} mb={4}>
            Or
          </Text>

          {/* Google Sign-In Button */}
          <GoogleSignInButton onClick={() => signIn('google')} isLoading={isLoading}>
            Sign up with Google
          </GoogleSignInButton>

          <Text fontSize="sm" textAlign="center" mt={4}>
            Already have an account?{' '}
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