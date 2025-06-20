// frontend/my-app/src/app/cart/page.tsx
'use client';

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Image, // Chakra Image
  Divider,
  Flex,
  Spacer,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import React from 'react';
import { useCartStore } from '@/store/useCartStore'; // Import your cart Zustand store
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const toast = useToast();
  const router = useRouter();

  // Get cart state and actions from your Zustand store
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const handleRemoveItem = (id: string) => { // Changed id to string
    removeItem(id);
    toast({
      title: 'Item Removed.',
      description: 'The item has been removed from your cart.',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleQuantityChange = (id: string, value: string) => { // Changed id to string
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      updateItemQuantity(id, newQuantity);
    } else if (newQuantity === 0) {
      // If quantity becomes 0, remove the item
      handleRemoveItem(id);
    }
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Cart Cleared.',
      description: 'All items have been removed from your cart.',
      status: 'warning',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
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
    toast({
      title: 'Proceeding to Checkout',
      description: 'Redirecting you to the checkout page...',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    router.push('/checkout'); // Example: Navigate to a checkout page (you would create this next)
  };

  return (
    <Box p={8} maxWidth="container.xl" mx="auto" minH="80vh">
      <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.700">
        Your Shopping Cart
      </Heading>

      {cartItems.length === 0 ? (
        <VStack spacing={4} textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.600">
            Your cart is currently empty.
          </Text>
          <Button colorScheme="brand" onClick={() => router.push('/products')}>
            Start Shopping
          </Button>
        </VStack>
      ) : (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={10}>
          {/* Cart Items List */}
          <VStack spacing={6} align="stretch" flex={2}>
            {cartItems.map((item) => (
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
                    // CRITICAL FIX: Use item.image_url directly
                    src={item.image_url || "https://placehold.co/100x100?text=No+Image"} // Fallback to a placeholder
                    alt={item.name}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                    // fallbackSrc="https://via.placeholder.com/100?text=No+Image" // Not needed with direct src or Next.js Image
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
                      defaultValue={item.quantity}
                      min={1}
                      onChange={(valueAsString) =>
                        handleQuantityChange(item.id, valueAsString)
                      }
                      keepWithinRange={false}
                      clampValueOnBlur={false}
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
              <Text fontWeight="semibold">{getTotalItems()}</Text>
            </Flex>
            <Flex justifyContent="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="bold">
                Subtotal:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="brand.600">
                Ksh {getTotalPrice().toFixed(2)}
              </Text>
            </Flex>
            <Button colorScheme="green" size="lg" width="full" onClick={handleCheckout}>
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
