// frontend/my-app/src/api/products.ts
const DJANGO_API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/';

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

// Define a type guard for errors that might have a 'cause' with a 'code'
// This helps TypeScript understand the shape of the error.cause when it exists.
interface ErrorWithCauseAndCode extends Error {
  cause?: {
    code?: string;
    // Add other properties if you expect them on 'cause'
  };
}


// Fetch list of products
export async function fetchProducts(): Promise<Product[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = new URL('products/', DJANGO_API_BASE_URL);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json' // Fixed: removed invalid trailing comma          },
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorResponse = response.clone();
      let errorData;
      try {
        errorData = await errorResponse.json();
      } catch {
        errorData = {
          message: 'Could not parse error response as JSON',
          rawText: await errorResponse.text(),
        };
      }
      console.error(
        `API Error fetching products (Status: ${response.status}):`,
        errorData
      );
      return [];
    }

    return await response.json();
  } catch (err: any) { // Change 'error: any' to 'err: any' for clarity if you wish, or keep 'error: any'
    clearTimeout(timeoutId);
    console.error('Network or unexpected error fetching products:', err);

    // Apply the type guard here
    const error = err as ErrorWithCauseAndCode;

    if (
      error instanceof TypeError &&
      (error.name === 'AbortError' ||
       // Check if cause exists, is an object, and has 'code' property
       (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ECONNREFUSED') ||
       (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ETIMEDOUT'))
    ) {
      console.warn(
        `Backend connection issue. Returning empty products. Error: ${error.message}`
      );
      return [];
    }

    throw error;
  }
}

// Fetch a single product by ID
export async function fetchProductById(
  id: number | string
): Promise<Product> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = new URL(`products/${id}/`, DJANGO_API_BASE_URL); // ✅ Updated: correct path for detail view

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorResponse = response.clone();
      let errorData;
      try {
        errorData = await errorResponse.json();
      } catch {
        errorData = {
          message: 'Could not parse error response as JSON',
          rawText: await errorResponse.text(),
        };
      }
      throw new Error(
        `Failed to fetch product ${id}: Status ${response.status}, Details: ${JSON.stringify(
          errorData
        )}`
      );
    }

    return await response.json();
  } catch (err: any) { // Change 'error: any' to 'err: any' for clarity if you wish, or keep 'error: any'
    clearTimeout(timeoutId);
    console.error(`Error fetching product ${id}:`, err);

    // Apply the same type guard here
    const error = err as ErrorWithCauseAndCode;

    if (
      error instanceof TypeError &&
      (error.name === 'AbortError' ||
       // Check if cause exists, is an object, and has 'code' property
       (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ECONNREFUSED') ||
       (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ETIMEDOUT'))
    ) {
      throw new Error(
        `Backend connection issue for product ${id}. ${error.message}`
      );
    }

    throw error;
  }
}
