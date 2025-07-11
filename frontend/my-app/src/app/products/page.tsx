// frontend/my-app/src/app/products/page.tsx
import React from 'react';
import ProductsClientPage from './client_page'; // Import the client component

// This is the Server Component for the Products page
export default function ProductsServerPage() {

  return (
      <ProductsClientPage />
  );
}
