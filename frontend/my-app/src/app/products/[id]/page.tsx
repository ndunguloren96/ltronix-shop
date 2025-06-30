// frontend/my-app/src/app/products/[id]/page.tsx
// This is a Server Component

import React from 'react';
import {
  Box,
  Container,
  Spinner, // Chakra components for loading/error states on server
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { notFound } from 'next/navigation';
import { fetchProductById } from '../../../api/products'; // Path to your product API functions
import ProductDetailClientContent from './client_content'; // Import the new client component

// Define the Product interface (should match your backend Product model's serializer output)
interface Product {
  id: string; // Django PK/ID, ensure it's treated as a string for consistency
  name: string;
  description: string;
  price: string; // Django DecimalField often comes as a string in JSON
  digital: boolean;
  image_url?: string; // Optional image URL from Django
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string; // From DecimalField, might be string (e.g., "4.50")
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id;
  let product: Product | null = null;
  let error: Error | null = null;

  try {
    product = await fetchProductById(productId);
  } catch (err) {
    console.error(`Error fetching product ${productId}:`, err);
    error = err as Error;
    // If product is not found (e.g., 404 from API), Next.js `notFound()` can be used
    // However, we'll show an error message instead of 404 for API errors that aren't strict "not found".
    // If you want a hard 404 for missing products:
    // if (err && (err as any).message?.includes('404')) {
    //   notFound();
    // }
  }

  // Handle product not found or API error
  if (!product || error) {
    // If the error explicitly indicates not found, use Next.js notFound()
    if (error && error.message.includes('404')) {
      notFound();
    }
    // Otherwise, display a general error message
    return (
      <Center minH="80vh" p={4}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          boxShadow="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Failed to Load Product
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error?.message || `Could not load product with ID: ${productId}. Please try again later.`}
          </AlertDescription>
        </Alert>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Pass the fetched product data to the client component */}
      <ProductDetailClientContent product={product} />
    </Container>
  );
}
