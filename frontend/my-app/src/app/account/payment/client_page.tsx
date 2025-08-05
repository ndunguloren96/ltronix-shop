
'use client';

import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PaymentSettingsClientPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading payment settings...</Text>
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
          Payment Settings
        </Heading>
        <VStack spacing={4} align="flex-start">
          <Text fontSize="md">
            Manage your payment methods and billing information here.
          </Text>
          <Text fontSize="sm" color="gray.500">
            *This is a stub. You would integrate with a payment gateway (e.g., Stripe, M-PESA) to manage payment methods securely.*
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
