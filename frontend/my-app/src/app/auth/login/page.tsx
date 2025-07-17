// /var/www/ltronix-shop/frontend/my-app/src/app/auth/login/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
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
      // Attempt to sign in using the 'credentials' provider configured in [...nextauth]/route.ts
      const result = await signIn('credentials', {
        redirect: false, // Prevents automatic redirection by NextAuth.js; we handle it manually
        email,
        password,
      });

      if (result?.error) {
        console.error('Credentials login failed:', result.error); // Log the specific error for debugging
        let errorMessage = 'Login failed. Please check your email and password.'; // More general initial message

        // NextAuth's 'credentials' provider errors are often generic like 'CredentialsSignin'.
        // If your Django backend is set up to return specific messages via `route.ts` and
        // NextAuth passes them through, you can enhance this parsing.
        if (result.error === 'CredentialsSignin') {
            errorMessage = 'Incorrect email or password. Please try again.';
        } else if (result.error.includes('timeout')) {
            errorMessage = 'Network timeout during login. Please check your connection.';
        } else if (result.error.includes('Invalid credentials')) { // From our custom error in auth.ts
            errorMessage = 'Invalid email or password. Please try again.';
        }
        // Add more specific parsing here if result.error contains more structured info
        // e.g., if (result.error.includes('UserNotFound')) ...

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
        router.push('/'); // Redirect to the home page or dashboard upon successful login
      }
    } catch (error) {
      console.error('Unexpected login error (network or unhandled exception):', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred during login. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false); // Ensure loading state is reset regardless of success or failure
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
                  autoComplete="current-password"
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
                type="submit"
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

