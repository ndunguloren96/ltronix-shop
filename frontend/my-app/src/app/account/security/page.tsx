'use client';

import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SecuritySettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading security settings...</Text>
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
          Security Settings
        </Heading>
        <VStack spacing={4} align="flex-start">
          <Text fontSize="md">
            Change your password, enable two-factor authentication, and review recent activity.
          </Text>
          <Text fontSize="sm" color="gray.500">
            *This is a stub. Implement password change forms, 2FA setup, and session management features here.*
          </Text>
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