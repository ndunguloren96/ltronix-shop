// src/app/auth/login/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton'; // Adjust path if necessary
import GoogleSignInButton from '../../../components/GoogleSignInButton'; // <<--- CHANGE HERE: Removed curly braces for default import
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Do not redirect automatically
        email,
        password,
      });

      if (result?.error) {
        let errorMessage = 'Invalid credentials. Please try again.';
        // You might want to parse result.error for more specific messages from NextAuth.js
        // or ensure your Django backend sends more user-friendly messages for credentials.
        if (result.error.includes('401')) { // Example: if your backend error includes '401'
          errorMessage = 'Incorrect email or password.';
        }
        toast({
          title: 'Login Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result?.ok) {
        toast({
          title: 'Login Successful',
          description: 'You have been successfully logged in.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/'); // Redirect to the home page or a dashboard upon successful login
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred during login.',
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
            Welcome Back!
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600">
            Sign in to continue your shopping experience.
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
                <FormHelperText>
                  <Link href="/auth/forgot-password" passHref>
                    <Text as="a" color="brand.500" fontWeight="bold">
                      Forgot password?
                    </Text>
                  </Link>
                </FormHelperText>
              </FormControl>

              {/* Explicit Sign In Button */}
              <MyButton
                type="submit" // Set type to submit for form submission
                width="full"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Sign In
              </MyButton>
            </VStack>
          </form>

          <Text textAlign="center" mt={4} mb={4}>
            Or
          </Text>

          {/* Google Sign-In Button */}
          {/* Changed props to onClick and children */}
          <GoogleSignInButton onClick={() => signIn('google')} isLoading={isLoading}>
            Sign In with Google
          </GoogleSignInButton>

          <Text fontSize="sm" textAlign="center" mt={4}>
            Don't have an account?{' '}
            <Link href="/auth/signup" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">
                Sign Up
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}