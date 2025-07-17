// frontend/my-app/src/api/products.ts
import apiClient from '../lib/apiClient';
import { PaginatedProductsResponse, Product } from '../types/product';


// --- API Functions ---

/**
 * Fetches a list of all products from the Django backend.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const data = await apiClient<PaginatedProductsResponse>('products/', { method: 'GET' });
    return data.results.map(product => ({
        ...product,
        id: Number(product.id) // Explicitly convert id to number
    }));
  } catch (error) {
    console.error("API: Failed to fetch products:", error);
    return []; // Return empty array on error
  }
}

/**
 * Fetches a single product by its ID from the Django backend.
 */
export async function fetchProductById(
  id: number // FIX: Changed id type to number
): Promise<Product> {
  try {
    const data = await apiClient<Product>(`products/${id}/`, { method: 'GET' });
    return {
        ...data,
        id: Number(data.id)
    };
  } catch (error) {
    console.error(`API: Failed to fetch product ${id}:`, error);
    throw error;
  }
}

