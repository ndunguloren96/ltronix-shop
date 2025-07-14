// frontend/my-app/src/api/products.ts

// The DJANGO_API_BASE_URL MUST be set correctly in your environment,
// typically via docker-compose.yml for Dockerized Next.js applications,
// or via a .env.local file. It should include the full API path, e.g., 'http://localhost/api/v1/'.
// Removing the fallback to force the environment variable to be correctly picked up at build time.
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

// --- Debugging Logs (keep these for now to verify) ---
// Log the raw environment variable to confirm what Next.js is actually seeing
console.log('Raw NEXT_PUBLIC_DJANGO_API_URL from process.env:', process.env.NEXT_PUBLIC_DJANGO_API_URL);
if (!DJANGO_API_BASE_URL) {
  console.error('ERROR: DJANGO_API_BASE_URL is not defined! Please check your environment variables.');
}
// --- End Debugging Logs ---


// --- Type Definitions ---
export interface Product {
    // FIX: Changed id from string to number to match Django backend
    id: number;
    name: string;
    price: string;
    description: string;
    digital: boolean;
    image_file?: string;
    category?: string;
    stock: number;
    brand?: string;
    sku?: string;
    rating: string;
    reviews_count: number;
    created_at: string;
    updated_at: string;
}

// New interface for the paginated response structure from Django DRF
interface PaginatedProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// Define a type guard for errors that might have a 'cause' with a 'code'
interface ErrorWithCauseAndCode extends Error {
  cause?: {
    code?: string;
  };
}

// --- API Functions ---

/**
 * Fetches a list of all products from the Django backend.
 */
export async function fetchProducts(): Promise<Product[]> {
  // Ensure the base URL is defined before proceeding with the fetch
  if (!DJANGO_API_BASE_URL) {
    // If the base URL is missing, log an error and return an empty array
    // This prevents runtime errors from an undefined URL.
    console.error('Cannot fetch products: DJANGO_API_BASE_URL is undefined.');
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    // Construct the URL using the correct base and endpoint path.
    // Assuming DJANGO_API_BASE_URL is 'http://localhost/api/v1/'
    // and the Django endpoint for product list is 'products/' relative to that.
    const url = new URL('products/', DJANGO_API_BASE_URL);
    console.log('Fetching products from URL:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout if fetch completes successfully

    if (!response.ok) {
      // Improved error handling from your current version to parse API error responses
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
      return []; // Return empty array on API error
    }

    // --- CRITICAL CHANGE HERE ---
    // Cast the response to the PaginatedProductsResponse interface
    const data: PaginatedProductsResponse = await response.json();
    // FIX: Ensure product IDs are numbers when returned
    return data.results.map(product => ({
        ...product,
        id: Number(product.id) // Explicitly convert id to number
    }));
    // --- END CRITICAL CHANGE ---

  } catch (err: any) {
    clearTimeout(timeoutId); // Clear timeout on any error
    console.error('Network or unexpected error fetching products:', err);

    // Use the type guard for more specific error handling
    const error = err as ErrorWithCauseAndCode;

    // Specific handling for network-related errors (e.g., connection refused, timeout)
    if (
      error instanceof TypeError &&
      (error.name === 'AbortError' || // Fetch operation aborted by timeout
        (error.cause && typeof error.cause === 'object' && 'code' in error.cause &&
          (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'ETIMEDOUT'))) // Common network errors
    ) {
      console.warn(
        `Backend connection issue. Returning empty products. Error: ${error.message}`
      );
      return []; // Return empty array if backend is unreachable
    }

    throw error; // Re-throw other unexpected errors to be handled upstream
  }
}

/**
 * Fetches a single product by its ID from the Django backend.
 */
export async function fetchProductById(
  id: number // FIX: Changed id type to number
): Promise<Product> {
  // Ensure the base URL is defined before proceeding
  if (!DJANGO_API_BASE_URL) {
    console.error(`Cannot fetch product ${id}: DJANGO_API_BASE_URL is undefined.`);
    throw new Error('DJANGO_API_BASE_URL is undefined.'); // Throw error if base URL is missing
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    // Construct the URL for a single product
    const url = new URL(`products/${id}/`, DJANGO_API_BASE_URL);
    console.log(`Fetching product ${id} from URL:`, url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout if fetch completes

    if (!response.ok) {
      // Improved error handling
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

    const data: Product = await response.json();
    // FIX: Ensure product ID is a number when returned for single product fetch
    return {
        ...data,
        id: Number(data.id)
    };
  } catch (err: any) {
    clearTimeout(timeoutId); // Clear timeout on error
    console.error(`Error fetching product ${id}:`, err);

    // Use the type guard for more specific error handling
    const error = err as ErrorWithCauseAndCode;

    // Specific handling for network-related errors
    if (
      error instanceof TypeError &&
      (error.name === 'AbortError' ||
        (error.cause && typeof error.cause === 'object' && 'code' in error.cause &&
          (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'ETIMEDOUT')))
    ) {
      throw new Error(
        `Backend connection issue for product ${id}. ${error.message}`
      );
    }

    throw error; // Re-throw other unexpected errors
  }
}

