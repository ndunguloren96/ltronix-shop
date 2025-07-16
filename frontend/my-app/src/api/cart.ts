// src/api/cart.ts
import { getSession } from "next-auth/react";
import toast from "react-hot-toast";

// Ensure this matches your Django API URL from .env
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

interface CartItemBackend {
  product_id: number;
  quantity: number;
  // Add any other fields your backend expects for cart items (e.g., variant_id)
}

interface BackendCart {
  id: number; // Cart ID from backend
  items: Array<{
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_file?: string;
    // Include other product/item details returned by your backend
  }>;
  // Other cart-related fields from your backend (e.g., total_price)
}

/**
 * Helper function to make API requests, intelligently attaching
 * Authorization header for authenticated users or X-Session-Key for guests.
 * Prioritizes authenticated user.
 */
async function fetchWithCartAuth(
  url: string,
  options?: RequestInit,
  guestSessionKey?: string | null
) {
  const session = await getSession(); // Get the current NextAuth session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (session?.user?.accessToken) {
    // If authenticated, use JWT and DO NOT send guest session key
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    if (headers['X-Session-Key']) {
        delete headers['X-Session-Key']; // Ensure guest key is not sent simultaneously
    }
  } else if (guestSessionKey) {
    // If not authenticated, use the guest session key
    headers['X-Session-Key'] = guestSessionKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for sending cookies (e.g., for CSRF/Session if needed)
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.detail || JSON.stringify(errorData);
    toast.error(`Cart API Error: ${errorMessage}`);
    throw new Error(`Cart API Error: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Fetches the user's cart from the backend.
 * This hits the `my_cart` action on the OrderViewSet.
 */
export async function fetchUserCart(guestSessionKey?: string | null): Promise<BackendCart> {
  console.log("API: Fetching user cart...");
  try {
    const data = await fetchWithCartAuth(`${DJANGO_API_BASE_URL}/orders/my_cart/`, { method: 'GET' }, guestSessionKey);
    return data;
  } catch (error) {
    console.error("API: Failed to fetch user cart:", error);
    throw error;
  }
}

/**
 * Creates or updates a cart on the backend. This function is used for merging guest carts,
 * updating authenticated user carts, and updating guest carts.
 * The backend's `OrderViewSet.create` method handles all these cases.
 */
export async function createOrUpdateCart(items: CartItemBackend[], guestSessionKey?: string | null): Promise<BackendCart> {
    console.log("API: Creating or updating cart...");
    try {
        const data = await fetchWithCartAuth(
            `${DJANGO_API_BASE_URL}/orders/`,
            {
                method: 'POST',
                body: JSON.stringify({ items }),
            },
            guestSessionKey
        );
        toast.success("Cart updated successfully!");
        return data;
    } catch (error) {
        console.error("API: Failed to create or update cart:", error);
        throw error;
    }
}
