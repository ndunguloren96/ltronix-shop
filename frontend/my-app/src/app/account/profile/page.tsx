// src/app/account/profile/page.tsx
'use client';

import { Box, Button, Container, Heading, Text, VStack, Flex, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DjangoUser } from '../../../types/next-auth';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

export default function ProfileDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userDetails, setUserDetails] = useState<DjangoUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Effect to handle redirection for unauthenticated users and fetch data
  useEffect(() => {
    // If not authenticated, redirect to the sign-up/login page.
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // If session is loading, do nothing yet.
    if (status === 'loading') {
      return;
    }
    
    // Fetch user details from Django when an authenticated session is available.
    const fetchUserDetails = async () => {
      // Check for a valid session and access token before making the API call.
      if (session?.user?.accessToken) {
        try {
          const res = await fetch(`${DJANGO_API_BASE_URL}/auth/user/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
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
        // This case indicates an issue with NextAuth callbacks.
        console.warn('Session authenticated but no Django access token found. Could not fetch user details.');
        setError('Could not retrieve full profile data. Session might be incomplete.');
        setIsLoadingUser(false);
      }
    };

    fetchUserDetails();
  }, [session, status, router]);

  // Render a loading spinner while fetching data.
  if (status === 'loading' || isLoadingUser) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  // Render an error message if the data fetch fails.
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
  
  // Render the profile details page.
  return (
    <Container maxW="lg" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Your Profile Details
        </Heading>
        <VStack spacing={4} align="flex-start">
          <Text fontSize="md">
            Email: <Text as="span" fontWeight="semibold">{userDetails?.email || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            First Name: <Text as="span" fontWeight="semibold">{userDetails?.first_name || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            Middle Name: <Text as="span" fontWeight="semibold">{userDetails?.profile?.middle_name || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            Last Name: <Text as="span" fontWeight="semibold">{userDetails?.last_name || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            Phone Number: <Text as="span" fontWeight="semibold">{userDetails?.phone_number || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            Gender: <Text as="span" fontWeight="semibold">{userDetails?.gender || 'N/A'}</Text>
          </Text>
          <Text fontSize="md">
            Date of Birth: <Text as="span" fontWeight="semibold">{userDetails?.date_of_birth || 'N/A'}</Text>
          </Text>
          {userDetails?.is_staff && (
            <Text fontSize="md" color="purple.600" fontWeight="bold">Account Type: Staff/Admin</Text>
          )}
          <Button
            mt={6}
            colorScheme="brand"
            size="md"
            onClick={() => router.push('/account')}
          >
            Back to Dashboard
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}

