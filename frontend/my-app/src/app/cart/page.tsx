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
  BackendOrder,
  ProductInCart,
  BackendOrderItem,
} from '@/api/orders';
import { useCartStore } from '@/store/useCartStore';

// Define the context interface for useMutation
interface UpdateCartContext {
  previousCart?: BackendOrder | null;
}

export default function CartPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: _session, status } = useSession(); // _session is unused

  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const getLocalTotalItems = useCartStore((state) => state.getTotalItems);
  const getLocalTotalPrice = useCartStore((state) => state.getTotalPrice);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  /**
   * CRITICAL: Always reset cart state from backend after login/signup or session change.
   * This ensures that after a user logs in or signs up, or the session status changes,
   * the Zustand cart is always synced with the backend's canonical cart state.
   */
  useEffect(() => {
    if (status !== 'loading') {
      const syncCartWithBackend = async () => {
        try {
          let cart: BackendOrder | null = null;
          if (status === 'authenticated') {
            cart = await fetchCartAPI();
            setGuestSessionKey(null); // Clear guest session key after login
          } else if (status === 'unauthenticated' && guestSessionKey) {
            cart = await fetchCartAPI(guestSessionKey);
          }
          if (cart && cart.items) {
            setLocalCartItems(
              cart.items.map((item) => ({
                id: item.product.id,
                name: item.product.name,
                price: parseFloat(item.product.price),
                quantity: item.quantity,
                image_url: item.product.image_url, // This was already correct here
              }))
            );
          } else {
            setLocalCartItems([]);
          }
        } catch (error) {
          // Don't block UI, just log error
          console.error('Could not sync Zustand cart with backend after session change:', error);
        }
      };
      syncCartWithBackend();
    }
    // Only re-run if session status or guestSessionKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, guestSessionKey]);

  // This effect ensures a guest session key is always available for unauthenticated users.
  // It should ideally be handled earlier in a layout or root provider, but is kept here for robustness.
  useEffect(() => {
    if (status === 'unauthenticated' && !guestSessionKey) {
      import('uuid').then(({ v4: uuidv4 }) => {
        const newKey = uuidv4();
        setGuestSessionKey(newKey);
        console.log('Generated new guest session key on cart page:', newKey);
      });
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
    queryKey: ['cart', status, currentSessionKey],
    queryFn: () => {
      if (status === 'authenticated') {
        return fetchCartAPI();
      }
      if (status === 'unauthenticated' && currentSessionKey) {
        return fetchCartAPI(currentSessionKey);
      }
      return Promise.resolve(null);
    },
    enabled: status !== 'loading',
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  /**
   * CRITICAL: Whenever backendCart changes, always set Zustand localCartItems to match.
   * This ensures the cart UI always reflects the backend's true state after login, signup,
   * or any backend update.
   */
  useEffect(() => {
    if (backendCart && status !== 'loading') {
      setLocalCartItems(
        backendCart.items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: parseFloat(item.product.price),
          quantity: item.quantity,
          image_url: item.product.image_url, // This was already correct here
        }))
      );
      // If backend returned a session key for an unauthenticated user, update local store
      if (backendCart.session_key && !guestSessionKey && status === 'unauthenticated') {
        setGuestSessionKey(backendCart.session_key);
        console.log('Backend returned new guest session key:', backendCart.session_key);
      }
    } else if (!backendCart && status !== 'loading' && (status === 'authenticated' || (status === 'unauthenticated' && !!currentSessionKey))) {
      setLocalCartItems([]);
    }
  }, [backendCart, status, setLocalCartItems, guestSessionKey, setGuestSessionKey, currentSessionKey]);

  /**
   * CRITICAL: Always update Zustand from backend response after mutation.
   * This prevents UI from showing stale or unmerged cart data after removing, clearing, or updating items.
   */
  const updateCartMutation = useMutation<BackendOrder, Error, ProductInCart[], UpdateCartContext>({
    mutationFn: (items) => updateEntireCartAPI(items, currentSessionKey),
    onMutate: async (newFrontendCartItems: ProductInCart[]) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart', status, currentSessionKey]);
      // Optimistic update
      setLocalCartItems(newFrontendCartItems);
      return { previousCart };
    },
    onError: (err, _newFrontendCartItems, context) => {
      console.error("Failed to update cart on backend:", err);
      toast({
        title: 'Error Updating Cart',
        description: err.message || 'Failed to update cart on server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      if (context?.previousCart) {
        setLocalCartItems(
          context.previousCart.items.map((bi) => ({
            id: bi.product.id,
            name: bi.product.name,
            price: parseFloat(bi.product.price),
            quantity: bi.quantity,
            image_url: bi.product.image_url, // ***FIXED HERE***
          }))
        );
      } else {
        setLocalCartItems([]);
      }
    },
    onSuccess: (_data) => {
      // Always update Zustand from backend's canonical cart
      setLocalCartItems(
        _data.items.map((backendItem) => ({
          id: backendItem.product.id,
          name: backendItem.product.name,
          price: parseFloat(backendItem.product.price),
          quantity: backendItem.quantity,
          image_url: backendItem.product.image_url, // ***FIXED HERE***
        }))
      );
      // If the backend returned a session_key, update it in local storage (e.g., first guest item added)
      if (_data.session_key && !guestSessionKey && status === 'unauthenticated') {
        setGuestSessionKey(_data.session_key);
        console.log("Backend returned new guest session key (from mutation):", _data.session_key);
      }
      toast({
        title: 'Cart Updated',
        description: 'Your cart has been synchronized.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] });
    },
  });

  const clearCartMutation = useMutation<BackendOrder, Error, number>({
    mutationFn: (cartId) => clearCartAPI(cartId, currentSessionKey),
    onMutate: async (cartId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', status, currentSessionKey] });
      // Optimistic update
      setLocalCartItems([]);
      setGuestSessionKey(null);
      return {};
    },
    onError: (err, _cartId, _context) => { // _cartId and _context are unused
      console.error("Failed to clear cart on backend:", err);
      toast({
        title: 'Error Clearing Cart',
        description: err.message || 'Failed to clear cart on server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // No rollback needed for clear
    },
    onSuccess: (_data) => { // _data is unused
      // Always update Zustand from backend cleared cart
      setLocalCartItems([]);
      setGuestSessionKey(null);
      toast({
        title: 'Cart Cleared',
        description: 'All items have been removed from your cart.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', status, currentSessionKey] });
    },
  });

  // The checkout logic now redirects to the dedicated checkout page
  const handleProceedToCheckout = () => {
    if (localCartItems.length === 0) {
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
    router.push('/checkout');
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
      setLocalCartItems([]);
      setGuestSessionKey(null);
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
            You are currently Browse as a guest. Your cart is saved locally.
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
              onClick={handleProceedToCheckout}
              isDisabled={itemsToRender.length === 0}
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
