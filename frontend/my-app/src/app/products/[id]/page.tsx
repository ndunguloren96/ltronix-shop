// frontend/my-app/src/app/products/[id]/page.tsx
import React from 'react';
import {
  Container,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { notFound } from 'next/navigation';
// FIX: Import Product interface directly from src/types/product.ts
import { Product } from '../../../types/product'; // Corrected import path for Product
import { fetchProductById } from '../../../api/products'; // Only import the function from api/products
import ProductDetailClientContent from './client_content';

// FIX: Removed duplicate Product interface definition here.
// It is now imported from '../../../types/product.ts'.

// Define the resolved params type
interface ResolvedProductDetailPageParams {
  id: string; // Next.js dynamic routes capture IDs as strings
}

// Define the component's props type, where params and searchParams are Promises
interface ProductDetailPageProps {
  params: Promise<ResolvedProductDetailPageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Product detail page component.
 * This component fetches and displays the details of a single product.
 * @param params - The route parameters, containing the product ID.
 * @param searchParams - The search parameters.
 * @returns The product detail page component.
 */
export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  // Await params to get the actual object
  const resolvedParams = await params;
  const productIdString = resolvedParams.id; // It comes as a string from the URL

  // FIX: Convert productId to a number before passing it to fetchProductById
  const productId = Number(productIdString);

  let product: Product | null = null;
  let error: Error | null = null;

  try {
    product = await fetchProductById(productId); // fetchProductById now expects a number
  } catch (err) {
    console.error(`Error fetching product ${productId}:`, err);
    error = err as Error;
  }

  if (!product || error) {
    if (error && error.message.includes('404')) {
      notFound();
    }
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
      <ProductDetailClientContent product={product} />
    </Container>
  );
}