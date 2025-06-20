// frontend/my-app/src/api/products.ts

// Define your Django backend API base URL
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// Define a simple type for your product (adjust according to your Django model's serializer output)
export interface Product {
  id: number; // Django DecimalField might come as string
  name: string;
  price: string; // Django DecimalField might come as string
  description: string;
  image_url: string; // Assuming Django provides a direct URL to the image (e.g., from MEDIA_URL)
  category?: string;
  stock?: number;
  brand?: string;
  // Add other product fields as per your Django serializer
}

/**
 * Fetches a list of all products from the Django backend.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    // CRITICAL FIX: Corrected the endpoint URL to access the actual product list
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/`, { // <-- Added '/products/' here
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API Error fetching products (Status: ${response.status}):`, errorData);
      throw new Error(`Failed to fetch products: ${JSON.stringify(errorData)}`);
    }

    const data: Product[] = await response.json();
    return data;
  } catch (error) {
    console.error('Network or unexpected error fetching products:', error);
    throw error; // Re-throw the error for TanStack Query to catch
  }
}

/**
 * Fetches a single product by its ID from the Django backend.
 */
export async function fetchProductById(id: number | string): Promise<Product> {
  try {
    // CRITICAL FIX: Corrected the endpoint URL for single product fetch as well
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/${id}/`, { // <-- Added '/products/' here
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API Error fetching product ${id} (Status: ${response.status}):`, errorData);
      throw new Error(`Failed to fetch product ${id}: ${JSON.stringify(errorData)}`);
    }

    const data: Product = await response.json();
    return data;
  } catch (error) {
    console.error(`Network or unexpected error fetching product ${id}:`, error);
    throw error;
  }
}
