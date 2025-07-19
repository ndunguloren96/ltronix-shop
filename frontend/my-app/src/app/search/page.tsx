// src/app/search/page.tsx
'use client'; // This is a client component

import React, { useState, useEffect, useMemo, Suspense } from 'react'; // Added Suspense
import { useSearchParams } from 'next/navigation'; // For reading URL query parameters
import {
  Heading,
  Text,
  SimpleGrid,
  Container,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Box // Added Box for fallback to provide dimensions
} from '@chakra-ui/react';
import Fuse from 'fuse.js'; // Import Fuse.js
import { ProductCard } from '../../components/ProductCard';
import { Product, fetchProducts as fetchAllProductsAPI } from '@/api/products';


// Extracted the core search logic into a new component
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q'); // Get the 'q' parameter from the URL

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchAllProductsAPI();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products for search:', err);
        setError('Failed to load products for search. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const fuse = useMemo(() => {
    const options = {
      keys: ['name', 'description', 'category', 'brand'],
      includeScore: true,
      threshold: 0.4,
    };
    return new Fuse(products, options);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
      return [];
    }
    if (!products.length) {
      return [];
    }
    const results = fuse.search(searchQuery);
    return results.map(result => result.item);
  }, [searchQuery, products, fuse]);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text ml={4}>Loading products...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={10}>
        <Alert status="error" width="auto">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={6}>
        Search Results for "{searchQuery}"
      </Heading>

      {filteredProducts.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              image_file={product.image_file}
              price={product.price.toString()}
              stock={product.stock}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Center py={10}>
          <Text fontSize="xl" color="gray.600">
            No products found for &quot;{searchQuery}&quot;. Try a different search term.
          </Text>
        </Center>
      )}
    </Container>
  );
}


export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text ml={4}>Loading search results...</Text>
      </Center>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
