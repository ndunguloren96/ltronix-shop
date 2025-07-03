// src/app/account/profile-update/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Flex, useToast, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Select, Button } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Define your Django backend URL from environment variables
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api';

interface UserProfile {
  pk: number;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
}

export default function ProfileUpdatePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For initial data fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'loading') {
      return; // Still loading session, wait
    }

    const fetchUserProfile = async () => {
      if (!session?.accessToken) {
        // Fallback: If session.accessToken is not available but session is authenticated,
        // it means we might be using session-based auth without explicit token or JWT callback didn't store it.
        // In this case, we might not be able to make authenticated API calls if Django relies on Bearer token.
        // For dj-rest-auth with SessionAuthentication, cookies handle authentication.
        // If your setup uses HTTP-only cookies, `session.accessToken` won't exist anyway.
        // For this scenario, if `djangoUser` is stored in session, we can use that.
        if (session?.djangoUser) {
          const user = session.djangoUser as UserProfile;
          setEmail(user.email || '');
          setFirstName(user.first_name || '');
          setMiddleName(user.middle_name || '');
          setLastName(user.last_name || '');
          setPhoneNumber(user.phone_number || '');
          setGender(user.gender || '');
          setDateOfBirth(user.date_of_birth || '');
          setIsLoading(false);
          return;
        }

        setFetchError('Authentication token not available. Cannot fetch profile.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${DJANGO_API_BASE_URL}/auth/user/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (res.ok) {
          const data: UserProfile = await res.json();
          setEmail(data.email || '');
          setFirstName(data.first_name || '');
          setMiddleName(data.middle_name || '');
          setLastName(data.last_name || '');
          setPhoneNumber(data.phone_number || '');
          setGender(data.gender || '');
          setDateOfBirth(data.date_of_birth || '');
        } else {
          const errorData = await res.json();
          setFetchError(errorData.detail || 'Failed to load user profile. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setFetchError('An unexpected error occurred while loading your profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, status, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (status !== 'authenticated' || !session?.accessToken && !session?.djangoUser) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to update your profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData = {
        email,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone_number: phoneNumber,
        gender: gender,
        date_of_birth: dateOfBirth || null, // Send null if empty string
      };

      const res = await fetch(`${DJANGO_API_BASE_URL}/auth/user/`, {
        method: 'PUT', // Use PUT or PATCH based on your Django API
        headers: {
          'Content-Type': 'application/json',
          // Use the Django access token from the NextAuth session
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Update the NextAuth session with the new user data
        // This is important to keep the frontend session in sync with the backend
        await updateSession({ djangoUser: updatedUser, user: { ...session.user, email: updatedUser.email, name: updatedUser.first_name } });

        router.push('/account'); // Go back to the account page
      } else {
        const errorData = await res.json();
        console.error('Django profile update failed:', errorData);
        let errorMessage = 'Failed to update profile. Please check the details.';

        // Attempt to parse common Django REST framework errors
        if (typeof errorData === 'object' && errorData !== null) {
          errorMessage = Object.values(errorData).flat().join(', ');
        }

        toast({
          title: 'Update Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected error during profile update:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during profile update. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (fetchError) {
    return (
      <Flex justify="center" align="center" minH="100vh" p={4}>
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error Loading Profile!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {fetchError}
          </AlertDescription>
          <Button onClick={() => router.push('/account')} mt={4} colorScheme="brand">Go Back to Account</Button>
        </Alert>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.50" p={4}>
      <Box p={8} maxWidth="600px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" width="full">
        <VStack spacing={6} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" mb={4}>
            Update Your Profile
          </Heading>

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

              <FormControl id="first-name">
                <FormLabel>First Name</FormLabel>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                />
              </FormControl>

              <FormControl id="middle-name">
                <FormLabel>Middle Name</FormLabel>
                <Input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Enter your middle name"
                  autoComplete="additional-name"
                />
              </FormControl>

              <FormControl id="last-name">
                <FormLabel>Last Name</FormLabel>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
              </FormControl>

              <FormControl id="phone-number">
                <FormLabel>Phone Number</FormLabel>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +254712345678"
                  autoComplete="tel"
                />
              </FormControl>

              <FormControl id="gender">
                <FormLabel>Gender</FormLabel>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Select gender"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </Select>
              </FormControl>

              <FormControl id="date-of-birth">
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </FormControl>

              <MyButton
                type="submit"
                width="full"
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
              >
                Save Changes
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