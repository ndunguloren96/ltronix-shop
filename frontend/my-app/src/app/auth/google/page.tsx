'use client';
import { Button, Container, Heading, VStack } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

export default function GoogleLoginPage() {
  return (
    <Container maxW="md" py={10}>
      <VStack spacing={6}>
        <Heading>Sign in with Google</Heading>
        <Button colorScheme="red" onClick={() => signIn('google')}>
          Sign in with Google
        </Button>
      </VStack>
    </Container>
  );
}
