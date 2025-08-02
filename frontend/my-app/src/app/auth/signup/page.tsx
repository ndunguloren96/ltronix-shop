// frontend/my-app/src/app/auth/signup/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link'; // Alias Next.js Link for clarity with ChakraLink

// Define your Django backend URL from environment variables
// It should NOT have a trailing slash for consistent URL construction
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

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
      // Make a direct POST request to your Django backend's signup endpoint
      const signupRes = await fetch(`${DJANGO_API_BASE_URL}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          password2: confirmPassword,
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

        // Automatically attempt to sign in after successful registration
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.ok) {
          toast({
            title: 'Login Successful',
            description: 'You have been automatically logged in.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          router.push('/'); // Redirect to home page after successful login
        } else {
          console.error('Automatic login after signup failed:', signInResult?.error);
          toast({
            title: 'Login Failed',
            description: 'Account created, but automatic login failed. Please try logging in manually.',
            status: 'warning',
            duration: 7000,
            isClosable: true,
          });
          router.push('/auth/login'); // Redirect to login page if auto-login fails
        }
      } else {
        const errorData = await signupRes.json();
        console.error('Django signup failed (Status:', signupRes.status, '):', errorData);
        let errorMessage = 'Signup failed. Please check your details.';

        // Specific handling for "email already exists" or other common errors
        if (signupRes.status === 400) {
            if (errorData.email && Array.isArray(errorData.email) && errorData.email.includes('A user with that email already exists.')) {
                errorMessage = 'An account with this email already exists. Please login instead.';
                toast({ title: 'Account Exists', description: errorMessage, status: 'info', duration: 7000, isClosable: true });
                router.push('/auth/login');
                return;
            } else if (errorData.password && Array.isArray(errorData.password)) {
                errorMessage = `Password: ${errorData.password[0]}`;
            } else if (errorData.password2 && Array.isArray(errorData.password2)) { // Check for password2 errors
                errorMessage = `Confirm Password: ${errorData.password2[0]}`;
            } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
                errorMessage = errorData.non_field_errors[0];
            } else if (typeof errorData === 'object' && errorData !== null) {
                // Handle errors for the new fields as well
                const allErrors = Object.values(errorData).flat().filter(Boolean);
                if (allErrors.length > 0) {
                    errorMessage = allErrors.join(', ');
                } else {
                    errorMessage = 'Signup failed due to invalid data.';
                }
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            }
        } else if (signupRes.status === 405) { // Method Not Allowed - indicates a URL/method mismatch
            errorMessage = 'Signup not allowed. Server endpoint configuration issue.';
        }

        toast({
          title: 'Signup Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000,
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

  const handleGoogleSignUp = () => {
    setIsLoading(true);
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
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <FormHelperText>At least 8 characters.</FormHelperText>
              </FormControl>
              <FormControl id="confirm-password" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </FormControl>
              <MyButton type="submit" isLoading={isLoading} width="full">
                Sign Up
              </MyButton>
            </VStack>
          </form>
          <Text textAlign="center">Or</Text>
          <GoogleSignInButton onClick={handleGoogleSignUp} isLoading={isLoading}>
            Sign Up with Google
          </GoogleSignInButton>
          <Text textAlign="center">
            Already have an account?{' '}
            {/* Correct NextLink and Chakra Text as link for consistency */}
            <NextLink href="/auth/login" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">Sign In</Text>
            </NextLink>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
