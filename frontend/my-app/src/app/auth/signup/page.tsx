// src/app/auth/signup/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast }
  from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

// ‹FIX› include /api/v1 in the base URL
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match.', status: 'error', duration: 5000, isClosable: true });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${DJANGO_API_BASE_URL}/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // if you rely on cookies later
        body: JSON.stringify({ email, password, password2: confirmPassword }), // ‹FIX› include password2
      });

      const data = await res.json();
      if (!res.ok) {
        // Pull out DRF errors if any
        const msg = data.email?.[0] || data.password?.[0] || data.non_field_errors?.[0] || 'Signup failed';
        throw new Error(msg);
      }

      toast({ title: 'Signup successful!', status: 'success', duration: 3000, isClosable: true });
      // Auto-login
      const signInResult = await signIn('credentials', { redirect: false, email, password });
      if (signInResult?.ok) {
        router.push('/');
      } else {
        router.push('/auth/login');
      }

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
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
      <Box p={8} maxW="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} align="stretch">
          <Heading textAlign="center">Join Us!</Heading>
          <Text textAlign="center" color="gray.600">
            Create an account to start shopping.
          </Text>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <FormHelperText>At least 8 characters.</FormHelperText>
              </FormControl>
              <FormControl isRequired>
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
            <Link href="/auth/login">
              <Text as="a" color="brand.500" fontWeight="bold">Sign In</Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
