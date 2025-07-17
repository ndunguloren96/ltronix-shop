// src/api/cart.ts
import { getSession } from "next-auth/react";
import toast from "react-hot-toast";

// Ensure this matches your Django API URL from .env
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.00.1:8000/api/v1';

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
 * Fetches the authenticated user's cart from the backend.
 * This should hit an endpoint that resolves the cart based on the JWT.
 */
export async function fetchUserCart(): Promise<BackendCart> {
  console.log("API: Fetching authenticated user cart...");
  try {
    const data = await fetchWithCartAuth(`${DJANGO_API_BASE_URL}/cart/`, { method: 'GET' });
    return data;
  } catch (error) {
    console.error("API: Failed to fetch user cart:", error);
    // If the cart endpoint returns a 404 (or specific message indicating no cart),
    // you might want to return a default empty cart instead of throwing.
    // For now, we'll throw and let the calling component handle it.
    throw error;
  }
}

/**
 * Sends local guest cart items to the backend to be merged with the authenticated user's cart.
 * The backend should receive the guest_session_key and the items, merge them,
 * and then return the new merged user cart.
 * This endpoint should require authentication.
 */
export async function mergeGuestCart(guestKey: string, cartItems: CartItemBackend[]): Promise<BackendCart> {
  console.log(`API: Merging guest cart (${guestKey}) with user cart...`);
  try {
    const data = await fetchWithCartAuth(`${DJANGO_API_BASE_URL}/cart/merge/`, {
      method: 'POST',
      body: JSON.stringify({ guest_session_key: guestKey, items: cartItems }),
    });
    toast.success("Guest cart merged successfully!");
    return data;
  } catch (error) {
    console.error("API: Failed to merge guest cart:", error);
    // Rethrow to allow calling component to decide next steps (e.g., fetch user cart anyway)
    throw error;
  }
}

/**
 * Updates the entire cart for an authenticated user on the backend.
 * Useful after initial sync or for bulk updates.
 */
export async function updateCartItems(items: CartItemBackend[]): Promise<BackendCart> {
    console.log("API: Updating cart items on backend for authenticated user...");
    try {
        // Assuming your backend has an endpoint for updating the entire cart.
        // It should resolve the user's cart based on the Authorization header.
        const data = await fetchWithCartAuth(`${DJANGO_API_BASE_URL}/cart/update_items/`, {
            method: 'POST',
            body: JSON.stringify({ items: items }),
        });
        return data;
    } catch (error) {
        console.error("API: Failed to update cart items:", error);
        throw error;
    }
}

/**
 * Sends cart items to the backend for unauthenticated users.
 * This assumes a specific endpoint for updating guest carts, or that the regular
 * cart endpoint can handle guest keys for updates.
 */
export async function updateGuestCartItems(guestKey: string, items: CartItemBackend[]): Promise<BackendCart> {
  console.log("API: Updating guest cart items on backend...");
  try {
    const data = await fetchWithCartAuth(`${DJANGO_API_BASE_URL}/cart/guest_update/`, { // Example endpoint for guest update
      method: 'POST',
      body: JSON.stringify({ items: items }),
    }, guestKey); // Pass guestKey explicitly here
    return data;
  } catch (error) {
    console.error("API: Failed to update guest cart items:", error);
    throw error;
  }
}
