'use client';

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
  Divider,
  Link as ChakraLink,
  Stack,
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import React from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // NextAuth credentials provider will call our custom authorize (see [...nextauth]/route.ts)
    const result = await signIn('credentials', {
      redirect: false,
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
        position: 'top-right',
      });
    } else if (result?.ok) {
      toast({
        title: 'Login Successful',
        description: 'You have been logged in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      router.push(result?.url || '/account');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const result = await signIn('google', { callbackUrl: '/account', redirect: false });
    setIsSubmitting(false);

    if (result?.error) {
      toast({
        title: 'Google Login Failed',
        description: result.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } else if (result?.ok) {
      toast({
        title: 'Google Login Successful',
        description: 'You have been logged in via Google.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      router.push(result?.url || '/account');
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Login to Your Account
        </Heading>
        <form onSubmit={handleCredentialsSignIn}>
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
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </VStack>
        </form>
        <Divider my={6} />
        <Text fontSize="md" textAlign="center" mb={4} color="gray.600">
          Or continue with
        </Text>
        <Button
          onClick={handleGoogleSignIn}
          leftIcon={<GoogleIcon />}
          colorScheme="red"
          variant="outline"
          size="lg"
          width="full"
          isLoading={isSubmitting}
          _hover={{ bg: 'red.50' }}
        >
          Sign In with Google
        </Button>
        <Text fontSize="sm" mt={6} textAlign="center">
          Don't have an account?{' '}
          <NextLink href="/auth/signup" passHref legacyBehavior>
            <ChakraLink color="brand.500" fontWeight="bold">
              Sign Up
            </ChakraLink>
          </NextLink>
        </Text>
      </Box>
    </Container>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
      <path d="M12.24 10.27c.36 0 .72-.03 1.07-.08.68-.08 1.1-.66 1.02-1.34s-.66-1.1-1.34-1.02c-.38.05-.75.08-1.12.08-2.61 0-4.73-2.12-4.73-4.73S9.63 2.12 12.24 2.12c2.16 0 3.96 1.44 4.54 3.4.15.48.64.76 1.13.62.48-.15.76-.64.62-1.13C17.84 2.89 15.24.47 12.24.47 7.55.47 3.65 4.37 3.65 9.06s3.9 8.59 8.59 8.59c4.73 0 7.85-3.3 8.16-8.23.01-.13.01-.26.01-.39 0-.01-.01-.01-.01-.01H12.24zm0 4.19c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" fill="currentColor" />
      <path d="M20.2 10.37c-.12-.4-.53-.66-.93-.53-.4.12-.66.53-.53.93.07.24.1.49.1.75 0 2.22-1.81 4.03-4.03 4.03-1.68 0-3.1-.98-3.79-2.39-.14-.29-.44-.45-.75-.4-.32.06-.57.34-.63.66-.08.4-.1.8-.1 1.22 0 3.25 2.65 5.9 5.9 5.9 3.25 0 5.9-2.65 5.9-5.9 0-.32-.01-.64-.04-.96z" fill="currentColor" />
    </svg>
  );
}