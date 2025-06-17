// frontend/my-app/src/app/auth/signup/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

// Define your Django backend URL from environment variables
// This should point to your Django API root (e.g., https://your-ngrok-url.ngrok-free.app/api/v1)
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  // Handler for email/password signup form submission
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
      // Ensure path is /auth/registration/ as per CustomRegisterView setup
      const signupRes = await fetch(`${DJANGO_API_BASE_URL}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important if your backend relies on cookies/sessions for some operations
        body: JSON.stringify({
          email,
          password,
          password_confirm: confirmPassword, // CRITICAL: Changed from 'password2' to 'password_confirm'
                                          // to match CustomRegisterSerializer's expectation
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

        // Attempt to automatically sign the user in after successful registration via NextAuth.js
        const signInResult = await signIn('credentials', {
          redirect: false, // Do not redirect automatically
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
        // Handle non-2xx responses from Django
        const errorData = await signupRes.json();
        console.error('Django signup failed (Status:', signupRes.status, '):', errorData);
        let errorMessage = 'Signup failed. Please check your details.';

        // --- IMPROVED: Specific handling for "email already exists" error ---
        if (signupRes.status === 400 && errorData.email && Array.isArray(errorData.email) && errorData.email.includes('A user with that email already exists.')) {
            errorMessage = 'An account with this email already exists. Please login instead.';
            toast({
                title: 'Account Exists',
                description: errorMessage,
                status: 'info', // Use 'info' or 'warning' for existing accounts
                duration: 7000,
                isClosable: true,
            });
            router.push('/auth/login'); // Immediately redirect to login page
            return; // Stop further processing in this block
        }
        // --- END IMPROVED ---

        // General parsing for other Django REST framework errors
        if (errorData.email && Array.isArray(errorData.email)) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password && Array.isArray(errorData.password)) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.password_confirm && Array.isArray(errorData.password_confirm)) {
            errorMessage = `Confirm Password: ${errorData.password_confirm[0]}`;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (typeof errorData === 'object' && errorData !== null) {
          // Fallback for any other errors returned as an object (e.g., if Django sends a generic error object)
          // Combines all messages from object properties into a single string
          errorMessage = Object.values(errorData).flat().filter(Boolean).join(', ');
          if (errorMessage === '') errorMessage = 'Signup failed due to invalid data.'; // Fallback if values are empty
        } else if (typeof errorData === 'string') {
          // Fallback for raw string errors
          errorMessage = errorData;
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
      console.error('Unexpected signup error (network or unhandled exception):', error);
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
    // Initiate Google sign-up flow via NextAuth.js
    // The social token conversion logic is handled in `src/app/api/auth/[...nextauth]/route.ts`
    signIn('google', { callbackUrl: '/' }); // Redirect to home on successful Google OAuth
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
            <Link href="/auth/login" passHref> {/* CRITICAL: Added passHref to Link component */}
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
