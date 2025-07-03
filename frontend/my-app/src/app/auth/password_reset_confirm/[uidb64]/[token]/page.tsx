// src/app/auth/password-reset-confirm/[uidb64]/[token]/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Flex, useToast } from '@chakra-ui/react';
import { MyButton } from '@/components/MyButton';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api'; // Default to local Django API if not set

export default function PasswordResetConfirmPage() {
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const params = useParams(); // Get URL parameters

  const uidb64 = params?.uidb64 as string;
  const token = params?.token as string;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (newPassword1 !== newPassword2) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    if (!uidb64 || !token) {
      toast({
        title: 'Invalid Link',
        description: 'The password reset link is incomplete. Please ensure you clicked the full link.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Make a direct POST request to your Django backend's password reset confirm endpoint
      const res = await fetch(`${DJANGO_API_BASE_URL}/auth/password/reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uidb64,
          token: token,
          new_password1: newPassword1,
          new_password2: newPassword2,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been successfully reset. You can now log in with your new password.',
          status: 'success',
          duration: 7000,
          isClosable: true,
        });
        router.push('/auth/login'); // Redirect to login page
      } else {
        const errorData = await res.json();
        console.error('Django password reset confirmation failed:', errorData);
        let errorMessage = 'Failed to reset password. Please check the link or try again.';

        // Attempt to parse common Django REST framework errors
        if (errorData.new_password1 && Array.isArray(errorData.new_password1)) {
          errorMessage = `New Password: ${errorData.new_password1[0]}`;
        } else if (errorData.new_password2 && Array.isArray(errorData.new_password2)) {
            errorMessage = `Confirm Password: ${errorData.new_password2[0]}`;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object' && errorData !== null) {
          // General parsing for other field errors if any
          errorMessage = Object.values(errorData).flat().join(', ');
        }

        toast({
          title: 'Password Reset Failed',
          description: errorMessage,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected error during password reset confirmation:', error);
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
            Reset Your Password
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600" mb={4}>
            Enter your new password below.
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="new-password-1" isRequired>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Password must be at least 8 characters.
                </Text>
              </FormControl>

              <FormControl id="new-password-2" isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </FormControl>

              <MyButton
                type="submit"
                width="full"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Set New Password
              </MyButton>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" mt={4}>
            <Link href="/auth/login" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">
                Back to Sign In
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}