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
  Input,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import Image from 'next/image';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import { useCartStore } from '@/store/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Removed: import { useSession } from 'next-auth/react'; // No longer needed
// Removed: import Link from 'next/link'; // No longer needed as auth links are removed

// Define base URL for your Django API (Moved from orders.ts)
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1';

// --- Type Definitions for Cart/Order Operations (Moved from orders.ts) ---
export interface ProductInCart {
  id: number; // Product ID
  name: string;
  price: number;
  quantity: number;
  image_file?: string;
}

export interface OrderItemPayload {
  id?: number;
  product_id: number;
  quantity: number;
}

export interface OrderPayload {
  items: OrderItemPayload[];
  complete?: boolean;
  transaction_id?: string;
}

export interface BackendOrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: string; // Price from backend is a string
    image_file?: string;
  };
  quantity: number;
  get_total: string;
}

export interface BackendOrder {
  id: number | null; // Can be null for newly created guest carts
  customer: number | null;
  session_key: string | null; // Important for guest carts
  date_ordered: string;
  complete: boolean;
  transaction_id: string | null;
  get_cart_total: string;
  get_cart_items: number;
  shipping: boolean;
  items: BackendOrderItem[];
}

// --- Helper for API calls (Moved from orders.ts) ---
async function fetchWithSession(url: string, options?: RequestInit, guestSessionKey?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (guestSessionKey) {
    headers['X-Session-Key'] = guestSessionKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = 'An unknown error occurred.';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorDetail = errorData.detail;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorDetail = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorDetail = errorData;
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
    }
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorDetail}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// --- API Functions for Cart (via Order endpoint) (Moved from orders.ts) ---

/**
 * Adds a product to the cart or updates its quantity by sending the entire cart state.
 * @param cartItems The current desired state of cart items.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The updated BackendOrder (cart).
 */
export async function updateEntireCartAPI(cartItems: ProductInCart[], guestSessionKey?: string | null): Promise<BackendOrder> {
  const payload: OrderPayload = {
    items: cartItems.map(item => ({
      product_id: Number(item.id),
      quantity: item.quantity,
    })),
  };

  const url = new URL('orders/', DJANGO_API_BASE_URL);
  const response = await fetchWithSession(url.toString(), {
    method: 'POST',
    body: JSON.stringify(payload),
  }, guestSessionKey);
  return response;
}


// FIX: Define the Product interface locally to use image_file, consistent with backend
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  digital: boolean;
  image_file?: string;
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

interface ProductDetailClientContentProps {
  product: Product;
}

export default function ProductDetailClientContent({ product }: ProductDetailClientContentProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = React.useState(1);
  const localCartItems = useCartStore((state) => state.items);
  const setLocalCartItems = useCartStore((state) => state.setItems);
  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !guestSessionKey) {
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
  }, [guestSessionKey, setGuestSessionKey, toast]);


  const formatPrice = (priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceAsNumber = parseFloat(product.price);

  const addToCartMutation = useMutation<BackendOrder, Error, ProductInCart[], { previousCart?: BackendOrder }>({
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
          customer: null,
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
    if (!guestSessionKey) {
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

    addToCartMutation.mutate(updatedLocalCartItems);
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
            <HStack>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  color={i < Math.floor(parseFloat(product.rating || '0')) ? 'gold.500' : 'gray.300'}
                />
              ))}
              <Text fontSize="sm" color="gray.600">({product.reviews_count} reviews)</Text>
            </HStack>
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
            <InputGroup size="lg" maxWidth="150px">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                onBlur={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Qty"
                textAlign="center"
              />
              <InputRightElement width="4.5rem">
              </InputRightElement>
            </InputGroup>
            <Button
              colorScheme="brand"
              size="lg"
              flex={1}
              onClick={handleAddToCart}
              isLoading={addToCartMutation.isPending}
              isDisabled={addToCartMutation.isPending || product.stock <= 0}
            >
              {addToCartMutation.isPending ? 'Adding...' : (product.stock > 0 ? 'Add to cart' : 'Out of Stock')}
            </Button>
          </HStack>

          <Text fontSize="sm" color="gray.500" mt={2}>
            You are currently Browse as a guest. Your cart will be saved locally.
          </Text>


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

