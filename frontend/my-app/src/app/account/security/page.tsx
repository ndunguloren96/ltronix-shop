
import { Suspense } from 'react';
import SecuritySettingsClientPage from './client_page';
import { Container, Text } from '@chakra-ui/react';

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={
      <Container maxW="md" py={10} textAlign="center">
        <Text fontSize="xl">Loading security settings...</Text>
      </Container>
    }>
      <SecuritySettingsClientPage />
    </Suspense>
  );
}
