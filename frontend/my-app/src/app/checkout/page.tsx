'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
  Input,
  InputGroup,
  InputLeftAddon,
  Spinner,
  Center,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  Link as ChakraLink,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Flex, // <-- ADDED: Fix for "Flex is not defined" error
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // For Next.js Link
import {
  fetchCartAPI,
  initiateStkPushAPI,
  fetchTransactionStatusAPI,
  BackendOrder,
  BackendTransaction,
} from '@/api/orders'; // We'll add new functions to orders.ts
import { useCartStore } from '@/store/useCartStore';

const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds
const POLLING_TIMEOUT_MS = 120 * 1000; // Stop polling after 120 seconds (2 minutes)

export default function CheckoutPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useSession();

  const { isOpen, onOpen, onClose } = useDisclosure(); // For the payment modal

  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);
  const clearLocalCart = useCartStore((state) => state.clearCart); // New action to clear local cart state

  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Fetch the current cart data
  const {
    data: cart,
    isLoading: isLoadingCart,
    isError: isErrorCart,
    error: cartError,
  } = useQuery<BackendOrder, Error>({
    queryKey: ['cart', authStatus, guestSessionKey],
    queryFn: () => {
      if (authStatus === 'authenticated') {
        return fetchCartAPI();
      }
      if (authStatus === 'unauthenticated' && guestSessionKey) {
        return fetchCartAPI(guestSessionKey);
      }
      return Promise.reject(new Error("No active cart for authenticated user or guest session."));
    },
    enabled: authStatus !== 'loading' && (authStatus === 'authenticated' || (authStatus === 'unauthenticated' && !!guestSessionKey)),
    staleTime: 0,
    refetchOnWindowFocus: false, // Don't refetch on window focus to manage polling manually
  });

  // Mutation for initiating STK Push
  const initiateStkPushMutation = useMutation<BackendTransaction, Error, { orderId: number; phoneNumber: string }>({
    mutationFn: initiateStkPushAPI,
    onSuccess: (data) => {
      setCurrentTransactionId(data.id);
      onOpen(); // Open the payment modal
      toast({
        title: 'STK Push Initiated',
        description: 'Please enter your M-Pesa PIN on your phone to complete the payment.',
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-right',
      });
      // Start polling for transaction status
      setPollingAttempts(0); // Reset polling attempts
    },
    onError: (error) => {
      console.error("STK Push Initiation Error:", error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate M-Pesa STK Push. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Query for polling transaction status
  const { data: transactionStatus, isLoading: isLoadingTransactionStatus } = useQuery<BackendTransaction, Error>({
    queryKey: ['transactionStatus', currentTransactionId],
    queryFn: () => {
      if (currentTransactionId) {
        return fetchTransactionStatusAPI(currentTransactionId);
      }
      return Promise.reject(new Error("No transaction ID for status check."));
    },
    enabled: !!currentTransactionId && isOpen, // Only poll if there's a transaction ID and modal is open
    refetchInterval: POLLING_INTERVAL_MS,
    retry: (_failureCount, _error) => { // _failureCount and _error are unused // _failureCount and _error are unused
      // Stop retrying if polling attempts exceed limit or if transaction is already completed/failed/cancelled/timeout
      if (pollingAttempts * POLLING_INTERVAL_MS >= POLLING_TIMEOUT_MS) {
        console.warn("Polling timed out for transaction:", currentTransactionId);
        toast({
          title: 'Payment Timeout',
          description: 'Payment did not complete within the expected time. Please check your M-Pesa messages or try again.',
          status: 'warning',
          duration: 7000,
          isClosable: true,
          position: 'top-right',
        });
        queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart to re-fetch
        setCurrentTransactionId(null); // Stop polling
        onClose(); // Close modal
        return false;
      }
      
      if (transactionStatus && ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(transactionStatus.status)) {
        console.log("Polling stopped, transaction status is final:", transactionStatus.status);
        setCurrentTransactionId(null); // Stop polling
        onClose(); // Close modal
        return false;
      }
      setPollingAttempts(prev => prev + 1);
      return true; // Continue polling
    },
    onSuccess: (data) => {
      if (['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(data.status)) {
        toast({
          title: `Payment ${data.status.replace('_', ' ')}`,
          description: data.result_desc || `Transaction ${data.status.toLowerCase()}.`,
          status: data.status === 'COMPLETED' ? 'success' : 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        if (data.status === 'COMPLETED') {
          clearLocalCart(); // Clear local cart state
          queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart query
          queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate orders history
          router.push('/account/orders'); // Redirect to order history
        } else {
          queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart to re-fetch potentially
        }
        setCurrentTransactionId(null); // Stop polling
        onClose(); // Close modal
      }
    },
    onError: (error) => {
      console.error("Polling Transaction Status Error:", error);
      // Don't show a toast for every polling error, only for the main initiation or final outcome
    }
  });


  const handleInitiatePayment = async () => {
    if (!mpesaPhoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your M-Pesa phone number.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!cart || !cart.id) {
      toast({
        title: 'Cart Error',
        description: 'Your cart is empty or could not be loaded.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Ensure phone number is in the 254 format before sending to backend
    let formattedPhoneNumber = mpesaPhoneNumber;
    if (formattedPhoneNumber.startsWith('0')) {
      formattedPhoneNumber = '254' + formattedPhoneNumber.substring(1);
    } else if (!formattedPhoneNumber.startsWith('254')) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid M-Pesa number starting with 07/01 or 2547/2541.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    initiateStkPushMutation.mutate({
      orderId: cart.id,
      phoneNumber: formattedPhoneNumber,
    });
  };

  const handleModalClose = () => {
    // Only close if not currently processing or if final status is reached
    if (!isLoadingTransactionStatus && (!transactionStatus || ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(transactionStatus.status))) {
      onClose();
      setCurrentTransactionId(null); // Ensure polling stops
    } else {
        toast({
            title: 'Payment in Progress',
            description: 'Please wait for the payment to complete or check your phone.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    }
  };

  if (authStatus === 'loading' || isLoadingCart) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">
            {authStatus === 'loading' ? 'Authenticating...' : 'Loading your cart for checkout...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  if (isErrorCart) {
    return (
      <Center minH="80vh">
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" borderRadius="lg" boxShadow="md" m={8}>
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load cart for checkout</Heading>
          <AlertDescription maxWidth="sm">
            {cartError?.message || 'An unexpected error occurred while fetching your cart.'}
            <br />
            Please ensure your Django backend is running and reachable, and that your cart is valid.
            <br />
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cart'] })} mt={4} colorScheme="brand">
              Try Again
            </Button>
            <Link href="/cart" passHref>
                <ChakraLink mt={2} color="brand.500">Go back to Cart</ChakraLink>
            </Link>
          </AlertDescription>
        </Alert>
      </Center>
    );
  }

  if (!cart || cart.get_cart_items === 0) {
    return (
      <VStack spacing={4} textAlign="center" py={10} minH="80vh" justifyContent="center">
        <Text fontSize="xl" color="gray.600">
          Your cart is empty. Please add items before checking out.
        </Text>
        <Button colorScheme="brand" onClick={() => router.push('/products')}>
          Start Shopping
        </Button>
      </VStack>
    );
  }

  return (
    <Box p={8} maxWidth="container.md" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Checkout
      </Heading>

      <VStack spacing={6} align="stretch" p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
        <Heading as="h2" size="md" mb={4}>
          Order Summary
        </Heading>
        <Divider />

        {cart.items.map((item) => (
          <HStack key={item.product.id} justifyContent="space-between">
            <Text>
              {item.product.name} (x{item.quantity})
            </Text>
            <Text fontWeight="semibold">Ksh {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</Text>
          </HStack>
        ))}

        <Divider />

        <Flex justifyContent="space-between">
          <Text fontSize="lg" fontWeight="bold">
            Total Items:
          </Text>
          <Text fontSize="lg" fontWeight="bold">{cart.get_cart_items}</Text>
        </Flex>
        <Flex justifyContent="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="brand.800">
            Amount Due:
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="brand.600">
            Ksh {parseFloat(cart.get_cart_total).toFixed(2)}
          </Text>
        </Flex>

        <Divider />

        <Heading as="h2" size="md" mt={4} mb={2}>
          Payment Method
        </Heading>
        <Text fontSize="md" color="gray.600">
          We currently only support M-Pesa.
        </Text>

        <InputGroup size="lg">
          <InputLeftAddon children="+254" />
          <Input
            type="tel"
            placeholder="7XXXXXXXXX or 1XXXXXXXXX"
            value={mpesaPhoneNumber}
            onChange={(e) => setMpesaPhoneNumber(e.target.value)}
            pattern="^(7|1)[0-9]{8}$" // Basic pattern for 7 or 1 followed by 8 digits
            maxLength={10} // Max 10 digits after 0 (e.g., 07xxxxxxxx)
            required
            isDisabled={initiateStkPushMutation.isPending}
          />
        </InputGroup>

        <Button
          colorScheme="brand"
          size="lg"
          width="full"
          onClick={handleInitiatePayment}
          isLoading={initiateStkPushMutation.isPending}
          isDisabled={initiateStkPushMutation.isPending || !mpesaPhoneNumber || parseFloat(cart.get_cart_total) <= 0}
          mt={4}
        >
          {initiateStkPushMutation.isPending ? 'Initiating STK Push...' : 'Pay with M-Pesa'}
        </Button>
      </VStack>

      {/* Payment Status Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>M-Pesa Payment Status</ModalHeader>
          <ModalBody>
            {isLoadingTransactionStatus ? (
              <Center py={4}>
                <VStack>
                  <Spinner size="lg" />
                  <Text>Waiting for M-Pesa payment confirmation...</Text>
                  <Text fontSize="sm" color="gray.500">
                    Please check your phone for the STK Push prompt.
                  </Text>
                </VStack>
              </Center>
            ) : transactionStatus ? (
              <VStack spacing={3}>
                <Text fontSize="xl" fontWeight="bold" color={transactionStatus.status === 'COMPLETED' ? 'green.500' : 'red.500'}>
                  Status: {transactionStatus.status}
                </Text>
                {transactionStatus.mpesa_receipt_number && (
                  <Text>Receipt: {transactionStatus.mpesa_receipt_number}</Text>
                )}
                {transactionStatus.result_desc && (
                  <Text textAlign="center" color="gray.700">
                    {transactionStatus.result_desc}
                  </Text>
                )}
                <Text fontSize="sm" color="gray.500">
                  You can close this window now.
                </Text>
              </VStack>
            ) : (
                <Text>No transaction status available. Please try initiating payment again.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleModalClose} colorScheme="brand" isDisabled={isLoadingTransactionStatus}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
