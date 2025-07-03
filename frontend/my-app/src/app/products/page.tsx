// frontend/my-app/src/app/products/page.tsx
// This is a Server Component, indicated by the absence of 'use client'

import React from 'react';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'; // For server-side query features
import ProductsClientPage from './client_page'; // Import the client component
import NoProductsMessage from './no-products-message'; // Import the client component for error/empty state
import { notFound } from 'next/navigation';
import { fetchProducts, Product } from '../../api/products'; // <<-- CORRECTED PATH HERE -->>

// This function now specifically fetches data for the server component
// It can be directly called here without useQuery.
/*
async function getProductsForServer(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/products/`, {
      next: { revalidate: 60 }, // Revalidate data every 60 seconds (ISR)
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound(); // If the API endpoint itself returns 404, throw notFound
      }
      console.error(`Failed to fetch products from Django API: ${res.status} ${res.statusText}`);
      return []; // Return empty array to trigger NoProductsMessage component
    }

    const products: Product[] = await res.json();
    return products;
  } catch (error) {
    console.error('Error fetching products in getProductsForServer (server component):', error);
    return []; // On hard failure, return empty to display the NoProductsMessage
  }
}
*/

// This is the Server Component for the Products page
export default async function ProductsServerPage() {
  const queryClient = new QueryClient(); // Create a new QueryClient instance for each request on the server

  let products: Product[] = [];
  try {
    // Prefetch the products data into the QueryClient cache on the server
    products = await queryClient.fetchQuery({
      queryKey: ['products'], // This MUST match the queryKey used in ProductsClientPage
      queryFn: fetchProducts, // Use the same fetcher function as on the client
    });
  } catch (error) {
    console.error('Server-side prefetch of products failed:', error);
    products = []; // If prefetching fails, render no products, client will retry
  }

  if (!products || products.length === 0) {
    return <NoProductsMessage />;
  }

  return (
    // HydrationBoundary passes the server-prefetched data to the client-side cache
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsClientPage /> {/* No need to pass initialProducts now, useQuery gets it from cache */}
    </HydrationBoundary>
  );
}
