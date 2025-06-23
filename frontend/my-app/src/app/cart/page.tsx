// frontend/my-app/src/app/cart/page.tsx
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
  Spacer,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Center,
  Alert, AlertIcon, AlertDescription,
  Link as ChakraLink,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // For Next.js Link component

import {
  fetchCartAPI,
  updateEntireCartAPI,
  clearCartAPI,
  // checkoutCartAPI, // This is no longer called directly from here
  BackendOrder,
  ProductInCart,
  BackendOrderItem,
} from '@/api/orders';
import { useCartStore } from '@/store/useCartStore';

export default function CartPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const getLocalTotalItems = useCartStore((state) => state.getTotalItems);
  const getLocalTotalPrice = useCartStore((state) => state.getTotalPrice);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  useEffect(() => {
    // This effect ensures a guest session key is always available for unauthenticated users
    // It should ideally be handled earlier in a layout or root provider
    if (status === 'unauthenticated' && !guestSessionKey) {
      const { v4: uuidv4 } = require('uuid'); // Dynamically import uuid
      const newKey = uuidv4();
      setGuestSessionKey(newKey);
      console.log('Generated new guest session key on cart page:', newKey);
    }
  }, [status, guestSessionKey, setGuestSessionKey]);

  // Determine the session key to use for API calls
  const currentSessionKey = status === 'unauthenticated' ? guestSessionKey : null;

  const {
    data: backendCart,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<BackendOrder | null, Error>({
    queryKey: ['cart', status, currentSessionKey], // Query key dependent on auth status and session key
    queryFn: () => {
      // Only fetch if not in loading auth state and either authenticated or a guest session key exists
      if (status === 'authenticated') {
        return fetchCartAPI();
      }
      if (status === 'unauthenticated' && currentSessionKey) {
        return fetchCartAPI(currentSessionKey);
      }
      // If unauthenticated and no session key, resolve to null (new guest, cart doesn't exist yet on backend)
      return Promise.resolve(null);
    },
    enabled: status !== 'loading', // Only run query once auth status is determined
    staleTime: 0, // Always consider cart data stale
    refetchOnWindowFocus: true, // Refetch on tab focus
    refetchOnMount: true, // Refetch when component mounts
  });

  // Synchronize backend cart data with local Zustand store
  useEffect(() => {
    if (backendCart && status !== 'loading') {
      setLocalCartItems(
        backendCart.items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: parseFloat(item.product.price),
          quantity: item.quantity,
          image_url: item.product.image_url,
        }))
      );
      // If backend returned a session key for an unauthenticated user, update local store
      if (backendCart.session_key && !guestSessionKey && status === 'unauthenticated') {
        setGuestSessionKey(backendCart.session_key);
        console.log('Backend returned new guest session key:', backendCart.session_key);
      }
    } else if (!backendCart && status !== 'loading' && (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey))) {
      // If backend reports no cart, clear local cart (but not if just waiting for initial guest session key)
      setLocalCartItems([]);
    }
  }, [backendCart, status, setLocalCartItems, guestSessionKey, setGuestSessionKey, currentSessionKey]);

  const updateCartMutation = useMutation<BackendOrder, Error, ProductInCart[]>({
    mutationFn: (items) => updateEntireCartAPI(items), // No longer pass sessionKey here, it's handled in fetchAuthenticated
    onMutate: async (newFrontendCartItems: ProductInCart[]) => {
      // Optimistic update: cancel existing queries, then set new data
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);

      queryClient.setQueryData<BackendOrder>(['cart', status, currentSessionKey], (oldCart) => {
        const updatedBackendItems: BackendOrderItem[] = newFrontendCartItems.map(item => ({
          id: oldCart?.items.find(bi => bi.product.id === item.id)?.id || Math.random(), // Use existing ID if possible
          product: { id: item.id, name: item.name, price: item.price.toFixed(2), image_url: item.image_url },
          quantity: item.quantity,
          get_total: (item.price * item.quantity).toFixed(2),
        }));

        if (oldCart) {
          return {
            ...oldCart,
            items: updatedBackendItems,
            get_cart_items: newFrontendCartItems.reduce((acc, item) => acc + item.quantity, 0),
            get_cart_total: newFrontendCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
          };
        }
        // Fallback for initial cart if no oldCart exists (should ideally come from backend fetch)
        return {
            id: null, // Temporary, will be replaced by backend ID
            customer: session?.user?.id ? parseInt(session.user.id) : null,
            date_ordered: new Date().toISOString(),
            complete: false,
            transaction_id: null,
            get_cart_total: newFrontendCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
            get_cart_items: newFrontendCartItems.reduce((acc, item) => acc + item.quantity, 0),
            shipping: false,
            items: updatedBackendItems,
            session_key: currentSessionKey, // Ensure session key is passed for guest state
        } as BackendOrder; // Cast as BackendOrder
      });

      setLocalCartItems(newFrontendCartItems); // Update local Zustand state immediately

      return { previousCart }; // Context for rollback
    },
    onError: (err, newFrontendCartItems, context) => {
      console.error("Failed to update cart on backend:", err);
      toast({
        title: 'Error Updating Cart',
        description: err.message || 'Failed to update cart on server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Rollback to previous state
      queryClient.setQueryData(['cart', status, currentSessionKey], context?.previousCart);
      if (context?.previousCart) {
          setLocalCartItems(
              context.previousCart.items.map((bi) => ({
                  id: bi.product.id,
                  name: bi.product.name,
                  price: parseFloat(bi.product.price),
                  quantity: bi.quantity,
                  image_url: bi.product.image_url,
              }))
          );
      } else {
          setLocalCartItems([]);
      }
    },
    onSettled: async (data, error, variables, context) => {
      // Invalidate queries to refetch the true state from the backend
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] });
    },
    onSuccess: (data) => {
      toast({
        title: 'Cart Updated',
        description: 'Your cart has been synchronized.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // Ensure local state is perfectly synced with backend after successful mutation
      setLocalCartItems(data.items.map(backendItem => ({
        id: backendItem.product.id,
        name: backendItem.product.name,
        price: parseFloat(backendItem.product.price),
        quantity: backendItem.quantity,
        image_url: backendItem.product.image_url,
      })));
      // If the backend returned a session_key, update it in local storage (e.g., first guest item added)
      if (data.session_key && !guestSessionKey && status === 'unauthenticated') {
        setGuestSessionKey(data.session_key);
        console.log("Backend returned new guest session key (from mutation):", data.session_key);
      }
    },
  });

  const clearCartMutation = useMutation<BackendOrder, Error, number>({
    mutationFn: (cartId) => clearCartAPI(cartId), // No longer pass sessionKey here
    onMutate: async (cartId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);

      queryClient.setQueryData<BackendOrder>(['cart', status, currentSessionKey], (oldCart) => {
        if (oldCart) {
          return { ...oldCart, items: [], get_cart_items: 0, get_cart_total: "0.00" };
        }
        return null;
      });
      setLocalCartItems([]);
      setGuestSessionKey(null); // Clear guest session key as cart is cleared

      return { previousCart };
    },
    onError: (err, cartId, context) => {
      console.error("Failed to clear cart on backend:", err);
      toast({
        title: 'Error Clearing Cart',
        description: err.message || 'Failed to clear cart on server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      queryClient.setQueryData(['cart', status, currentSessionKey], context?.previousCart);
      if (context?.previousCart) {
          setLocalCartItems(
              context.previousCart.items.map((bi) => ({
                  id: bi.product.id,
                  name: bi.product.name,
                  price: parseFloat(bi.product.price),
                  quantity: bi.quantity,
                  image_url: bi.product.image_url,
              }))
          );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] });
    },
    onSuccess: () => {
      toast({
        title: 'Cart Cleared',
        description: 'All items have been removed from your cart.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    },
  });

  // The checkout logic now redirects to the dedicated checkout page
  const handleProceedToCheckout = () => {
    if (!cart || cart.get_cart_items === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items to your cart before proceeding to checkout.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    router.push('/checkout'); // Redirect to the new checkout page
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = localCartItems.filter((item) => item.id !== id);
    updateCartMutation.mutate(updatedItems);
  };

  const handleQuantityChange = (id: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      let updatedItems: ProductInCart[];
      if (newQuantity === 0) {
        updatedItems = localCartItems.filter(item => item.id !== id);
      } else {
        updatedItems = localCartItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      }
      updateCartMutation.mutate(updatedItems);
    }
  };

  const handleClearCart = () => {
    if (backendCart?.id) {
      clearCartMutation.mutate(backendCart.id);
    } else {
      // If there's no backend cart ID (e.g., newly initialized guest cart not yet synced),
      // just clear local state. The next add-to-cart will create a new backend cart.
      setLocalCartItems([]);
      setGuestSessionKey(null); // Clear guest session key
      toast({
        title: 'Cart Cleared',
        description: 'Your local cart has been cleared.',
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };


  if (status === 'loading' || isLoading) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text fontSize="xl">
            {status === 'loading' ? 'Authenticating...' : 'Loading your cart...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  const itemsToRender = localCartItems; // Display local cart items

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Your Shopping Cart
      </Heading>

      {status === 'unauthenticated' && (
        <Alert status="info" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            You are currently browsing as a guest. Your cart is saved locally.
            {' '}
            <Link href="/auth/login" passHref>
              <ChakraLink color="blue.600" fontWeight="bold">Login</ChakraLink>
            </Link>
            {' '}or{' '}
            <Link href="/auth/signup" passHref>
              <ChakraLink color="blue.600" fontWeight="bold">Sign Up</ChakraLink>
            </Link>
            {' '}to permanently save your cart and access order history.
          </AlertDescription>
        </Alert>
      )}

      {isError && (
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" borderRadius="lg" boxShadow="md" mb={6}>
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load cart</Heading>
          <AlertDescription maxWidth="sm">
            {error?.message || 'An unexpected error occurred while fetching your cart.'}
            <br />
            Please ensure your Django backend is running and reachable.
            <br />
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] })} mt={4} colorScheme="brand">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {itemsToRender.length === 0 && !isLoading && !isFetching && (
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.600">
            Your cart is currently empty.
          </Text>
          <Button colorScheme="brand" onClick={() => router.push('/products')}>
            Start Shopping
          </Button>
        </VStack>
      )}

      {itemsToRender.length > 0 && (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={10}>
          <VStack spacing={6} align="stretch" flex={2}>
            {itemsToRender.map((item) => (
              <Box
                key={item.id}
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                boxShadow="sm"
                bg="white"
              >
                <HStack spacing={4} align="center">
                  <Image
                    src={item.image_url || "https://placehold.co/100x100?text=No+Image"}
                    alt={item.name}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <Box flex={1}>
                    <Text fontWeight="bold" fontSize="lg">
                      {item.name}
                    </Text>
                    <Text color="gray.600">Ksh {item.price.toFixed(2)}</Text>
                  </Box>
                  <HStack>
                    <Text>Qty:</Text>
                    <NumberInput
                      maxW="100px"
                      value={item.quantity}
                      min={0}
                      onChange={(valueAsString) =>
                        handleQuantityChange(item.id, valueAsString)
                      }
                      keepWithinRange={false}
                      clampValueOnBlur={false}
                      isDisabled={updateCartMutation.isPending}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </HStack>
                  <Text fontWeight="semibold">
                    Ksh {(item.price * item.quantity).toFixed(2)}
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                    isLoading={updateCartMutation.isPending}
                    isDisabled={updateCartMutation.isPending}
                  >
                    Remove
                  </Button>
                </HStack>
              </Box>
            ))}
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleClearCart}
              mt={4}
              alignSelf="flex-end"
              isLoading={clearCartMutation.isPending}
              isDisabled={clearCartMutation.isPending || itemsToRender.length === 0}
            >
              Clear Cart
            </Button>
          </VStack>

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
              Order Summary
            </Heading>
            <Divider mb={4} />
            <Flex justifyContent="space-between" mb={2}>
              <Text>Total Items:</Text>
              <Text fontWeight="semibold">{getLocalTotalItems()}</Text>
            </Flex>
            <Flex justifyContent="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="bold">
                Subtotal:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="brand.600">
                Ksh {getLocalTotalPrice().toFixed(2)}
              </Text>
            </Flex>
            <Button
              colorScheme="green"
              size="lg"
              width="full"
              onClick={handleProceedToCheckout} // Updated to link to checkout page
              isDisabled={itemsToRender.length === 0} // Disable if cart is empty
              mt={4}
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="link"
              colorScheme="brand"
              mt={4}
              width="full"
              onClick={() => router.push('/products')}
            >
              Continue Shopping
            </Button>
          </Box>
        </Flex>
      )}
    </Box>
  );
}

