// frontend/my-app/src/app/auth/layout.tsx
import { Box, Flex, Text, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      <Flex flex="1" align="center" justify="center">
        {children}
      </Flex>
      
    </Flex>
  );
}
