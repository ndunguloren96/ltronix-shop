// src/app/products/page.tsx
import React from 'react';
// Removed direct Chakra UI imports like Flex, Spinner, Alert, etc. as they are now in NoProductsMessage
import ProductsClientPage, { Product } from './client_page'; // Import the client component and its Product type
import NoProductsMessage from './no-products-message'; // Import the new client component for error/empty state
import { notFound } from 'next/navigation'; // For handling 404s

// Function to fetch products from your Django API
async function getProducts(): Promise<Product[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

    // Fetch options for Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
    const res = await fetch(`${apiUrl}/products/`, {
      next: { revalidate: 60 }, // Revalidate data every 60 seconds (ISR)
      // Removed 'cache: no-store' as it conflicts with 'revalidate'.
      // When 'revalidate' is present, 'cache: force-cache' is often implied for build time,
      // or default cache behavior applies, and 'no-store' would override caching.
      // For ISR, we want it to cache and revalidate periodically, so 'no-store' is incorrect.
    });

    if (!res.ok) {
      if (res.status === 404) {
        // If the API endpoint itself returns 404, throw notFound
        notFound();
      }
      console.error(`Failed to fetch products: ${res.status} ${res.statusText}`);
      // Throwing an error here will cause the boundary to catch it or Next.js to display its error.
      // Returning an empty array and letting NoProductsMessage handle is also an option.
      return []; // Return empty array to trigger NoProductsMessage component
    }

    const products: Product[] = await res.json();
    return products;
  } catch (error) {
    console.error('Error fetching products in getProducts (server component):', error);
    // On hard failure, return empty to display the NoProductsMessage
    return [];
  }
}

// This is a Server Component
export default async function ProductsServerPage() {
  const products = await getProducts();

  // If no products are found (either from backend or API error), display the client message component
  if (!products || products.length === 0) {
    return <NoProductsMessage />; // Render the dedicated Client Component
  }

  // Pass the fetched products to the main products client component
  return <ProductsClientPage initialProducts={products} />;
}