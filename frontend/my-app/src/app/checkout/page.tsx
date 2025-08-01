//src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  InputLeftElement,
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
  Image, // Import Image
  RadioGroup,
  Stack,
  Radio,
  Collapse,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  fetchUserCart,
  initiateStkPushAPI,
  fetchTransactionStatusAPI,
} from '@/api/cart';

import {
  BackendCart,
  BackendTransaction,
} from '@/types/order';

import { useCartStore } from '@/store/useCartStore';

// NO LONGER IMPORTING THEM AS MODULES.
// We will reference them directly as static assets from the public folder.

const POLLING_INTERVAL_MS = 3000;
const POLLING_TIMEOUT_MS = 120 * 1000;
const PAYMENT_CHOICE_KEY = 'preferredPaymentMethod';
const MPESA_PHONE_NUMBER_KEY = 'mpesaPhoneNumber';

export default function CheckoutPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useSession();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);
  const clearLocalCart = useCartStore((state) => state.clearCart);

  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Effect to load saved payment method and phone number
  useEffect(() => {
    const savedMethod = localStorage.getItem(PAYMENT_CHOICE_KEY);
    if (savedMethod) {
      setSelectedPaymentMethod(savedMethod);
    }
    const savedPhoneNumber = localStorage.getItem(MPESA_PHONE_NUMBER_KEY);
    if (savedPhoneNumber) {
      setMpesaPhoneNumber(savedPhoneNumber);
    }
  }, []);

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
  } = useQuery<BackendCart | null, Error>({
    queryKey: ['cart', authStatus, guestSessionKey],
    queryFn: async () => {
      if (authStatus === 'authenticated') {
        return fetchUserCart();
      }
      if (authStatus === 'unauthenticated' && guestSessionKey) {
        return fetchUserCart(guestSessionKey);
      }
      return null;
    },
    enabled: authStatus !== 'loading' && (authStatus === 'authenticated' || (authStatus === 'unauthenticated' && !!guestSessionKey)),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Mutation for initiating STK Push
  const initiateStkPushMutation = useMutation<BackendTransaction, Error, { orderId: number; phoneNumber: string }>({
    mutationFn: (payload) => initiateStkPushAPI(payload, guestSessionKey),
    onSuccess: (data) => {
      setCurrentTransactionId(data.id);
      onOpen(); // Open the payment modal
      localStorage.setItem(MPESA_PHONE_NUMBER_KEY, mpesaPhoneNumber); // Remember phone number
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
        return fetchTransactionStatusAPI(currentTransactionId, guestSessionKey);
      }
      return null;
    },
    enabled: !!currentTransactionId && isOpen,
    refetchInterval: POLLING_INTERVAL_MS,
    retry: (_failureCount: number, error: Error) => {
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
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        setCurrentTransactionId(null);
        onClose();
        return false;
      }

      setPollingAttempts(prev => prev + 1);
      return true;
    },
    onSuccess: (data: BackendTransaction | null) => {
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
          clearLocalCart();
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          router.push('/account/orders');
        } else {
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
        setCurrentTransactionId(null);
        onClose();
      }
    },
    onError: (error: Error) => {
      console.error("Polling Transaction Status Error:", error);
    }
  };

  const { data: transactionStatus, isLoading: isLoadingTransactionStatus } = useQuery(transactionStatusQueryOptions);

  const handleMpesaPhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, ''); // Remove spaces
    // Allow only digits
    value = value.replace(/\D/g, '');

    // Auto-correct 07x to 7x or 01x to 1x if 10 digits
    if (value.startsWith('0') && value.length === 10) {
      value = value.substring(1); // Remove the leading '0'
    }
    setMpesaPhoneNumber(value);
  }, []);

  const handleInitiatePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select your preferred payment method.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedPaymentMethod === 'mpesa') {
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

      // Final validation and formatting for M-Pesa
      let formattedPhoneNumber = mpesaPhoneNumber;

      // Ensure it starts with 254 and is 12 digits long
      if (!formattedPhoneNumber.startsWith('254') && (formattedPhoneNumber.startsWith('7') || formattedPhoneNumber.startsWith('1')) && formattedPhoneNumber.length === 9) {
        formattedPhoneNumber = '254' + formattedPhoneNumber;
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
    }
    // Add logic for other payment methods here in the future
  };

  const handleModalClose = () => {
    if (!isLoadingTransactionStatus && (!transactionStatus || ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(transactionStatus.status || ''))) {
      onClose();
      setCurrentTransactionId(null);
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
        {/* Payment Method Selection */}
        <RadioGroup
          onChange={(nextValue) => {
            setSelectedPaymentMethod(nextValue);
            localStorage.setItem(PAYMENT_CHOICE_KEY, nextValue); // Remember choice
          }}
          value={selectedPaymentMethod || ''} // Handle null initial state
        >
          <Stack direction="column" spacing={3}>
            <Radio value="mpesa">
              <HStack>
                {/* Reference directly from public folder */}
                <Image src="/mpesa_logo.png" alt="M-Pesa Logo" boxSize="55px" objectFit="contain" />
                <Text fontWeight="medium">M-Pesa</Text>
              </HStack>
            </Radio>

            <Radio value="card" isDisabled>
              <HStack>
                {/* Reference directly from public folder */}
                <Image src="/bank_card.png" alt="Bank Card Logo" boxSize="55px" objectFit="contain" />
                <Text fontWeight="medium">Card (Coming Soon)</Text>
              </HStack>
            </Radio>
            
            {/* Future payment methods can be added here */}
            {/*
            <Radio value="paypal" isDisabled>
              <HStack>
                <Image src="/path/to/paypal_logo.png" alt="PayPal Logo" boxSize="30px" objectFit="contain" />
                <Text fontWeight="medium">PayPal (Coming Soon)</Text>
              </HStack>
            </Radio>
            */}
          </Stack>
        </RadioGroup>

        {/* M-Pesa Specific Inputs - Collapsible */}
        <Collapse in={selectedPaymentMethod === 'mpesa'} animateOpacity>
          <VStack mt={4} spacing={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text fontSize="md" color="gray.700" width="full" textAlign="left">
              Enter your M-Pesa phone number:
            </Text>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" width="5rem"> {/* Adjust width as needed */}
                <HStack spacing={1} pl={2}>
                  {/* Reference directly from public folder */}
                  <Image src="/kenya_flag.png" alt="Kenya Flag" boxSize="20px" borderRadius="sm" />
                  <Text fontWeight="bold" color="gray.600">+254</Text>
                </HStack>
              </InputLeftElement>
              <Input
                type="tel"
                placeholder="7XXXXXXXXX or 1XXXXXXXXX"
                value={mpesaPhoneNumber}
                onChange={handleMpesaPhoneNumberChange}
                maxLength={9} // Max 9 digits for the suffix (e.g., 7xxxxxxxx)
                required
                isDisabled={initiateStkPushMutation.isPending}
                pl="5rem" // Padding to make space for the InputLeftElement
                pattern="[7-9]{1}[0-9]{8}" // Basic client-side pattern for 7xxxxxxxx or 1xxxxxxxx
              />
            </InputGroup>
          </VStack>
        </Collapse>

        <Button
          colorScheme="brand"
          size="lg"
          width="full"
          onClick={handleInitiatePayment}
          isLoading={initiateStkPushMutation.isPending}
          isDisabled={
            initiateStkPushMutation.isPending ||
            !selectedPaymentMethod ||
            (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber) ||
            parseFloat(cart.get_cart_total) <= 0
          }
          mt={4}
        >
          {initiateStkPushMutation.isPending
            ? 'Initiating STK Push...'
            : (selectedPaymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place Order')}
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

