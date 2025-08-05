// src/api/cart.ts
import { getSession } from "next-auth/react";
import toast from "react-hot-toast";
// CORRECTED IMPORT: Ensure all necessary types are imported from src/types/order.ts
import { BackendCart, BackendTransaction, CartItemBackend, BackendCartResponse, BackendOrder } from '../types/order'; // Added BackendOrder here


// Ensure this matches your Django API URL from .env
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Helper function to make API requests, intelligently attaching
 * Authorization header for authenticated users or X-Session-Key for guests.
 * Prioritizes authenticated user.
 */
async function fetchWithCartAuth<T>(
  url: string,
  options?: RequestInit,
  guestSessionKey?: string | null
): Promise<T> {
  const session = await getSession(); // Get the current NextAuth session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (session?.user?.accessToken) {
    // If authenticated, use JWT and DO NOT send guest session key
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    // CRITICAL FIX: Ensure X-Session-Key is NOT sent for authenticated users
    if (headers['X-Session-Key']) {
        delete headers['X-Session-Key'];
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
    let errorDetail = 'An unknown error occurred.';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorDetail = errorData.detail;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorDetail = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorDetail = errorData;
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
    }
    toast.error(`API Error: ${response.status} ${response.statusText} - ${errorDetail}`);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorDetail}`);
  }

  if (response.status === 204) {
    return null as T; // Handle No Content
  }

  return response.json();
}

/**
 * Fetches the user's current active shopping cart.
 * This should hit the `my_cart` action on the OrderViewSet.
 * It intelligently sends the correct authentication header.
 * Now returns BackendCart (which is BackendOrder) or null.
 */
export async function fetchUserCart(guestSessionKey?: string | null): Promise<BackendCart | null> {
  console.log("API: Fetching user cart...");
  try {
    const url = new URL('orders/my_cart/', DJANGO_API_BASE_URL);
    // The API might return BackendCart (BackendOrder) directly or BackendCartResponse.
    // We need to handle both possibilities.
    const response = await fetchWithCartAuth<BackendCartResponse | BackendCart | null>(url.toString(), { method: 'GET' }, guestSessionKey);

    if (response && 'orders' in response && Array.isArray(response.orders) && response.orders.length > 0) {
      // If it's a BackendCartResponse, return the first order (which is a BackendCart/BackendOrder)
      return response.orders[0];
    } else if (response && 'items' in response) {
      // If it's already a BackendCart (meaning it has an 'items' property directly)
      return response as BackendCart;
    }
    return null; // No active cart found
  } catch (error) {
    console.error("API: Failed to fetch user cart:", error);
    throw error;
  }
}

/**
 * A dedicated function to get cart data, handling both authenticated and guest users.
 * This is the function that the `useCartStore` will call.
 * This function now explicitly returns `BackendCart | null`.
 */
export async function getCartData(): Promise<BackendCart | null> {
  const session = await getSession();
  const guestSessionKey = typeof window !== 'undefined' ? sessionStorage.getItem('guestSessionKey') : null;

  if (session) {
    // Authenticated user: fetch cart without a guest key
    return fetchUserCart();
  } else if (guestSessionKey) {
    // Guest user: fetch cart using the guest key
    return fetchUserCart(guestSessionKey);
  } else {
    // No user and no guest key, return null (indicating no active cart)
    return null;
  }
}


/**
 * Creates or updates a cart on the backend. This function is used for adding/updating items.
 * It intelligently sends the correct authentication header.
 * The backend's `OrderViewSet.create` method handles all these cases (POST to /orders/).
 */
export async function createOrUpdateCart(items: CartItemBackend[], guestSessionKey?: string | null): Promise<BackendCart> {
  console.log("API: Creating or updating cart...");
  try {
    const url = new URL('orders/', DJANGO_API_BASE_URL); // POST to /orders/ handles create/update
    const data = await fetchWithCartAuth<BackendCart>(
      url.toString(),
      {
        method: 'POST',
        body: JSON.stringify({ items }),
      },
      guestSessionKey
    );
    return data;
  } catch (error) {
    console.error("API: Failed to create or update cart:", error);
    throw error;
  }
}

/**
 * Sends local guest cart items to the backend to be merged with the authenticated user's cart.
 * This endpoint should be specifically handled on the backend (e.g., POST to /orders/merge_guest_cart/).
 * It should require authentication.
 */
export async function mergeGuestCart(guestKey: string, cartItems: CartItemBackend[]): Promise<BackendCart> {
  console.log(`API: Merging guest cart (${guestKey}) with user cart...`);
  try {
    const url = new URL('orders/merge_guest_cart/', DJANGO_API_BASE_URL); // Backend endpoint for merging
    const data = await fetchWithCartAuth<BackendCart>(url.toString(), {
      method: 'POST',
      body: JSON.stringify({ guest_session_key: guestKey, items: cartItems }),
    });
    toast.success("Guest cart merged successfully!");
    return data;
  } catch (error) {
    console.error("API: Failed to merge guest cart:", error);
    throw error;
  }
}


// --- API Functions for M-Pesa Integration (retained from original orders.ts) ---

/**
 * Initiates an M-Pesa STK Push from the backend.
 * @param orderId The ID of the order to be paid for.
 * @param phoneNumber The M-Pesa phone number in 254XXXXXXXXX format.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The initiated BackendTransaction details.
 */
export async function initiateStkPushAPI(payload: { orderId: number; phoneNumber: string }, guestSessionKey?: string | null): Promise<BackendTransaction> {
  const url = new URL('payments/stk-push/', DJANGO_API_BASE_URL);
  console.log("Initiating STK Push with payload:", payload);
  const response = await fetchWithCartAuth<BackendTransaction>(url.toString(), {
    method: 'POST',
    body: JSON.stringify({
      order_id: payload.orderId,
      phone_number: payload.phoneNumber,
    }),
  }, guestSessionKey);
  return response;
}

/**
 * Fetches the status of an M-Pesa transaction from the backend.
 * @param transactionId The ID of the transaction (from your Django Transaction model).
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The BackendTransaction with updated status.
 */
export async function fetchTransactionStatusAPI(transactionId: number, guestSessionKey?: string | null): Promise<BackendTransaction> {
  const url = new URL(`payments/status/?transaction_id=${transactionId}`, DJANGO_API_BASE_URL);
  console.log("Fetching transaction status for ID:", transactionId);
  const response = await fetchWithCartAuth<BackendTransaction>(url.toString(), {
    method: 'GET',
  }, guestSessionKey);
  return response;
}

/**
 * Clears the entire cart on the backend.
 * @param cartId The ID of the cart (Order) to clear.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The updated BackendOrder (cleared cart).
 */
export async function clearCartAPI(cartId: number, guestSessionKey?: string | null): Promise<BackendOrder | null> {
  const url = new URL(`orders/${cartId}/`, DJANGO_API_BASE_URL);
  const response = await fetchWithCartAuth<BackendCartResponse>(url.toString(), {
    method: 'PUT', // Use PUT to update the entire cart (clear it by sending no items)
    body: JSON.stringify({ items: [] }), // Send an empty items array
  }, guestSessionKey);
  // Assuming the backend returns a BackendCartResponse with an array of orders
  // and we are interested in the first order after clearing.
  if (response && response.orders && response.orders.length > 0) {
    return response.orders[0];
  } else {
    return null;
  }
}

/**
 * Marks an existing cart as complete, effectively checking out.
 * @param cartId The ID of the cart (Order) to complete.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The completed BackendOrder.
 */
export async function checkoutCartAPI(cartId: number, guestSessionKey?: string | null): Promise<BackendCart> {
  const url = new URL(`orders/${cartId}/complete_order/`, DJANGO_API_BASE_URL);
  const response = await fetchWithCartAuth<BackendCart>(url.toString(), {
    method: 'POST',
  }, guestSessionKey);
  return response;
}

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  const url = new URL('orders/', DJANGO_API_BASE_URL);
  const response = await fetchWithCartAuth<BackendCartResponse[]>(url.toString(), {
    method: 'GET',
  });
  // Flatten the array of BackendCartResponse into a single array of BackendOrder
  // and then filter for complete orders.
  return response.flatMap(cartResponse => cartResponse.orders || []).filter(order => order.complete === true);
}

