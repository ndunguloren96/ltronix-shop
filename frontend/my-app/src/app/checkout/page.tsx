// src/app/checkout/page.tsx
'use client';

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Image,
  Divider,
  Flex,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// Import cart-related functions and types
import { fetchUserCart } from '@/api/cart';
import {
  BackendOrder,
  BackendOrderItem,
  BackendTransaction,
  ProductInCart,
} from '@/types/order';
import { useCartStore } from '@/store/useCartStore';
import { createOrder, CreateOrderRequest } from '@/api/checkout';

export default function CheckoutPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: _session, status } = useSession();

  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const getLocalTotalItems = useCartStore((state) => state.getTotalItems);
  const getLocalTotalPrice = useCartStore((state) => state.getTotalPrice);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  // Determine the session key to use for API calls
  const currentSessionKey = status === 'unauthenticated' ? guestSessionKey : null;

  // Fetch the canonical cart state from the backend
  const {
    data: backendCart,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<BackendOrder | null, Error>({
    queryKey: ['cart', status, currentSessionKey],
    queryFn: () => {
      if (status === 'authenticated') {
        return fetchUserCart();
      }
      if (status === 'unauthenticated' && currentSessionKey) {
        return fetchUserCart(currentSessionKey);
      }
      return Promise.resolve(null);
    },
    enabled: status !== 'loading' && (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey)),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Keep local Zustand cart in sync with backend data
  useEffect(() => {
    if (status !== 'loading') {
      if (backendCart) {
        setLocalCartItems(
          backendCart.items.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            quantity: item.quantity,
            image_file: item.product.image_file,
          }))
        );
        if (backendCart.session_key && !guestSessionKey && status === 'unauthenticated') {
          setGuestSessionKey(backendCart.session_key);
        }
      } else if (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey)) {
        setLocalCartItems([]);
      }
    }
  }, [backendCart, status, setLocalCartItems, guestSessionKey, setGuestSessionKey, currentSessionKey]);

  // Mutation to handle the checkout process
  const checkoutMutation = useMutation<BackendTransaction, Error, CreateOrderRequest>({
    mutationFn: (orderData) => createOrder(orderData, currentSessionKey),
    onSuccess: (data) => {
      // Clear the local cart after successful checkout
      setLocalCartItems([]);
      setGuestSessionKey(null);
      toast({
        title: 'Order Placed!',
        description: `Your order has been placed successfully. Transaction ID: ${data.id}`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      // Redirect to a thank you or order confirmation page
      router.push('/order-confirmation');
    },
    onError: (err) => {
      console.error("Checkout failed:", err);
      toast({
        title: 'Checkout Failed',
        description: err.message || 'An error occurred while processing your order.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handlePlaceOrder = () => {
    if (localCartItems.length === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items to your cart before placing an order.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (checkoutMutation.isPending) {
      return;
    }

    // Assuming you have a form or state to capture shipping details and other info
    // For this example, we'll use placeholder data.
    const orderData: CreateOrderRequest = {
      // You'll need to fill this out with actual data from a form
      shipping_address: '123 E-commerce St, Nairobi, Kenya',
      payment_method: 'Card',
      items: localCartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      }))
    };

    checkoutMutation.mutate(orderData);
  };

  // Show loading state while fetching cart data
  if (status === 'loading' || isLoading || isFetching) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">
            {status === 'loading' ? 'Authenticating...' : 'Loading your cart for checkout...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  const itemsToRender = localCartItems;
  const subtotal = getLocalTotalPrice();
  const shipping = 500; // Placeholder for shipping cost
  const tax = subtotal * 0.16; // Placeholder for 16% tax
  const total = subtotal + shipping + tax;

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Checkout
      </Heading>

      {isError && (
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" borderRadius="lg" boxShadow="md" mb={6}>
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load cart</Heading>
          <AlertDescription maxWidth="sm">
            {error?.message || 'An unexpected error occurred while fetching your cart.'}
            <br />
            Please ensure your backend is running and reachable.
          </AlertDescription>
        </Alert>
      )}

      {itemsToRender.length === 0 && (
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.600">
            Your cart is empty. Please add items to proceed.
          </Text>
          <Button colorScheme="brand" onClick={() => router.push('/products')}>
            Start Shopping
          </Button>
        </VStack>
      )}

      {itemsToRender.length > 0 && (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={10}>
          {/* Order Summary & Items Section */}
          <VStack spacing={6} align="stretch" flex={2}>
            <Heading as="h2" size="lg" mb={2}>Order Summary</Heading>
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow="sm"
              bg="white"
            >
              {itemsToRender.map((item) => (
                <HStack key={item.id} justifyContent="space-between" alignItems="center" py={4} borderBottom="1px solid" borderColor="gray.100">
                  <HStack spacing={4} flex={1}>
                    {/* Product Image */}
                    {item.image_file && ( // FIXED: changed `item.product.image` to `item.image_file`
                      <Image
                        src={item.image_file} // FIXED: changed `item.product.image` to `item.image_file`
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

          {/* Payment & Total Section */}
          <Box
            flex={1}
            p={6}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            bg="white"
            position={{ lg: 'sticky' }}
            top="4"
            alignSelf="flex-start"
          >
            <Heading as="h2" size="md" mb={4}>
              Payment Details
            </Heading>
            <Divider mb={4} />

            <Flex justifyContent="space-between" mb={2}>
              <Text>Subtotal ({getLocalTotalItems()} items)</Text>
              <Text fontWeight="semibold">Ksh {subtotal.toFixed(2)}</Text>
            </Flex>
            <Flex justifyContent="space-between" mb={2}>
              <Text>Shipping</Text>
              <Text fontWeight="semibold">Ksh {shipping.toFixed(2)}</Text>
            </Flex>
            <Flex justifyContent="space-between" mb={4}>
              <Text>Tax (16%)</Text>
              <Text fontWeight="semibold">Ksh {tax.toFixed(2)}</Text>
            </Flex>

            <Divider mb={4} />

            <Flex justifyContent="space-between" mb={4}>
              <Text fontSize="xl" fontWeight="bold">
                Total:
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="brand.600">
                Ksh {total.toFixed(2)}
              </Text>
            </Flex>

            <Button
              colorScheme="green"
              size="lg"
              width="full"
              onClick={handlePlaceOrder}
              isDisabled={checkoutMutation.isPending || itemsToRender.length === 0}
              isLoading={checkoutMutation.isPending}
            >
              Place Order
            </Button>
          </Box>
        </Flex>
      )}
    </Box>
  );
}
