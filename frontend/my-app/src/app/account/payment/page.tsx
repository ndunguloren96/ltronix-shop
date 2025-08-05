
import { Suspense } from 'react';
import PaymentSettingsClientPage from './client_page';
import { Container, Text } from '@chakra-ui/react';

export default function PaymentSettingsPage() {
  return (
    <Suspense fallback={
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading payment settings...</Text>
      </Container>
    }>
      <PaymentSettingsClientPage />
    </Suspense>
  );
}
