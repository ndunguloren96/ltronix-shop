//src/app/checkout/page.tsx
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
  Flex,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
// REMOVED: import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // For Next.js Link
import {
  fetchCartAPI,
  initiateStkPushAPI,
  fetchTransactionStatusAPI,
  BackendOrder,
  BackendTransaction,
} from '@/api/orders'; // Ensure these types and functions are correctly defined in your api/orders.ts
import { useCartStore } from '@/store/useCartStore';

const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds
const POLLING_TIMEOUT_MS = 120 * 1000; // Stop polling after 120 seconds (2 minutes)

export default function CheckoutPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  // REMOVED: const { data: session, status: authStatus } = useSession(); // Removed next-auth session

  const { isOpen, onOpen, onClose } = useDisclosure(); // For the payment modal

  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);
  const clearLocalCart = useCartStore((state) => state.clearCart); // New action to clear local cart state

  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Effect to reset polling attempts when a new transaction is initiated
  useEffect(() => {
    if (currentTransactionId !== null) {
      setPollingAttempts(0);
    }
  }, [currentTransactionId]);

  // Fetch the current cart data
  const {
    data: cart,
    isLoading: isLoadingCart,
    isError: isErrorCart,
    error: cartError,
  } = useQuery<BackendOrder | null, Error>({ // Correctly specify that cart data can be null
    queryKey: ['cart', guestSessionKey], // `authStatus` removed from queryKey
    queryFn: async () => {
      // Since next-auth is removed, we only operate with guestSessionKey
      if (guestSessionKey) {
        return fetchCartAPI(guestSessionKey);
      }
      // If no guestSessionKey, return null to indicate no active cart
      return null;
    },
    // `enabled` ensures the query only runs when guestSessionKey is available
    enabled: !!guestSessionKey, // Condition simplified as no `authStatus`
    staleTime: 0, // Always refetch cart data when this query becomes active
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
  const transactionStatusQueryOptions = {
    queryKey: ['transactionStatus', currentTransactionId],
    queryFn: async () => {
      if (currentTransactionId) {
        // fetchTransactionStatusAPI should return BackendTransaction or null/undefined
        // if the transaction is not yet found or in a pending state.
        return fetchTransactionStatusAPI(currentTransactionId);
      }
      return null; // Return null if no transaction ID is set
    },
    // Query is only enabled if a transaction ID exists and the modal is open
    enabled: !!currentTransactionId && isOpen,
    refetchInterval: POLLING_INTERVAL_MS, // Keep polling every X milliseconds
    retry: (_failureCount: number, error: Error) => {
      // The retry function is for re-attempting failed API calls.
      // It should NOT check `transactionStatus.status` here, as `data` (transactionStatus)
      // might not be updated or available in this context.

      // If the error indicates a non-retriable condition (e.g., a 404 from backend meaning transaction not found)
      // you could add specific error type checks here. For now, we retry generic errors.

      // Check for overall polling timeout
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
        queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart to re-fetch its status
        setCurrentTransactionId(null); // Stop polling by disabling query
        onClose(); // Close modal
        return false; // Do not retry further
      }
      
      setPollingAttempts(prev => prev + 1);
      return true; // Continue retrying on error (e.g., network issues)
    },
    onSuccess: (data: BackendTransaction | null) => {
      // This `data` is the successfully fetched `BackendTransaction | null`.
      // We can now safely check its status if it's not null.
      if (data && ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(data.status)) {
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
          queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart to ensure it's empty on next fetch
          queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate orders history to show new order
          router.push('/account/orders'); // Redirect to order history
        } else {
          queryClient.invalidateQueries({ queryKey: ['cart'] }); // Invalidate cart to re-fetch if payment failed
        }
        setCurrentTransactionId(null); // Stop polling by setting transaction ID to null
        onClose(); // Close modal
      }
      // If data is null or its status is not one of the final states, polling continues due to refetchInterval.
    },
    onError: (error: Error) => {
      console.error("Polling Transaction Status Error:", error);
      // This onError will fire if `fetchTransactionStatusAPI` consistently fails (after retries)
      // or if an unretriable error occurs.
      // A specific toast for a final polling error could go here if desired, but general errors are handled by retry.
    }
  };

  const { data: transactionStatus, isLoading: isLoadingTransactionStatus } = useQuery(transactionStatusQueryOptions);


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

    // Ensure cart is valid before proceeding
    if (!cart || !cart.id || parseFloat(cart.get_cart_total) <= 0) {
      toast({
        title: 'Cart Error',
        description: 'Your cart is empty or could not be loaded for payment.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Robust Kenyan M-Pesa phone number validation
    const cleanedPhoneNumber = mpesaPhoneNumber.replace(/\s/g, ''); // Use 'const' as it's not reassigned
    let formattedPhoneNumber = cleanedPhoneNumber;

    // Convert 07/01 to 2547/2541
    if (cleanedPhoneNumber.startsWith('0') && cleanedPhoneNumber.length === 10) {
        formattedPhoneNumber = '254' + cleanedPhoneNumber.substring(1);
    }
    
    // Basic regex for 2547XXXXXXXX or 2541XXXXXXXX
    const kenyanPhoneRegex = /^254(7|1)\d{8}$/;

    if (!kenyanPhoneRegex.test(formattedPhoneNumber)) {
        toast({
            title: 'Invalid Phone Number',
            description: 'Please enter a valid Kenyan M-Pesa number (e.g., 07xxxxxxxx or 2547xxxxxxxx).',
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
    // Only allow closing the modal if polling is not active
    // OR if a final transaction status has been reached.
    // The `transactionStatus?.status || ''` provides a default empty string
    // so `includes` works safely even if transactionStatus is null/undefined.
    if (!isLoadingTransactionStatus && (!transactionStatus || ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(transactionStatus.status || ''))) {
      onClose();
      setCurrentTransactionId(null); // Ensure polling stops when modal is manually closed after completion/failure
    } else {
        toast({
            title: 'Payment in Progress',
            description: 'Please wait for the payment to complete or check your phone. The modal will close automatically.',
            status: 'info',
            duration: 4000,
            isClosable: true,
        });
    }
  };

  // Simplified loading condition, as no `authStatus` from next-auth
  if (isLoadingCart) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">Loading your cart for checkout...</Text>
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
            maxLength={10} // Max 10 digits for the suffix (e.g., 7xxxxxxxx)
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
