//src/api/orders.ts
import { getSession } from 'next-auth/react';

// Define base URL for your Django API
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1';

// --- Type Definitions for Cart/Order Operations ---
export interface ProductInCart {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface OrderItemPayload {
  id?: number;
  product_id: string;
  quantity: number;
}

export interface OrderPayload {
  items: OrderItemPayload[];
  complete?: boolean;
  transaction_id?: string;
}

export interface BackendOrderItem {
  id: number;
  product: {
    id: string;
    name: string;
    price: string;
    image_url?: string;
  };
  quantity: number;
  get_total: string;
}

export interface BackendOrder {
  id: number | null; // Can be null for newly created guest carts
  customer: number | null;
  session_key: string | null; // Important for guest carts
  date_ordered: string;
  complete: boolean;
  transaction_id: string | null;
  get_cart_total: string;
  get_cart_items: number;
  shipping: boolean;
  items: BackendOrderItem[];
}

// --- Type definition for M-Pesa Transaction ---
export interface BackendTransaction {
  id: number;
  order: number;
  phone: string;
  amount: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  result_code: string | null;
  result_desc: string | null;
  is_callback_received: boolean;
  created_at: string;
  updated_at: string;
}


// --- Helper for authenticated and guest API calls ---
// This function is crucial for sending the X-Session-Key header for guest users.
async function fetchWithSession(url: string, options?: RequestInit, guestSessionKey?: string | null) {
  const session = await getSession();

  // Initialize headers as a Record<string, string>
  // This allows for dynamic assignment using bracket notation.
  // Merge any existing headers from options.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}), // Ensure existing headers are also typed correctly
  };

  // Prioritize Authorization header for authenticated users
  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
  } else if (guestSessionKey) {
    // For unauthenticated users, use X-Session-Key
    headers['X-Session-Key'] = guestSessionKey;
  }

  // --- CRITICAL FIX: Always include credentials for session/cookie auth ---
  const response = await fetch(url, {
    ...options,
    headers, // Pass the constructed headers object
    credentials: 'include',
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
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorDetail}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// --- API Functions for Cart (via Order endpoint) ---

/**
 * Fetches the user's current active shopping cart.
 * @param guestSessionKey Optional: The session key for guest users.
 */
export async function fetchCartAPI(guestSessionKey?: string | null): Promise<BackendOrder | null> {
  try {
    const response = await fetchWithSession(`${DJANGO_API_BASE_URL}/products/orders/my_cart/`, {}, guestSessionKey);
    return response;
  } catch (error) {
    console.error("Error fetching cart:", error);
    throw error;
  }
}

/**
 * Adds a product to the cart or updates its quantity by sending the entire cart state.
 * @param cartItems The current desired state of cart items.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The updated BackendOrder (cart).
 */
export async function updateEntireCartAPI(cartItems: ProductInCart[], guestSessionKey?: string | null): Promise<BackendOrder> {
  const payload: OrderPayload = {
    items: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
  };

  const url = `${DJANGO_API_BASE_URL}/products/orders/`;
  const response = await fetchWithSession(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, guestSessionKey); // Pass guestSessionKey here
  return response;
}

/**
 * Clears the entire cart on the backend.
 * @param cartId The ID of the cart (Order) to clear.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The updated BackendOrder (cleared cart).
 */
export async function clearCartAPI(cartId: number, guestSessionKey?: string | null): Promise<BackendOrder> {
  // Clearing cart is essentially updating with an empty items array.
  // Using PUT on the specific order ID to explicitly clear it.
  const url = `${DJANGO_API_BASE_URL}/products/orders/${cartId}/`;
  const response = await fetchWithSession(url, {
    method: 'PUT', // Use PUT to update the entire cart (clear it by sending no items)
    body: JSON.stringify({ items: [] }), // Send an empty items array
  }, guestSessionKey);
  return response;
}

/**
 * Marks an existing cart as complete, effectively checking out.
 * @param cartId The ID of the cart (Order) to complete.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The completed BackendOrder.
 */
export async function checkoutCartAPI(cartId: number, guestSessionKey?: string | null): Promise<BackendOrder> {
  const url = `${DJANGO_API_BASE_URL}/products/orders/${cartId}/complete_order/`;
  const response = await fetchWithSession(url, {
    method: 'POST',
  }, guestSessionKey);
  return response;
}

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  const url = `${DJANGO_API_BASE_URL}/products/orders/`;
  const response = await fetchWithSession(url, {
    method: 'GET',
  });
  return response.filter((order: BackendOrder) => order.complete === true);
}


// --- API Functions for M-Pesa Integration ---

/**
 * Initiates an M-Pesa STK Push from the backend.
 * @param orderId The ID of the order to be paid for.
 * @param phoneNumber The M-Pesa phone number in 254XXXXXXXXX format.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The initiated BackendTransaction details.
 */
export async function initiateStkPushAPI(payload: { orderId: number; phoneNumber: string }, guestSessionKey?: string | null): Promise<BackendTransaction> {
  const url = `${DJANGO_API_BASE_URL}/payments/stk-push/`;
  console.log("Initiating STK Push with payload:", payload);
  const response = await fetchWithSession(url, {
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
  const url = `${DJANGO_API_BASE_URL}/payments/status/?transaction_id=${transactionId}`;
  console.log("Fetching transaction status for ID:", transactionId);
  const response = await fetchWithSession(url, {
    method: 'GET',
  }, guestSessionKey);
  return response;
}
