// src/app/account/page.tsx
'use client';

import { Box, Heading, Text, VStack, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Flex, Button } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyButton } from '../../components/MyButton'; // Assuming MyButton is available
import Link from 'next/link';
import { DjangoUser } from '../../types/next-auth';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<DjangoUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // If session is loading, do nothing yet
    if (status === 'loading') {
      return;
    }

    // Fetch user details from Django when authenticated session is available
    const fetchUserDetails = async () => {
      // Prioritize fetching from backend if accessToken is available
      if (session?.user?.accessToken) {
        try {
          const res = await fetch(`${DJANGO_API_BASE_URL}/auth/user/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Use the Django access token from the NextAuth session
              'Authorization': `Bearer ${session.user.accessToken}`,
            },
          });

          if (res.ok) {
            const data: DjangoUser = await res.json();
            setUserDetails(data);
          } else {
            const errorData = await res.json();
            console.error('Failed to fetch user details from Django:', errorData);
            setError(errorData.detail || 'Failed to load user profile. Please try again.');
          }
        } catch (err) {
          console.error('Network or unexpected error fetching user details:', err);
          setError('An unexpected error occurred while fetching your profile.');
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        // If no direct accessToken on session, check if djangoUser was populated via NextAuth callbacks
        if (session?.user?.djangoUser) {
          setUserDetails(session.user.djangoUser as DjangoUser);
          setIsLoadingUser(false);
        } else {
          // This case means session is authenticated but no Django token/user object was stored.
          // This might indicate an issue in the NextAuth `jwt` or `session` callbacks
          console.warn('Session authenticated but no Django access token or djangoUser object found. Could not fetch user details.');
          setError('Could not retrieve full profile data. Session might be incomplete.');
          setIsLoadingUser(false);
        }
      }
    };

    fetchUserDetails();
  }, [session, status, router]); // Re-run effect when session or status changes

  // Render a loading spinner while waiting for session and user data
  if (status === 'loading' || isLoadingUser) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  // Render an error alert if data fetching failed
  if (error) {
    return (
      <Flex justify="center" align="center" minH="100vh" p={4}>
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error Loading Profile!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button onClick={() => router.push('/')} mt={4} colorScheme="brand">Go Home</Button>
        </Alert>
      </Flex>
    );
  }

  // Main component rendering the account dashboard
  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.50" p={4}>
      <Box p={8} maxWidth="600px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" width="full">
        <VStack spacing={6} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" mb={4}>
            My Account
          </Heading>

          {session && (
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="lg" fontWeight="semibold">
                Welcome, {userDetails?.first_name || session.user?.name || session.user?.email}!
              </Text>
              <Box>
                <Text fontSize="md"><Text as="span" fontWeight="semibold">Email:</Text> {userDetails?.email || session.user?.email}</Text>
                {userDetails?.first_name && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">First Name:</Text> {userDetails.first_name}</Text>
                )}
                {userDetails?.profile?.middle_name && ( // Access middle name through the profile object
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Middle Name:</Text> {userDetails.profile.middle_name}</Text>
                )}
                {userDetails?.last_name && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Last Name:</Text> {userDetails.last_name}</Text>
                )}
                {userDetails?.phone_number && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Phone Number:</Text> {userDetails.phone_number}</Text>
                )}
                {userDetails?.gender && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Gender:</Text> {userDetails.gender}</Text>
                )}
                {userDetails?.date_of_birth && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Date of Birth:</Text> {userDetails.date_of_birth}</Text>
                )}
                {userDetails?.date_joined && (
                  <Text fontSize="md"><Text as="span" fontWeight="semibold">Member Since:</Text> {new Date(userDetails.date_joined).toLocaleDateString()}</Text>
                )}
                {userDetails?.is_staff && (
                  <Text fontSize="md" color="purple.600" fontWeight="bold">Account Type: Staff/Admin</Text>
                )}
              </Box>
            </VStack>
          )}

          <VStack spacing={3} mt={6}>
            <Link href="/account/profile" passHref>
              <MyButton as="a" width="full" colorScheme="blue">
                View Profile Details
              </MyButton>
            </Link>
            <Link href="/account/profile-update" passHref>
              <MyButton as="a" width="full" colorScheme="blue">
                Update Profile
              </MyButton>
            </Link>
            <Link href="/account/password-change" passHref>
              <MyButton as="a" width="full" colorScheme="teal">
                Change Password
              </MyButton>
            </Link>
          </VStack>
        </VStack>
      </Box>
    </Flex>
  );
}

