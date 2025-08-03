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
      <Box as="footer" py={4} textAlign="center" bg="white" borderTopWidth={1} borderColor="gray.200">
        <Flex justifyContent="center" gap={4}>
          <NextLink href="/privacy" passHref>
            <ChakraLink fontSize="sm" color="gray.600">Privacy Policy</ChakraLink>
          </NextLink>
          <NextLink href="/terms" passHref>
            <ChakraLink fontSize="sm" color="gray.600">Terms of Service</ChakraLink>
          </NextLink>
        </Flex>
      </Box>
    </Flex>
  );
}
