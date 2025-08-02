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
  Image,
  RadioGroup,
  Stack,
  Radio,
  Collapse,
  FormLabel,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PhoneIcon,
  CreditCardIcon,
  MapPinIcon,
  GlobeAltIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

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

  // --- START OF MODIFICATION ---
  // We're now directly accessing the local cart state from the Zustand store
  const localCartItems = useCartStore((state) => state.items);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
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

  // Determine if the component is ready to fetch cart data.
  const isReadyToFetch = authStatus !== 'loading' && (authStatus === 'authenticated' || (authStatus === 'unauthenticated' && !!guestSessionKey));

  // Fetch the current cart data from the backend. This is primarily for getting the cart ID for payment.
  // The UI is now driven by the local Zustand store for instantaneous updates.
  const {
    data: cart,
    isLoading: isLoadingCart,
    isError: isErrorCart,
    error: cartError,
    isFetching: isFetchingBackendCart,
  } = useQuery<BackendCart | null, Error>({
    queryKey: ['cart', authStatus, guestSessionKey],
    queryFn: async () => {
      console.log('Fetching cart with:', { authStatus, guestSessionKey });
      
      // If the local cart is empty, there's no need to fetch from the backend for payment validation.
      if (localCartItems.length === 0) {
        return null;
      }

      if (authStatus === 'authenticated') {
        return fetchUserCart();
      }
      if (authStatus === 'unauthenticated' && guestSessionKey) {
        return fetchUserCart(guestSessionKey);
      }
      return null;
    },
    enabled: isReadyToFetch,
    staleTime: 0,
    refetchOnWindowFocus: true, // Re-enabled to help with backend sync if user tabs away and comes back.
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
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');

    if (value.startsWith('0') && value.length === 10) {
      value = value.substring(1);
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

      // We now check both the local cart and the backend cart
      // The local cart is the source of truth for the UI
      if (localCartItems.length === 0) {
        toast({
          title: 'Cart is Empty',
          description: 'Your cart is empty. Please add items before checking out.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if the backend cart exists and has the correct ID
      if (!cart?.id) {
        toast({
          title: 'Cart Synchronization Error',
          description: 'Your cart could not be loaded from the server for payment. Please try refreshing the page or try again in a moment.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      let formattedPhoneNumber = mpesaPhoneNumber;

      if (!formattedPhoneNumber.startsWith('254') && (formattedPhoneNumber.startsWith('7') || formattedPhoneNumber.startsWith('1')) && formattedPhoneNumber.length === 9) {
        formattedPhoneNumber = '254' + formattedPhoneNumber;
      }

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
        orderId: cart.id, // Use the backend cart ID for payment
        phoneNumber: formattedPhoneNumber,
      });
    }
  };

  const handleModalClose = () => {
    if (!isLoadingTransactionStatus && (!transactionStatus || ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(transactionStatus.status))) {
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

  // Calculate totals from the local cart for the UI
  const totalItems = localCartItems.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = localCartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  // Check for the local cart first, before showing loading/error states for the backend cart.
  if (localCartItems.length === 0) {
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

  // Then show loading for the backend cart, which is needed for payment
  if (isReadyToFetch && isLoadingCart) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">
            Loading your cart for payment validation...
          </Text>
        </VStack>
      </Center>
    );
  }

  // Show an error if the backend cart couldn't be loaded, even if the local cart has items.
  if (isErrorCart) {
    return (
      <Center minH="80vh">
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" borderRadius="lg" boxShadow="md" m={8}>
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load cart for payment</Heading>
          <AlertDescription maxWidth="sm">
            {cartError?.message || 'An unexpected error occurred while fetching your cart.'}
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

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Checkout
      </Heading>

      <Flex direction={{ base: 'column', md: 'row' }} gap={10}>
        {/* Left Column: Payment Method & Order Summary */}
        <VStack spacing={6} align="stretch" flex={2}>
          {/* Payment Method Section */}
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Heading as="h2" size="md" mb={4}>
              Payment Method
            </Heading>
            <Divider mb={4} />
            <RadioGroup
              onChange={(nextValue) => {
                setSelectedPaymentMethod(nextValue);
                localStorage.setItem(PAYMENT_CHOICE_KEY, nextValue);
              }}
              value={selectedPaymentMethod || ''}
            >
              <Stack direction="row" spacing={6} wrap="wrap">
                <Radio value="mpesa">
                  <HStack>
                    <Image src="/mpesa_logo.png" alt="M-Pesa Logo" boxSize="55px" objectFit="contain" />
                    <Text fontWeight="medium">M-Pesa</Text>
                  </HStack>
                </Radio>
                <Radio value="card" isDisabled>
                  <HStack>
                    <Image src="/bank_card.png" alt="Bank Card Logo" boxSize="55px" objectFit="contain" />
                    <Text fontWeight="medium">Card (Coming Soon)</Text>
                  </HStack>
                </Radio>
              </Stack>
            </RadioGroup>

            <Collapse in={selectedPaymentMethod === 'mpesa'} animateOpacity>
              <VStack mt={4} spacing={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                <FormLabel fontSize="md" color="gray.700" width="full" textAlign="left" mb={0}>
                  Enter your M-Pesa phone number:
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none" width="5rem">
                    <HStack spacing={1} pl={2}>
                      <Image src="/kenya_flag.png" alt="Kenya Flag" boxSize="20px" borderRadius="sm" />
                      <Text fontWeight="bold" color="gray.600">+254</Text>
                    </HStack>
                  </InputLeftElement>
                  <Input
                    type="tel"
                    placeholder="7XXXXXXXXX or 1XXXXXXXXX"
                    value={mpesaPhoneNumber}
                    onChange={handleMpesaPhoneNumberChange}
                    maxLength={9}
                    required
                    isDisabled={initiateStkPushMutation.isPending}
                    pl="5rem"
                    pattern="[7-9]{1}[0-9]{8}"
                  />
                </InputGroup>
              </VStack>
            </Collapse>
          </Box>
          
          {/* Order Summary Section now uses the local cart items */}
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Heading as="h2" size="md" mb={4}>
              Order Summary
            </Heading>
            <Divider mb={4} />

            {localCartItems.map((item) => (
              <HStack key={item.id} justifyContent="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
                <HStack spacing={4} flex={1}>
                  {item.image_file && (
                    <Image
                      src={item.image_file}
                      alt={item.name}
                      boxSize="80px"
                      objectFit="contain"
                      borderRadius="md"
                      fallbackSrc="https://via.placeholder.com/80?text=No+Image"
                    />
                  )}
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="semibold" fontSize="md">
                      {item.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Qty: {item.quantity}
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="semibold">
                  Ksh {(item.price * item.quantity).toFixed(2)}
                </Text>
              </HStack>
            ))}
          </Box>
        </VStack>

        {/* Right Column: Payment Details & Place Order */}
        <Box
          flex={1}
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          boxShadow="md"
          bg="white"
          position={{ md: 'sticky' }}
          top="4"
          alignSelf="flex-start"
        >
          <Heading as="h2" size="md" mb={4}>
            Payment Details
          </Heading>
          <Divider mb={4} />

          <Flex justifyContent="space-between" mb={2}>
            <Text>Total Items ({totalItems})</Text>
            <Text fontWeight="semibold">{totalItems}</Text>
          </Flex>

          <Divider my={4} />

          <Flex justifyContent="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              Amount Due:
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              Ksh {totalAmount}
            </Text>
          </Flex>

          <Button
            colorScheme={selectedPaymentMethod === 'mpesa' ? 'green' : 'brand'}
            size="lg"
            width="full"
            onClick={handleInitiatePayment}
            isLoading={initiateStkPushMutation.isPending || isFetchingBackendCart}
            isDisabled={
              initiateStkPushMutation.isPending ||
              isFetchingBackendCart || // Disable if the backend cart is still being fetched
              !selectedPaymentMethod ||
              (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber) ||
              localCartItems.length === 0 || // Now check the local cart for emptines
              !cart?.id // Disable if backend cart ID is not yet available
            }
          >
            {initiateStkPushMutation.isPending || isFetchingBackendCart
              ? 'Loading...'
              : (selectedPaymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place Order')}
          </Button>
        </Box>
      </Flex>

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
