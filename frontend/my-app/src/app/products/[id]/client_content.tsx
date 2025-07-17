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
import { BackendOrder, ProductInCart, BackendOrderItem, CartItemBackend } from '@/types/order'; // Ensure CartItemBackend is imported
import { Product } from '@/types/product'; // Import Product interface from types/product.ts

import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ProductDetailClientContentProps {
  product: Product;
}

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


  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceAsNumber = parseFloat(product.price);

  const addToCartMutation = useMutation<BackendOrder, Error, ProductInCart[], { previousCart?: BackendOrder }>({
    // FIX: Map ProductInCart[] to CartItemBackend[]
    mutationFn: (items) => createOrUpdateCart(
      items.map(item => ({ product_id: item.id, quantity: item.quantity })),
      guestSessionKey
    ),
    onMutate: async (newCartItems: ProductInCart[]) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart']);

      queryClient.setQueryData<BackendOrder>(['cart'], (oldCart) => {
        const updatedBackendItems: BackendOrderItem[] = newCartItems.map(item => ({
          id: oldCart?.items.find(pi => pi.product.id === item.id)?.id || Math.random(), // Keep Math.random() for temporary client-side ID
          product: {
            id: item.id, // This `item.id` is already a number from ProductInCart
            name: item.name,
            price: item.price.toFixed(2),
            image_file: item.image_file,
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
          date_ordered: new Date().toISOString(),
          complete: false,
          transaction_id: null,
          get_cart_total: newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
          get_cart_items: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
          shipping: false,
          items: updatedBackendItems,
        } as BackendOrder;
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
      if (context?.previousCart) {
        setLocalCartItems(context.previousCart.items.map(bi => ({
            id: bi.product.id, name: bi.product.name, price: parseFloat(bi.product.price),
            quantity: bi.quantity, image_file: bi.product.image_file
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
      const transformedItems: ProductInCart[] = data.items.map(backendItem => ({
        id: backendItem.product.id,
        name: backendItem.product.name,
        price: parseFloat(backendItem.product.price),
        quantity: backendItem.quantity,
        image_file: backendItem.product.image_file,
      }));
      setLocalCartItems(transformedItems);

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
      image_file: product.image_file,
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

    // FIX: Map ProductInCart[] to CartItemBackend[]
    addToCartMutation.mutate(
      updatedLocalCartItems.map(item => ({ product_id: item.id, quantity: item.quantity }))
    );
  };

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Product Image */}
        <Box flex={{ base: 'none', md: '1' }} maxW={{ base: 'full', md: '50%' }}>
          {product.image_file ? (
            <Image
              src={product.image_file}
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
                  color={i < Math.floor(parseFloat(product.rating || '0')) ? 'gold.500' : 'gray.300'}
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
              You are currently browsing as a guest. Your cart will be saved locally.
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

