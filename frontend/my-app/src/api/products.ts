// frontend/my-app/src/api/products.ts

// Define your Django backend API base URL
// IMPORTANT: For WSL2, ensure your Django backend is accessible at this IP.
// If your Django is running on the Windows host, you'll likely need to use
// the Windows machine's IP address that is reachable from WSL2.
// A common pattern is to use the host.docker.internal DNS name if using Docker Desktop,
// or resolve the host's IP address. For direct WSL2 to Windows host communication,
// you often need to find the host's IP address from within WSL2 (e.g., ip route show | grep default).
// For now, we'll keep the default, but be aware this is the primary point of failure.
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// Define a simple type for your product (adjust according to your Django model's serializer output)
export interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
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
    // CRITICAL FIX: Ensure the base URL is correct for your Django setup.
    // The path '/products/products/' seems correct if your Django app's urls.py
    // and your products app's urls.py lead to this structure.
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // You might want to add a timeout for network requests in a production scenario
      // signal: AbortSignal.timeout(5000) // Example for timeout
    });

    if (!response.ok) {
      // Attempt to parse error data even if response.json() fails, to provide better debug info
      let errorData;
      try {
        errorData = await response.json();
      } catch (e: unknown) {
        errorData = { message: 'Could not parse error response as JSON', rawText: await response.text() };
      }
      console.error(`API Error fetching products (Status: ${response.status}):`, errorData);
      throw new Error(`Failed to fetch products: Status ${response.status}, Details: ${JSON.stringify(errorData)}`);
    }

    const data: Product[] = await response.json();
    return data;
  } catch (error: unknown) { // Explicitly type error as 'unknown'
    console.error('Network or unexpected error fetching products:', error);
    // Re-throw the error for TanStack Query (or whatever is consuming this) to catch,
    // ensuring the original cause is preserved if possible.
    if (error instanceof TypeError && 'cause' in error && (error.cause as any)?.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused to Django backend. Is your Django server running and accessible at ${DJANGO_API_BASE_URL}? Original cause: ${(error.cause as any)?.message}`);
    }
    throw error;
  }
}

/**
 * Fetches a single product by its ID from the Django backend.
 */
export async function fetchProductById(id: number | string): Promise<Product> {
  try {
    // CRITICAL FIX: Ensure the base URL is correct for your Django setup.
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e: unknown) {
        errorData = { message: 'Could not parse error response as JSON', rawText: await response.text() };
      }
      console.error(`API Error fetching product ${id} (Status: ${response.status}):`, errorData);
      throw new Error(`Failed to fetch product ${id}: Status ${response.status}, Details: ${JSON.stringify(errorData)}`);
    }

    const data: Product = await response.json();
    return data;
  } catch (error: unknown) {
    console.error(`Network or unexpected error fetching product ${id}:`, error);
    if (error instanceof TypeError && 'cause' in error && (error.cause as any)?.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused to Django backend. Is your Django server running and accessible at ${DJANGO_API_BASE_URL}? Original cause: ${(error.cause as any)?.message}`);
    }
    throw error;
  }
}