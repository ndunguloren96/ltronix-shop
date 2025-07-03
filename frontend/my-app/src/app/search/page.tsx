// src/app/search/page.tsx
'use client'; // This is a client component

import React, { useState, useEffect, useMemo } from 'react';
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
} from '@chakra-ui/react';
import Fuse from 'fuse.js'; // Import Fuse.js
import { ProductCard } from '@/components/ProductCard'; // Assuming this path is correct

// Define a Product type to match your product structure (adjust if needed)
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  imageUrl: string;
  // Add any other fields you want to search through or display
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q'); // Get the 'q' parameter from the URL

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products from your API endpoint
        const response = await fetch('/api/products'); // Adjust this URL if your API is on a different path
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Product[] = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array means this runs once on mount

  // Memoize Fuse.js instance and search results to prevent re-creation on every render
  const fuse = useMemo(() => {
    // Fuse.js options:
    // keys: fields to search within
    // includeScore: returns a score for each match (0 is perfect, 1 is no match)
    // threshold: score at which the match is considered relevant (0.0 is perfect, 1.0 is full match)
    const options = {
      keys: ['name', 'description', 'category', 'brand'], // Fields to search in your product data
      includeScore: true,
      threshold: 0.4, // Adjust this value for stricter/looser search
    };
    return new Fuse(products, options);
  }, [products]); // Re-create fuse instance if products data changes

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
      return []; // No query, no results
    }
    if (!products.length) {
      return []; // No products loaded yet
    }
    // Perform the search using Fuse.js
    const results = fuse.search(searchQuery);
    // Map Fuse.js results back to your Product objects
    return results.map(result => result.item);
  }, [searchQuery, products, fuse]); // Re-filter if query, products, or fuse instance changes

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
            <ProductCard key={product.id} product={product} />
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