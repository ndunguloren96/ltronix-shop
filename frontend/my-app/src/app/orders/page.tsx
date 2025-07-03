// frontend/my-app/src/app/account/orders/page.tsx
'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  Flex,
  Link as ChakraLink, // For Chakra UI Link
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { fetchOrdersAPI, BackendOrder } from '@/api/orders';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch orders using TanStack Query
  const {
    data: orders,
    isLoading,
    isError,
    error,
    isFetching, // Useful to show background refetching
  } = useQuery<BackendOrder[], Error>({
    queryKey: ['orders'],
    queryFn: fetchOrdersAPI,
    enabled: status === 'authenticated', // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Consider order history fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch automatically on focus unless needed
  });

  // Render states for the order history page
  if (status === 'loading') {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">Authenticating and loading your order history...</Text>
        </VStack>
      </Center>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Center minH="80vh">
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.600">
            Please log in to view your order history.
          </Text>
          <Button colorScheme="brand" onClick={() => router.push('/auth/login')}>
            Login Now
          </Button>
        </VStack>
      </Center>
    );
  }

  if (isLoading || isFetching) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">Loading your orders...</Text>
        </VStack>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center minH="80vh">
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          boxShadow="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Failed to Load Orders
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error?.message || 'An unexpected error occurred while fetching your order history.'}
            <br />
            Please ensure your Django backend is running and reachable.
          </AlertDescription>
          <Button onClick={() => window.location.reload()} mt={4} colorScheme="brand">
            Try Again
          </Button>
        </Alert>
      </Center>
    );
  }

  // Display orders
  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Your Order History
      </Heading>

      {orders && orders.length === 0 ? (
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="md" color="gray.600">You haven&apos;t placed any orders yet.</Text>
          <Button colorScheme="brand" onClick={() => router.push('/products')}>
            Start Shopping
          </Button>
        </VStack>
      ) : (
        <Accordion allowToggle width="full">
          {orders?.map((order) => (
            <AccordionItem key={order.id} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm" bg="white">
              <h2>
                <AccordionButton py={4} _expanded={{ bg: 'brand.50', color: 'brand.800' }}>
                  <Box flex="1" textAlign="left">
                    <Flex direction={{ base: 'column', md: 'row' }} alignItems={{ base: 'flex-start', md: 'center' }} gap={2}>
                      <Text fontWeight="bold">Order #{order.id}</Text>
                      <Flex flex="1" />
                      <Tag size="md" colorScheme={order.complete ? 'green' : 'orange'}>
                        {order.complete ? 'Completed' : 'Pending'}
                      </Tag>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(order.date_ordered).toLocaleDateString()} at{' '}
                        {new Date(order.date_ordered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text fontWeight="semibold" ml={{ base: 0, md: 4 }}>
                        Total: Ksh {parseFloat(order.get_cart_total).toFixed(2)}
                      </Text>
                    </Flex>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text fontSize="md" mb={4}>
                  Transaction ID: <Text as="span" fontWeight="bold">{order.transaction_id || 'N/A'}</Text>
                </Text>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Price</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {order.items.map((item) => (
                        <Tr key={item.id}>
                          <Td>
                            <Link href={`/products/${item.product.id}`} passHref>
                              <ChakraLink color="blue.600" fontWeight="medium">
                                {item.product.name}
                              </ChakraLink>
                            </Link>
                          </Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>Ksh {parseFloat(item.product.price).toFixed(2)}</Td>
                          <Td isNumeric>Ksh {parseFloat(item.get_total).toFixed(2)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Box>
  );
}

