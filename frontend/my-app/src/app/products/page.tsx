// frontend/my-app/src/app/products/page.tsx
import React from 'react';
import ProductsClientPage from './client_page'; // Import the client component

// This is the Server Component for the Products page
/**
 * Products server page component.
 * This component renders the products page of the application.
 * @returns The products page component.
 */
export default function ProductsServerPage() {

  return (
      <ProductsClientPage />
  );
}