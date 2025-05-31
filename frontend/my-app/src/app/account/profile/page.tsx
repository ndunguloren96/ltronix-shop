'use client';

import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfileDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading profile details...</Text>
      </Container>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <Container maxW="lg" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Your Profile Details
        </Heading>
        <VStack spacing={4} align="flex-start">
          <Text fontSize="md">
            Name: <Text as="span" fontWeight="semibold">{session?.user?.name || 'Not set'}</Text>
          </Text>
          <Text fontSize="md">
            Email: <Text as="span" fontWeight="semibold">{session?.user?.email}</Text>
          </Text>
          {session?.user?.id && (
            <Text fontSize="md">
              User ID: <Text as="span" fontWeight="semibold">{session.user.id}</Text>
            </Text>
          )}
          {/* Add more profile fields here (e.g., address, phone, etc.) */}
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