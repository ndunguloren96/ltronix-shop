// src/app/auth/signup/page.tsx
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
  Stack, // Added for layout
  Divider, // Added for separator
  Link as ChakraLink, // Alias Link to avoid conflict with Next.js Link
} from '@chakra-ui/react';
import React from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link'; // For Next.js Link component for navigation
import { signIn } from 'next-auth/react'; // Import signIn for potential social signup

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleCredentialsSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Make API call to your Next.js API route for signup, which then calls Django
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), // Assuming Django needs email & password for signup
      });

      const data = await response.json(); // Parse response data

      if (response.ok) {
        toast({
          title: 'Registration Successful',
          description: data.message || 'Account created successfully. Please log in.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        router.push('/auth/login'); // Redirect to login after successful signup
      } else {
        // Handle backend errors
        const errorDescription = data.message || data.detail || 'An unexpected error occurred.';
        toast({
          title: 'Registration Failed',
          description: errorDescription,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        console.error('Signup API error:', data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error or server unavailable. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      console.error('Error during signup API call:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function for social signup (Google)
  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    // When using signIn, NextAuth.js handles the redirection to Google
    // and then back to your callbackUrl (which could be /account or any other page).
    // The 'redirect: false' means we will handle the redirection manually based on the result.
    const result = await signIn('google', { callbackUrl: '/account', redirect: false });
    setIsSubmitting(false);

    if (result?.error) {
      toast({
        title: 'Google Sign Up Failed',
        description: result.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      console.error('Google sign-up error:', result.error);
    } else if (result?.ok) {
      toast({
        title: 'Google Sign Up Successful',
        description: 'You have been registered and logged in via Google.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      // Redirect to the account page or a different success page
      router.push(result?.url || '/account');
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Create Your Account
        </Heading>
        <form onSubmit={handleCredentialsSignup}>
          <VStack spacing={4}>
            {/* You had 'name' in your API route stub, but not in the frontend.
                If your Django signup requires a name, add an input field for it here.
                For now, we'll proceed with just email and password.
            <FormControl id="name">
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </FormControl> */}
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
              <NextLink href="/auth/login" passHref legacyBehavior>
                <ChakraLink color="brand.500" fontWeight="bold">
                  Login
                </ChakraLink>
              </NextLink>
            </Text>
          </VStack>
        </form>

        {/* Social Sign-up Section - UNCOMMENTED */}
        <Divider my={6} />
        <Text fontSize="md" textAlign="center" mb={4} color="gray.600">
          Or sign up with
        </Text>
        <Button
          onClick={handleGoogleSignUp}
          leftIcon={<GoogleIcon />}
          colorScheme="red"
          variant="outline"
          size="lg"
          width="full"
          isLoading={isSubmitting}
          _hover={{ bg: 'red.50' }}
        >
          Sign Up with Google
        </Button>
      </Box>
    </Container>
  );
}

// Re-using the GoogleIcon component from login/page.tsx
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
      <path d="M12.24 10.27c.36 0 .72-.03 1.07-.08.68-.08 1.1-.66 1.02-1.34s-.66-1.1-1.34-1.02c-.38.05-.75.08-1.12.08-2.61 0-4.73-2.12-4.73-4.73S9.63 2.12 12.24 2.12c2.16 0 3.96 1.44 4.54 3.4.15.48.64.76 1.13.62.48-.15.76-.64.62-1.13C17.84 2.89 15.24.47 12.24.47 7.55.47 3.65 4.37 3.65 9.06s3.9 8.59 8.59 8.59c4.73 0 7.85-3.3 8.16-8.23.01-.13.01-.26.01-.39 0-.01-.01-.01-.01-.01H12.24zm0 4.19c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" fill="currentColor" />
      <path d="M20.2 10.37c-.12-.4-.53-.66-.93-.53-.4.12-.66.53-.53.93.07.24.1.49.1.75 0 2.22-1.81 4.03-4.03 4.03-1.68 0-3.1-.98-3.79-2.39-.14-.29-.44-.45-.75-.4-.32.06-.57.34-.63.66-.08.4-.1.8-.1 1.22 0 3.25 2.65 5.9 5.9 5.9 3.25 0 5.9-2.65 5.9-5.9 0-.32-.01-.64-.04-.96z" fill="currentColor" />
    </svg>
  );
}