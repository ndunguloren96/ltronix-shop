// src/app/cart/page.tsx
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
  // Spinner, // Not needed as no backend calls
  // Center, // Not needed as no backend calls
  Alert, AlertIcon, AlertDescription,
  Link as ChakraLink,
} from '@chakra-ui/react';
import React, { useEffect, useCallback } from 'react'; // Added useCallback
import { useRouter } from 'next/navigation';
// Removed: useQuery, useMutation, useQueryClient from '@tanstack/react-query'; // Not needed as no backend calls
import Link from 'next/link'; // For Next.js Link component

// Removed all backend API imports as we are no longer interacting with the backend for cart management
// Removed: fetchCartAPI, updateEntireCartAPI, clearCartAPI, BackendOrder, ProductInCart, BackendOrderItem from '@/api/orders';

import { useCartStore } from '@/store/useCartStore';

// Removed: Define the context interface for useMutation
// Removed: interface UpdateCartContext { previousCart?: BackendOrder | null; }

export default function CartPage() {
  const toast = useToast();
  const router = useRouter();
  // Removed: const queryClient = useQueryClient(); // Not needed as no backend calls

  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity); // New action for quantity
  const removeItem = useCartStore((state) => state.removeItem); // New action for remove
  const clearCart = useCartStore((state) => state.clearCart); // New action for clear
  const getLocalTotalItems = useCartStore((state) => state.getTotalItems);
  const getLocalTotalPrice = useCartStore((state) => state.getTotalPrice);
  // guestSessionKey is now primarily for client-side persistence if desired, not for API calls
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  // This effect ensures a guest session key is always available for local storage purposes.
  useEffect(() => {
    if (typeof window !== 'undefined' && !guestSessionKey) {
      import('uuid').then(({ v4: uuidv4 }) => {
        const newKey = uuidv4();
        setGuestSessionKey(newKey);
        console.log('Generated new guest session key for local storage:', newKey);
      });
    }
  }, [guestSessionKey, setGuestSessionKey]);


  // New placeholder handler for WhatsApp Inquiry, no actual implementation yet.
  const handleInquireViaWhatsApp = useCallback(() => {
    if (localCartItems.length === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items to your cart before inquiring.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    // Construct a simple message with cart items
    const cartSummary = localCartItems.map(item =>
      `${item.name} (Qty: ${item.quantity}, Ksh ${item.price.toFixed(2)} each)`
    ).join('\n');
    const total = getLocalTotalPrice().toFixed(2);
    const message = `Hello, I'd like to inquire about the following items in my cart:\n\n${cartSummary}\n\nTotal: Ksh ${total}\n\nCould you please assist me with placing an order or providing more details?`;

    // Encode the message for a WhatsApp link
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab/window
    window.open(whatsappLink, '_blank');

    toast({
      title: 'Opening WhatsApp',
      description: 'Please complete your inquiry in WhatsApp.',
      status: 'info',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });

  }, [localCartItems, getLocalTotalPrice, toast]);

  const handleRemoveItem = useCallback((id: number) => {
    removeItem(id);
    toast({
      title: 'Item Removed',
      description: 'Product removed from your cart.',
      status: 'info',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  }, [removeItem, toast]);

  const handleQuantityChange = useCallback((id: number, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      if (newQuantity === 0) {
        removeItem(id);
        toast({
          title: 'Item Removed',
          description: 'Product quantity set to zero, item removed.',
          status: 'info',
          duration: 1500,
          isClosable: true,
          position: 'top-right',
        });
      } else {
        updateItemQuantity(id, newQuantity);
        toast({
          title: 'Quantity Updated',
          description: 'Product quantity in cart has been updated.',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'top-right',
        });
      }
    }
  }, [removeItem, updateItemQuantity, toast]);

  const handleClearCart = useCallback(() => {
    clearCart();
    toast({
      title: 'Cart Cleared',
      description: 'Your cart has been completely cleared.',
      status: 'warning',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  }, [clearCart, toast]);

  const itemsToRender = localCartItems;

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Your Shopping Cart
      </Heading>

      {/* This alert is always relevant for the "Starter Launch" */}
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          You are currently Browse as a guest. Your cart is saved locally in your browser.
          {/*
            NOTE: As per previous instructions, I'm keeping these links as placeholders,
            assuming the login/signup pages themselves are not yet fully removed,
            even if authentication functionality is not enabled.
          */}
          {' '}
          <Link href="/auth/login" passHref>
            <ChakraLink color="blue.600" fontWeight="bold">Login</ChakraLink>
          </Link>
          {' '}or{' '}
          <Link href="/auth/signup" passHref>
            <ChakraLink color="blue.600" fontWeight="bold">Sign Up</ChakraLink>
          </Link>
          {' '}to permanently save your cart and access order history (feature coming soon!).
        </AlertDescription>
      </Alert>

      {/* No error state for backend calls as they are removed */}
      {/* {isError && (
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" borderRadius="lg" boxShadow="md" mb={6}>
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load cart</Heading>
          <AlertDescription maxWidth="sm">
            {error?.message || 'An unexpected error occurred while fetching your cart.'}
            <br />
            Please ensure your Django backend is running and reachable.
            <br />
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cart', currentSessionKey] })} mt={4} colorScheme="brand">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )} */}

      {itemsToRender.length === 0 && ( // Removed isLoading and isFetching from condition
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
                    src={item.image_file || "https://placehold.co/100x100?text=No+Image"}
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
                      // Removed isDisabled from mutation.isPending
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
                    // Removed isLoading and isDisabled from mutation.isPending
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
              // Removed isLoading and isDisabled from mutation.isPending
              isDisabled={itemsToRender.length === 0} // Only disabled if no items
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
              onClick={handleInquireViaWhatsApp}
              isDisabled={itemsToRender.length === 0}
              mt={4}
            >
              Inquire via WhatsApp
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
