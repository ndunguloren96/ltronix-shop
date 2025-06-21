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
import { updateEntireCartAPI, BackendOrder, ProductInCart, BackendOrderItem } from '@/api/orders';
import { useSession } from 'next-auth/react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: string;
  stock: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  price,
  stock,
}) => {
  const toast = useToast();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  const getLocalCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);

  const priceAsNumber = parseFloat(price);

  const addToCartMutation = useMutation<BackendOrder, Error, ProductInCart[], unknown>({
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
            quantity: bi.quantity, image_url: bi.product.image_url
        })));
      } else {
        setLocalCartItems([]);
      }
    },
    onSettled: async (data, error, variables, context) => {
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
    if (status === 'unauthenticated' && !guestSessionKey) {
        const { v4: uuidv4 } = require('uuid');
        const newKey = uuidv4();
        setGuestSessionKey(newKey);
        toast({
            title: 'Initializing Guest Session',
            description: 'Creating a temporary session for your cart. Please try adding to cart again.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    const itemToAddOrUpdate: ProductInCart = {
      id: id,
      name: name,
      price: priceAsNumber,
      quantity: 1,
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

    addToCartMutation.mutate(updatedLocalCartItems);
  };

  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isButtonDisabled = addToCartMutation.isPending || status === 'loading' || stock <= 0;

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
              unoptimized={true}
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
          isDisabled={isButtonDisabled}
        >
          {addToCartMutation.isPending ? 'Adding...' : (stock > 0 ? 'Add to cart' : 'Out of Stock')}
        </Button>
      </Box>
    </Box>
  );
};
