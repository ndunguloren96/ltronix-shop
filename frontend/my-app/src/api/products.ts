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
  id: string;
  name: string;
  price: string;
  description: string;
  digital: boolean;
  image_url?: string;
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches a list of all products from the Django backend.
 */
export async function fetchProducts(): Promise<Product[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

  try {
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal, // Attach the abort signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes

    if (!response.ok) {
      // const errorResponse = response.clone(); // Clone the response --Todo: uncomment
      let errorData;
      try {
        errorData = await errorResponse.json(); // Read from the clone
      } catch (e: unknown) {
        errorData = { message: 'Could not parse error response as JSON', rawText: await errorResponse.text() }; // Read from the clone
      }
      console.error(`API Error fetching products (Status: ${response.status}):`, errorData);
      // For build time, return empty array on API error to allow build to complete
      return [];
    }

    const data: Product[] = await response.json();
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error
    console.error('Network or unexpected error fetching products:', error);

    // Gracefully handle network errors during build time
    if (error instanceof TypeError && (
        (error.cause as any)?.code === 'ECONNREFUSED' ||
        (error.cause as any)?.code === 'ETIMEDOUT' ||
        (error as any).name === 'AbortError' // Handle timeout explicitly
    )) {
        console.warn(`Backend connection issue during build. Returning empty products. Error: ${error.message}`);
        return []; // Return empty array to allow build to complete
    }
    throw error; // Re-throw other unexpected errors
  }
}

/**
 * Fetches a single product by its ID from the Django backend.
 */
export async function fetchProductById(id: number | string): Promise<Product> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

  try {
    const response = await fetch(`${DJANGO_API_BASE_URL}/products/products/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal, // Attach the abort signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes

    if (!response.ok) {
      const errorResponse = response.clone(); // Clone the response
      let errorData;
      try {
        errorData = await errorResponse.json(); // Read from the clone
      } catch (e: unknown) {
        errorData = { message: 'Could not parse error response as JSON', rawText: await errorResponse.text() }; // Read from the clone
      }
      console.error(`API Error fetching product ${id} (Status: ${response.status}):`, errorData);
      // For build time, throw an error to indicate product not found or API issue
      throw new Error(`Failed to fetch product ${id}: Status ${response.status}, Details: ${JSON.stringify(errorData)}`);
    }

    const data: Product = await response.json();
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error
    console.error(`Network or unexpected error fetching product ${id}:`, error);

    // Gracefully handle network errors during build time
    if (error instanceof TypeError && (
        (error.cause as any)?.code === 'ECONNREFUSED' ||
        (error.cause as any)?.code === 'ETIMEDOUT' ||
        (error as any).name === 'AbortError' // Handle timeout explicitly
    )) {
        console.warn(`Backend connection issue during build for product ${id}. Throwing error to indicate failure.`);
        throw new Error(`Backend connection issue during build for product ${id}. Original error: ${error.message}`);
    }
    throw error; // Re-throw other unexpected errors
  }
}
