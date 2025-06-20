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
  Spinner, // For loading states
  Center, // For centering loading/error messages
  Alert, AlertIcon, AlertDescription, // For error messages
  Link as ChakraLink, // For internal Chakra links
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // For Next.js Link


import {
  fetchCartAPI,
  updateEntireCartAPI,
  clearCartAPI,
  checkoutCartAPI,
  BackendOrder,
  ProductInCart,
  BackendOrderItem,
} from '@/api/orders';
import { useCartStore } from '@/store/useCartStore'; // Zustand store

export default function CartPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession(); // NextAuth.js session status

  // Zustand cart state and actions for local/optimistic updates
  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const getLocalTotalItems = useCartStore((state) => state.getTotalItems);
  const getLocalTotalPrice = useCartStore((state) => state.getTotalPrice);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  // --- Guest Session Key Management ---
  useEffect(() => {
    // Generate a guestSessionKey if it doesn't exist AND the user is unauthenticated
    // The Zustand persist middleware's onRehydrateStorage might do this, but this ensures it.
    if (status === 'unauthenticated' && !guestSessionKey) {
      const { v4: uuidv4 } = require('uuid');
      const newKey = uuidv4();
      setGuestSessionKey(newKey);
      console.log('Generated new guest session key on cart page:', newKey);
    }
  }, [status, guestSessionKey, setGuestSessionKey]);

  // Determine the key to use for fetching/mutating the cart based on auth status
  const currentSessionKey = status === 'unauthenticated' ? guestSessionKey : null;

  // TanStack Query: Fetch the user's active cart
  const {
    data: backendCart,
    isLoading,
    isError,
    error,
    isFetching, // Indicates background refetches
  } = useQuery<BackendOrder | null, Error>({
    queryKey: ['cart', status, currentSessionKey], // Include auth status and session key in query key
    queryFn: () => {
      // If authenticated, make API call without sessionKey (backend uses auth token)
      if (status === 'authenticated') {
        return fetchCartAPI();
      }
      // If unauthenticated AND a guestSessionKey exists, make API call with sessionKey
      if (status === 'unauthenticated' && currentSessionKey) {
        return fetchCartAPI(currentSessionKey);
      }
      // If unauthenticated and no session key (e.g., initial load before key is set),
      // resolve immediately as null so isLoading becomes false and UI shows empty cart.
      return Promise.resolve(null);
    },
    enabled: status !== 'loading' && (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey)), // Only fetch if not loading auth and ready
    staleTime: 0, // Always consider cart data stale to ensure real-time accuracy
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes in background
  });

  // Transform BackendOrderItem to ProductInCart for Zustand store
  const transformBackendItemsToFrontend = (items: BackendOrderItem[]): ProductInCart[] => {
    return items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity,
      image_url: item.product.image_url,
    }));
  };

  // Sync backend cart with Zustand store on successful fetch
  useEffect(() => {
    if (backendCart && status !== 'loading') {
      setLocalCartItems(transformBackendItemsToFrontend(backendCart.items));
      // If backend returns a session key (e.g., on first guest cart creation), store it.
      if (backendCart.session_key && !guestSessionKey) {
        setGuestSessionKey(backendCart.session_key);
        console.log('Backend returned new guest session key:', backendCart.session_key);
      }
    } else if (!backendCart && status !== 'loading' && (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey))) {
      // If backend returns null or an empty cart object, clear local cart (for authenticated or existing guest sessions)
      setLocalCartItems([]);
    }
  }, [backendCart, status, setLocalCartItems, guestSessionKey, setGuestSessionKey, currentSessionKey]);


  // TanStack Query: Mutation for updating the cart on the backend
  const updateCartMutation = useMutation<BackendOrder, Error, ProductInCart[]>({
    mutationFn: (items) => updateEntireCartAPI(items, currentSessionKey), // Pass currentSessionKey to mutation
    onMutate: async (newFrontendCartItems: ProductInCart[]) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);

      // Optimistically update the TanStack Query cache
      queryClient.setQueryData<BackendOrder>(['cart', status, currentSessionKey], (oldCart) => {
        const updatedBackendItems: BackendOrderItem[] = newFrontendCartItems.map(item => ({
            id: oldCart?.items.find(bi => bi.product.id === item.id)?.id || Math.random(), // Use existing ID or dummy
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
        // If no old cart, create a basic optimistic cart (for first item added by guest/new user)
        return {
            id: null,
            customer: session?.user?.id ? parseInt(session.user.id) : null,
            session_key: currentSessionKey,
            date_ordered: new Date().toISOString(),
            complete: false,
            transaction_id: null,
            get_cart_total: newFrontendCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
            get_cart_items: newFrontendCartItems.reduce((acc, item) => acc + item.quantity, 0),
            shipping: false,
            items: updatedBackendItems,
        } as BackendOrder;
      });

      setLocalCartItems(newFrontendCartItems); // Optimistically update Zustand directly

      return { previousCart };
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
      queryClient.setQueryData(['cart', status, currentSessionKey], context?.previousCart); // Rollback TanStack Query cache
      if (context?.previousCart) {
          setLocalCartItems(transformBackendItemsToFrontend(context.previousCart.items)); // Rollback Zustand
      } else {
          setLocalCartItems([]); // If no previous cart, clear local Zustand
      }
    },
    onSettled: async (data, error, variables, context) => {
      // If mutation successful and backend returns a session_key for a guest cart, store it
      if (data && data.session_key && !guestSessionKey && status === 'unauthenticated') {
          setGuestSessionKey(data.session_key);
          console.log("Backend returned new guest session key (from mutation):", data.session_key);
      }
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] }); // Always refetch for consistency
    },
    onSuccess: (data) => {
      toast({
        title: 'Cart Updated',
        description: 'Your cart has been synchronized.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // After successful backend sync, update Zustand to precisely match the backend data (e.g., actual item IDs)
      setLocalCartItems(transformBackendItemsToFrontend(data.items));
    },
  });

  // TanStack Query: Mutation for clearing the cart
  const clearCartMutation = useMutation<BackendOrder, Error, number | undefined>({
    mutationFn: (cartId) => {
        if (cartId) {
            return clearCartAPI(cartId, currentSessionKey); // Pass sessionKey
        }
        // If no cartId (e.g., new guest with no backend cart yet), just clear local
        return Promise.resolve({} as BackendOrder); // Return empty object for optimistic update
    },
    onMutate: async (cartId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);

      // Optimistically clear the cart in TanStack Query cache
      queryClient.setQueryData<BackendOrder>(['cart', status, currentSessionKey], (oldCart) => {
        if (oldCart) {
          return { ...oldCart, items: [], get_cart_items: 0, get_cart_total: "0.00" };
        }
        return null;
      });
      setLocalCartItems([]); // Optimistically clear Zustand cart
      setGuestSessionKey(null); // Clear guest session key as cart is empty

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
      queryClient.setQueryData(['cart', status, currentSessionKey], context?.previousCart); // Rollback cache
      if (context?.previousCart) {
          setLocalCartItems(transformBackendItemsToFrontend(context.previousCart.items)); // Rollback Zustand
      }
      // Re-evaluate if guestSessionKey needs to be restored here based on context.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] });
      // A new session key might be implicitly generated by the backend if a guest adds an item again.
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

  // TanStack Query: Mutation for checking out the cart
  const checkoutMutation = useMutation<BackendOrder, Error, number>({
    mutationFn: checkoutCartAPI,
    onMutate: async (cartId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);
      // Optimistically mark cart as complete and clear items in cache
      queryClient.setQueryData<BackendOrder>(['cart', status, currentSessionKey], (oldCart) => {
        if (oldCart && oldCart.id === cartId) {
          return { ...oldCart, complete: true, items: [], get_cart_items: 0, get_cart_total: "0.00" };
        }
        return oldCart;
      });
      setLocalCartItems([]); // Optimistically clear Zustand cart
      setGuestSessionKey(null); // Clear guest session key as cart is completed

      return { previousCart };
    },
    onError: (err, cartId, context) => {
      console.error("Failed to checkout cart:", err);
      toast({
        title: 'Checkout Failed',
        description: err.message || 'There was an error processing your order.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      queryClient.setQueryData(['cart', status, currentSessionKey], context?.previousCart); // Rollback cache
      if (context?.previousCart) {
          setLocalCartItems(transformBackendItemsToFrontend(context.previousCart.items)); // Rollback Zustand
      }
      // Re-evaluate if guestSessionKey needs to be restored here based on context.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] }); // Invalidate cart query
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate orders history query
    },
    onSuccess: (data) => {
      toast({
        title: 'Order Placed!',
        description: `Your order #${data.id} has been placed successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/account/orders'); // Redirect to order history
    },
  });


  // Event Handlers for Cart Actions (now calling mutations)

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
        clearCartMutation.mutate(undefined); // Trigger mutation for local-only clear
    }
  };

  const handleCheckout = () => {
    if (status === 'loading') {
        toast({
            title: 'Please Wait',
            description: 'Still loading authentication status.',
            status: 'info',
            duration: 2000,
            isClosable: true,
        });
        return;
    }
    // Checkout now requires authentication
    if (status === 'unauthenticated') {
      toast({
        title: 'Login Required for Checkout',
        description: 'Please log in or sign up to complete your order.',
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      router.push('/auth/login'); // Redirect to login page
      return;
    }

    if (!backendCart || backendCart.get_cart_items === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items to your cart before checking out.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    // Trigger checkout mutation
    checkoutMutation.mutate(backendCart.id);
  };

  // Render states for the cart page
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

  // Use the local Zustand cart items for rendering, as they are optimistically updated
  // This ensures immediate UI feedback. The backendCart (from useQuery) is for initial sync.
  const itemsToRender = localCartItems;


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

      {itemsToRender.length === 0 && !isLoading && !isFetching && ( // Only show empty message if not loading or fetching
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
          {/* Cart Items List */}
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
                      min={0} // Allow 0 quantity to trigger removal
                      onChange={(valueAsString) =>
                        handleQuantityChange(item.id, valueAsString)
                      }
                      keepWithinRange={false}
                      clampValueOnBlur={false}
                      isDisabled={updateCartMutation.isPending} // Disable quantity input during mutation
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
                    isLoading={updateCartMutation.isPending} // Disable button during mutation
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
              isDisabled={clearCartMutation.isPending}
            >
              Clear Cart
            </Button>
          </VStack>

          {/* Order Summary */}
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
              onClick={handleCheckout}
              isLoading={checkoutMutation.isPending}
              isDisabled={checkoutMutation.isPending || itemsToRender.length === 0}
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
