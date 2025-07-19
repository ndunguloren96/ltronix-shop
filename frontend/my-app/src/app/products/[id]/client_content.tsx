// frontend/my-app/src/app/products/[id]/client_content.tsx
'use client'; // This directive makes this a Client Component

import React, { useCallback } from 'react'; // Added useCallback
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
import Link from 'next/link';

// Define the Product interface locally to use image_file, consistent with backend
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  digital: boolean;
  image_file?: string; // Changed to image_file
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string; // From DecimalField, might be string
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

// Define the ProductInCart interface here, as it's no longer imported from '@/api/orders'
interface ProductInCart {
  id: number;
  name: string;
  price: number; // Stored as number in Zustand
  quantity: number;
  image_file?: string;
}


interface ProductDetailClientContentProps {
  product: Product;
}

export default function ProductDetailClientContent({ product }: ProductDetailClientClientContentProps) {
  const toast = useToast();
  // Removed: const queryClient = useQueryClient(); // Not needed as no backend calls

  const [quantity, setQuantity] = React.useState(1);
  // Replaced localCartItems and setLocalCartItems with Zustand actions
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const findItemById = useCartStore((state) => state.findItemById);

  const guestSessionKey = useCartStore((state) => state.guestSessionKey);
  const setGuestSessionKey = useCartStore((state) => state.setGuestSessionKey);

  // This useEffect ensures a guestSessionKey exists on page load for local storage persistence
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !guestSessionKey) {
      import('uuid').then(({ v4: uuidv4 }) => {
        setGuestSessionKey(uuidv4());
        // No toast needed here, as it's just initializing local session.
        // It might be confusing if they see a toast for "initializing guest session" repeatedly.
      });
    }
  }, [guestSessionKey, setGuestSessionKey]); // Removed toast from dependencies as it's not called


  const formatPrice = useCallback((priceString: string): string => {
    const numericPrice = parseFloat(priceString);
    if (isNaN(numericPrice)) {
      return priceString;
    }
    return `KES ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const priceAsNumber = parseFloat(product.price);

  // Removed addToCartMutation as it directly interacts with backend API
  // All cart updates will now go directly to Zustand store.

  const handleAddToCart = useCallback(() => {
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

    const existingLocalItem = findItemById(product.id);

    if (existingLocalItem) {
      // If item exists, update its quantity in the store
      updateItemQuantity(product.id, existingLocalItem.quantity + quantity);
    } else {
      // If item does not exist, add it to the cart
      addItem({
        id: Number(product.id),
        name: product.name,
        price: priceAsNumber,
        quantity: quantity,
        image_file: product.image_file,
      });
    }

    toast({
      title: 'Item Added/Updated',
      description: `"${product.name}" added to your cart.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [quantity, product, priceAsNumber, findItemById, addItem, updateItemQuantity, toast]);

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
            <InputGroup size="lg" maxWidth="150px">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                onBlur={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} // Ensure valid number on blur
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
              // Removed isLoading/isDisabled from mutation as there is no mutation
              isDisabled={product.stock <= 0} // Only disabled by stock now
            >
              {product.stock > 0 ? 'Add to cart' : 'Out of Stock'}
            </Button>
          </HStack>

          {/* This section now refers to "guest" instead of "unauthenticated" for clarity */}
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
            to permanently save your cart and access order history (feature coming soon!).
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
