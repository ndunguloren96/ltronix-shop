// frontend/my-app/src/app/products/[id]/client_content.tsx
'use client'; // This directive makes this a Client Component

import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Button,
  Divider,
  HStack,
  VStack,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import Image from 'next/image';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import { useCartStore } from '@/store/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Import createOrUpdateCart from '@/api/cart'
import { createOrUpdateCart } from '@/api/cart';
// Import types from src/types/order.ts and src/types/product.ts
import { BackendOrder, ProductInCart, BackendOrderItem, CartItemBackend, BackendCartResponse } from '@/types/order'; // Ensure CartItemBackend is imported
import { Product } from '@/types/product'; // Import Product interface from types/product.ts

import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * Interface for the ProductDetailClientContent component props.
 */
interface ProductDetailClientContentProps {
  product: Product;
}

/**
 * Client-side component for the product detail page.
 * This component handles adding products to the cart and displaying product details.
 * @param product - The product to be displayed.
 * @returns The product detail client content component.
 */
export default function ProductDetailClientContent({ product }: ProductDetailClientContentProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  const [quantity, setQuantity] = React.useState(1);
  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  // This useEffect ensures a guestSessionKey exists on page load if unauthenticated
  React.useEffect(() => {
    if (typeof window !== 'undefined' && status === 'unauthenticated' && !guestSessionKey) {
      import('uuid').then(({ v4: uuidv4 }) => {
        setGuestSessionKey(uuidv4());
        toast({
          title: 'Initializing Guest Session',
          description: 'Creating a temporary session for your cart.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      });
    }
  }, [guestSessionKey, setGuestSessionKey, status, toast]);

  /**
   * Formats a price string to a currency string.
   * @param priceString - The price string to format.
   * @returns The formatted price string.
   */
  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceAsNumber = parseFloat(product.price);

  const addToCartMutation = useMutation<BackendCartResponse, Error, ProductInCart[], { previousCart?: BackendCartResponse }>({
    // mutationFn expects ProductInCart[], but createOrUpdateCart expects CartItemBackend[]
    // So, we map ProductInCart[] to CartItemBackend[] here.
    mutationFn: (items) => createOrUpdateCart(
      items.map(item => ({ product_id: item.id, quantity: item.quantity })),
      guestSessionKey
    ),
    onMutate: async (newCartItems: ProductInCart[]) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<BackendCartResponse>(['cart']);

      queryClient.setQueryData<BackendCartResponse>(['cart'], (oldCart) => {
        const updatedBackendItems: BackendOrderItem[] = newCartItems.map(item => ({
          id: oldCart?.orders[0]?.items.find(pi => pi.product.id === item.id)?.id || Math.random(), // Keep Math.random() for temporary client-side ID
          product: {
            id: item.id, // This `item.id` is already a number from ProductInCart
            name: item.name,
            price: item.price.toFixed(2),
            image_url: item.image_url,
          },
          quantity: item.quantity,
          get_total: (item.price * item.quantity).toFixed(2),
        }));

        if (oldCart) {
          return {
            ...oldCart,
            items: updatedBackendItems,
            get_cart_items: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
            get_cart_total: newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
          };
        }
        return {
          id: null,
          customer: session?.user?.id ? parseInt(session.user.id) : null,
          session_key: guestSessionKey,
          message: "Cart created/updated successfully",
          orders: [
            {
              id: null,
              customer: session?.user?.id ? parseInt(session.user.id) : null,
              session_key: guestSessionKey,
              date_ordered: new Date().toISOString(),
              complete: false,
              transaction_id: null,
              get_cart_total: newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
              get_cart_items: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
              shipping: false,
              items: updatedBackendItems,
            },
          ],
        } as BackendCartResponse;
      });

      setLocalCartItems(newCartItems);

      return { previousCart };
    },
    onError: (err, newCartItems, context) => {
      console.error("Failed to update cart on backend:", err);
      toast({
        title: 'Error Adding to Cart',
        description: err.message || 'Failed to add item to cart on server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      queryClient.setQueryData(['cart'], context?.previousCart);
      if (context?.previousCart && context.previousCart.orders && context.previousCart.orders.length > 0 && context.previousCart.orders[0].items) {
        setLocalCartItems(context.previousCart.orders[0].items.map(bi => ({
            id: bi.product.id, name: bi.product.name, price: parseFloat(bi.product.price),
            quantity: bi.quantity, image_url: bi.product.image_url
        })));
      } else {
        setLocalCartItems([]);
      }
    },
    onSettled: async (data, _error, _variables, _context) => {
        if (data && data.session_key && !guestSessionKey) {
            setGuestSessionKey(data.session_key);
            console.log("Guest session key received from backend and set:", data.session_key);
        }
        queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: (data) => {
      // Ensure data.orders exists and has at least one element
      if (data.orders && data.orders.length > 0) {
        const transformedItems: ProductInCart[] = data.orders[0].items.map(backendItem => ({
          id: backendItem.product.id,
          name: backendItem.product.name,
          price: parseFloat(backendItem.product.price),
          quantity: backendItem.quantity,
          image_url: backendItem.product.image_url,
        }));
        setLocalCartItems(transformedItems);
      } else {
        // If no orders or items are returned, clear the local cart
        setLocalCartItems([]);
      }

      toast({
        title: 'Item Added/Updated',
        description: 'Your cart has been updated.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    },
  });

  const handleAddToCart = () => {
    if (status === 'unauthenticated' && !guestSessionKey) {
      toast({
            title: 'Initializing Guest Session',
            description: 'Creating a temporary session for your cart. Please try adding to cart again.',
            status: 'info',
            duration: 3000,
            isClosable: true,
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than zero.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      toast({
        title: 'Out of Stock',
        description: `Only ${product.stock} units available.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const itemToAddOrUpdate: ProductInCart = {
      id: Number(product.id),
      name: product.name,
      price: priceAsNumber,
      quantity: quantity,
      image_url: product.image_url,
    };

    const currentLocalCartItems = localCartItems;

    const existingLocalItem = currentLocalCartItems.find(item => item.id === itemToAddOrUpdate.id);

    let updatedLocalCartItems: ProductInCart[];
    if (existingLocalItem) {
      updatedLocalCartItems = currentLocalCartItems.map(item =>
        item.id === itemToAddOrUpdate.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updatedLocalCartItems = [...currentLocalCartItems, { ...itemToAddOrUpdate, quantity: quantity }];
    }

    // FIX: Pass updatedLocalCartItems directly, as addToCartMutation expects ProductInCart[]
    addToCartMutation.mutate(updatedLocalCartItems);
  };

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Product Image */}
        <Box flex={{ base: 'none', md: '1' }} maxW={{ base: 'full', md: '50%' }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={500}
              height={500}
              style={{ objectFit: 'contain' }}
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={true}
            />
          ) : (
            <Box w="100%" h="500px" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>

        {/* Product Details */}
        <VStack align="flex-start" flex={{ base: 'none', md: '1' }} spacing={4}>
          <Heading as="h1" size="xl">
            {product.name}
          </Heading>

          <HStack spacing={2}>
            {/* Display rating with StarIcon */}
            <HStack>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  color={i < Math.floor(parseFloat(product.rating || '0')) ? 'gold.500' : 'yellow.200'}
                />
              ))}
              <Text fontSize="sm" color="gray.600">({product.reviews_count} reviews)</Text>
            </HStack>
            {/* Stock status */}
            <Badge
              colorScheme={product.stock > 0 ? 'green' : 'red'}
              ml={2}
            >
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </Badge>
          </HStack>

          <Text fontSize="3xl" fontWeight="bold" color="brand.600">
            {formatPrice(product.price)}
          </Text>

          <Text fontSize="lg" color="gray.700">
            {product.description}
          </Text>

          <Divider />

          <VStack align="flex-start" width="full">
            <HStack>
              <Text fontWeight="semibold">Brand:</Text>
              <Text>{product.brand || 'N/A'}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="semibold">Category:</Text>
              <Text>{product.category || 'N/A'}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="semibold">SKU:</Text>
              <Text>{product.sku || 'N/A'}</Text>
            </HStack>
          </VStack>

          <Divider />

          <HStack width="full">
            <NumberInput
              size="lg"
              maxWidth="150px"
              value={quantity}
              min={1}
              onChange={(valueString) => setQuantity(parseInt(valueString) || 1)}
              onBlur={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              keepWithinRange={false}
              clampValueOnBlur={false}
            >
              <NumberInputField textAlign="center" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button
              colorScheme="brand"
              size="lg"
              flex={1}
              onClick={handleAddToCart}
              isLoading={addToCartMutation.isPending || status === 'loading'}
              isDisabled={addToCartMutation.isPending || status === 'loading' || product.stock <= 0}
            >
              {addToCartMutation.isPending ? 'Adding...' : (product.stock > 0 ? 'Add to cart' : 'Out of Stock')}
            </Button>
          </HStack>

          {status === 'unauthenticated' && (
            <Text fontSize="sm" color="gray.500" mt={2}>
              You are currently Browse as a guest. Your cart will be saved locally.
              <br/>
              <Link href="/auth/login" passHref>
                <Text as="a" color="brand.500" fontWeight="bold">Login</Text>
              </Link>
              {' '}
              or{' '}
              <Link href="/auth/signup" passHref>
                <Text as="a" color="brand.500" fontWeight="bold">Sign Up</Text>
              </Link>
              {' '}
              to permanently save your cart and access order history.
            </Text>
          )}

          {product.digital && (
            <HStack spacing={2} mt={4}>
              <CheckCircleIcon color="green.500" />
              <Text fontSize="sm" color="gray.600">Digital Product (Instant Download)</Text>
            </HStack>
          )}
        </VStack>
      </Flex>

      {/* Recommended Products Section */}
      <Box mt={10} p={5} borderWidth="1px" borderRadius="lg" boxShadow="sm">
        <Heading as="h2" size="lg" mb={4}>Recommended Products</Heading>
        <Text color="gray.600">Placeholder for recommended products based on this item. (Future Integration)</Text>
      </Box>
    </Box>
  );
}