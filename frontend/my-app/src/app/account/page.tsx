'use client';

import { Box, Container, Heading, Text, VStack, Button, useToast } from '@chakra-ui/react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AccountDashboardPage() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading account details...</Text>
      </Container>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <Container maxW="2xl" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          Your Account Dashboard
        </Heading>
        <VStack spacing={4} align="flex-start">
          <Text fontSize="lg">
            Welcome, <Text as="span" fontWeight="bold">{session?.user?.name || session?.user?.email}!</Text>
          </Text>
          <Text fontSize="md">
            Email: <Text as="span" fontWeight="semibold">{session?.user?.email}</Text>
          </Text>
          {session?.user?.id && (
            <Text fontSize="md">
              User ID: <Text as="span" fontWeight="semibold">{session.user.id}</Text>
            </Text>
          )}

          <Heading as="h2" size="md" mt={8} mb={4}>
            Account Sections
          </Heading>
          {/* Updated buttons to link to new pages */}
          <Button
            width="full"
            colorScheme="brand" // Changed to brand color
            variant="outline"
            size="lg"
            onClick={() => router.push('/account/profile')}
          >
            Profile Details
          </Button>
          <Button
            width="full"
            colorScheme="brand" // Changed to brand color
            variant="outline"
            size="lg"
            onClick={() => router.push('/account/payment')}
          >
            Payment Settings
          </Button>
          <Button
            width="full"
            colorScheme="brand" // Changed to brand color
            variant="outline"
            size="lg"
            onClick={() => router.push('/account/security')}
          >
            Security Settings
          </Button>
          {/* Keep Recent Orders for future implementation */}
          <Button width="full" colorScheme="gray" variant="outline" size="lg">
            Recent Orders (Stub)
          </Button>

          <Button
            mt={8}
            colorScheme="red"
            size="lg"
            width="full"
            onClick={async () => {
              await signOut({ callbackUrl: '/auth/login' });
              toast({
                title: 'Logged Out',
                description: 'You have been successfully logged out.',
                status: 'info',
                duration: 3000,
                isClosable: true,
              });
            }}
          >
            Logout
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}