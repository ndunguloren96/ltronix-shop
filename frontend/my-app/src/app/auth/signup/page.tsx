// src/app/auth/signup/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Used for potential auto-login after signup
import Link from 'next/link';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api'; // Default to local Django API if not set

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Signup Failed',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Make a direct POST request to your Django backend's registration endpoint
      const signupRes = await fetch(`${DJANGO_API_BASE_URL}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          // If your CustomRegisterSerializer requires password_confirm or other fields, add them here
          // password_confirm: confirmPassword,
        }),
      });

      if (signupRes.ok) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Attempting to log you in...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Attempt to automatically sign the user in after successful registration
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          console.error('Auto-login after signup failed:', signInResult.error);
          toast({
            title: 'Auto-Login Failed',
            description: 'Your account was created, but automatic login failed. Please try logging in manually.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          router.push('/auth/login'); // Redirect to login page if auto-login fails
        } else if (signInResult?.ok) {
          toast({
            title: 'Login Successful',
            description: 'You have been successfully logged in.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          router.push('/'); // Redirect to the home page after successful signup and auto-login
        }
      } else {
        const errorData = await signupRes.json();
        console.error('Django signup failed:', errorData);
        let errorMessage = 'Signup failed. Please check your details.';

        // Attempt to parse common Django REST framework errors
        if (errorData.email && Array.isArray(errorData.email)) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password && Array.isArray(errorData.password)) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (typeof errorData === 'object' && errorData !== null) {
          // General parsing for other field errors if any
          errorMessage = Object.values(errorData).flat().join(', ');
        }

        toast({
          title: 'Signup Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000, // Longer duration for detailed errors
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      toast({
        title: 'Signup Error',
        description: 'An unexpected error occurred during signup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Google Sign-up button
  const handleGoogleSignUp = () => {
    setIsLoading(true);
    // NextAuth handles the redirection to Google and then back to your app
    // The `callbackUrl` determines where to redirect after successful Google OAuth.
    // The social token conversion logic is handled in `src/app/api/auth/[...nextauth]/route.ts`
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" mb={6}>
            Join Us!
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600">
            Create an account to start shopping.
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

              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
                <FormHelperText>
                  Password must be at least 8 characters.
                </FormHelperText>
              </FormControl>

              <FormControl id="confirm-password" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </FormControl>

              <MyButton
                type="submit"
                width="full"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Sign Up
              </MyButton>
            </VStack>
          </form>

          <Text textAlign="center" mt={4} mb={4}>
            Or
          </Text>

          <GoogleSignInButton onClick={handleGoogleSignUp} isLoading={isLoading}>
            Sign Up with Google
          </GoogleSignInButton>

          <Text fontSize="sm" textAlign="center" mt={4}>
            Already have an account?{' '}
            <Link href="/auth/login" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">
                Sign In
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}