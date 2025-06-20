// frontend/my-app/src/components/ProductCard.tsx
'use client';

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Stack,
  Divider,
  Link as ChakraLink,
  useToast,
} from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';

import { useCartStore } from '@/store/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEntireCartAPI, BackendOrder, ProductInCart } from '@/api/orders';
import { useSession } from 'next-auth/react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  price,
}) => {
  const toast = useToast();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  // Get guestSessionKey from Zustand store
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey); // To set new key if backend returns one

  // Zustand actions and state for local cart (for optimistic updates)
  const getLocalCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems); // Assuming you added this in useCartStore

  // TanStack Query mutation for adding/updating cart on the backend
  const addToCartMutation = useMutation<BackendOrder, Error, ProductInCart[], unknown>({
    // Pass the guestSessionKey to the mutationFn
    mutationFn: (items) => updateEntireCartAPI(items, guestSessionKey),
    onMutate: async (newCartItems: ProductInCart[]) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<BackendOrder>(['cart']);

      queryClient.setQueryData<BackendOrder>(['cart'], (oldCart) => {
        const updatedBackendItems: BackendOrderItem[] = newCartItems.map(item => ({
          id: oldCart?.items.find(pi => pi.product.id === item.id)?.id || Math.random(),
          product: {
            id: item.id,
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
        // For a completely new cart (e.g., first item added by guest)
        return {
          id: null, // Backend will assign ID, use null or dummy for optimistic
          customer: null, // Null for guest
          session_key: guestSessionKey, // Include guest session key for optimistic updates
          date_ordered: new Date().toISOString(),
          complete: false,
          transaction_id: null,
          get_cart_total: newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
          get_cart_items: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
          shipping: false,
          items: updatedBackendItems,
        } as BackendOrder;
      });

      setLocalCartItems(newCartItems); // Optimistically update Zustand for immediate UI feedback

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
            quantity: bi.quantity, image_url: bi.product.image_url
        })));
      } else {
        setLocalCartItems([]);
      }
    },
    onSettled: async (data, error, variables, context) => {
        // If the mutation was successful and a session_key was returned by Django (for first guest cart creation)
        if (data && data.session_key && !guestSessionKey) {
            setGuestSessionKey(data.session_key); // Update Zustand/localStorage with the key from backend
            console.log("Guest session key received from backend and set:", data.session_key);
        }
        queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: (data) => {
      // On successful backend update, ensure Zustand matches the actual backend state
      const transformedItems: ProductInCart[] = data.items.map(backendItem => ({
        id: backendItem.product.id,
        name: backendItem.product.name,
        price: parseFloat(backendItem.product.price),
        quantity: backendItem.quantity,
        image_url: backendItem.product.image_url,
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
    // If not authenticated and no guestSessionKey, generate one locally first
    // The useEffect in client_content.tsx and the persist middleware in useCartStore
    // should already handle initial generation.
    if (status === 'unauthenticated' && !guestSessionKey) {
        // This case should be rare, but if it happens, trigger generation and re-call
        // This is a safety net; the useEffect in client_content.tsx for instance should set it up.
        const { v4: uuidv4 } = require('uuid');
        const newKey = uuidv4();
        setGuestSessionKey(newKey);
        // A toast might be good here to inform the user about guest session initialization.
        toast({
            title: 'Initializing Guest Session',
            description: 'Creating a temporary session for your cart. Please try adding to cart again.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    const priceAsNumber = parseFloat(price); // Parse price here as it's used directly

    const itemToAddOrUpdate: ProductInCart = {
      id: id,
      name: name,
      price: priceAsNumber,
      quantity: 1, // Always add one at a time for this button
      image_url: imageUrl,
    };

    const currentLocalCartItems = getLocalCartItems();

    const existingLocalItem = currentLocalCartItems.find(item => item.id === id);

    let updatedLocalCartItems: ProductInCart[];
    if (existingLocalItem) {
      updatedLocalCartItems = currentLocalCartItems.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedLocalCartItems = [...currentLocalCartItems, { ...itemToAddOrUpdate, quantity: 1 }];
    }

    // Trigger the mutation to sync with the backend
    addToCartMutation.mutate(updatedLocalCartItems);
  };

  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine if the button should be disabled for general loading or out of stock
  const isButtonDisabled = addToCartMutation.isPending || status === 'loading' || parseFloat(product.stock) <= 0;

  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white">
      <ChakraLink as={NextLink} href={`/products/${id}`} passHref>
        <Box position="relative" height="200px" width="100%" display="block" _hover={{ cursor: 'pointer', opacity: 0.9 }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <Box height="200px" width="100%" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.500">No Image</Text>
            </Box>
          )}
        </Box>
      </ChakraLink>

      <Box p={6}>
        <Stack spacing={3}>
          <ChakraLink as={NextLink} href={`/products/${id}`} passHref>
            <Heading size="md" noOfLines={1} _hover={{ textDecoration: 'underline' }}>{name}</Heading>
          </ChakraLink>
          <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
          <Text color="brand.600" fontSize="2xl" fontWeight="bold">
            {formatPrice(price)}
          </Text>
        </Stack>
      </Box>

      <Divider />

      <Box p={6}>
        <Button
          variant='solid'
          colorScheme='brand'
          width="full"
          onClick={handleAddToCart}
          isLoading={addToCartMutation.isPending || status === 'loading'}
          isDisabled={isButtonDisabled} // Use the combined disabled state
        >
          {addToCartMutation.isPending ? 'Adding...' : (parseFloat(product.stock) > 0 ? 'Add to cart' : 'Out of Stock')}
        </Button>
      </Box>
    </Box>
  );
};
