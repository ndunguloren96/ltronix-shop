
// src/app/search/client_page.tsx
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
// CRITICAL FIX: Changed import path to a relative path for better module resolution.
// Given your project structure: frontend/my-app/src/app/search/page.tsx
// to reach: frontend/my-app/src/components/ProductCard.tsx
import { ProductCard } from '../../components/ProductCard';
// FIX: Import the Product interface from '@/types/product'
import { Product } from '@/types/product'; // Corrected import path for Product
// Import fetchProducts function from your API file
import { fetchProducts as fetchAllProductsAPI } from '@/api/products';


// FIX: Removed duplicate Product interface definition here.
// It is now imported from '@/types/product'.

export default function SearchResultsClientPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q'); // Get the 'q' parameter from the URL

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // FIX: Use the centralized fetchProducts function from '@/api/products'
        // This function already handles the base URL, pagination, and returns Product[] with number IDs.
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
  }, []); // Empty dependency array means this runs once on mount

  // Memoize Fuse.js instance and search results to prevent re-creation on every render
  const fuse = useMemo(() => {
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
            <ProductCard
              key={product.id}
              id={product.id} // This is now correctly a number
              name={product.name}
              description={product.description}
              image_url={product.image_url}
              price={product.price.toString()} // Price is a number in Product, convert to string for ProductCard
              stock={product.stock} // Assuming stock is available on the Product type
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
