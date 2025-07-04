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
import { fetchProductById } from '../../../api/products';
import ProductDetailClientContent from './client_content';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  digital: boolean;
  image_url?: string;
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

// Define the resolved params type
interface ResolvedProductDetailPageParams {
  id: string;
}

// Define the component's props type, where params and searchParams are Promises
interface ProductDetailPageProps {
  params: Promise<ResolvedProductDetailPageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  // Await params to get the actual object
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // If you need searchParams, you'd await them too:
  // const resolvedSearchParams = await searchParams;
  // const mySearchParam = resolvedSearchParams?.someKey;
  let product: Product | null = null;
  let error: Error | null = null;

  try {
    product = await fetchProductById(productId);
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
