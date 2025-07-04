// src/app/account/password-change/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Flex, useToast, Spinner } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect } from 'react';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api';

export default function PasswordChangePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (newPassword1 !== newPassword2) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    // FIX APPLIED HERE: Access accessToken and djangoUser via session.user
    if (status !== 'authenticated' || (!session?.user?.accessToken && !session?.user?.djangoUser)) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to change your password.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${DJANGO_API_BASE_URL}/auth/password/change/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // FIX APPLIED HERE: Use the Django access token from the NextAuth session
          'Authorization': `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password1: newPassword1,
          new_password2: newPassword2,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Clear form fields
        setOldPassword('');
        setNewPassword1('');
        setNewPassword2('');
        router.push('/account'); // Redirect back to account page
      } else {
        const errorData = await res.json();
        console.error('Django password change failed:', errorData);
        let errorMessage = 'Failed to change password. Please check your current password and try again.';

        // Attempt to parse common Django REST framework errors
        if (errorData.old_password && Array.isArray(errorData.old_password)) {
          errorMessage = `Current Password: ${errorData.old_password[0]}`;
        } else if (errorData.new_password1 && Array.isArray(errorData.new_password1)) {
          errorMessage = `New Password: ${errorData.new_password1[0]}`;
        } else if (errorData.new_password2 && Array.isArray(errorData.new_password2)) {
          errorMessage = `Confirm New Password: ${errorData.new_password2[0]}`;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object' && errorData !== null) {
          // General parsing for other field errors if any
          errorMessage = Object.values(errorData).flat().join(', ');
        }

        toast({
          title: 'Password Change Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected error during password change:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  // If status is 'unauthenticated', useEffect redirects, so this won't be reached
  // if (status === 'unauthenticated') {
  //    return null;
  // }

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.50" p={4}>
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" width="full">
        <VStack spacing={6} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" mb={4}>
            Change Your Password
          </Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="old-password" isRequired>
                <FormLabel>Current Password</FormLabel>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
              </FormControl>

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
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
              >
                Change Password
              </MyButton>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" mt={4}>
            <Link href="/account" passHref>
              <Text as="a" color="brand.500" fontWeight="bold">
                Back to Account
              </Text>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
