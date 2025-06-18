// /var/www/ltronix-shop/frontend/my-app/src/api/products.ts

// Define your Django backend API base URL
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// Define a simple type for your product (adjust according to your Django model's serializer output)
export interface Product {
  id: number;
  name: string;
  price: string; // Django DecimalField might come as string
  description: string;
  image_url: string; // Assuming Django provides a direct URL to the image (e.g., from MEDIA_URL)
  category?: string;
  stock?: number;
  // Add other product fields as per your Django serializer
}

/**
 * Fetches a list of all products from the Django backend.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // You might add authentication headers here if your products API requires authentication
      // e.g., 'Authorization': `Bearer ${accessToken}` if you get the token from NextAuth session
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
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/${id}/`, {
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
