// /var/www/ltronix-shop/frontend/my-app/src/api/orders.ts

import { getSession } from 'next-auth/react'; // Keep for authenticated users
import { useCartStore } from '@/store/useCartStore'; // Import Zustand store to get session_key

const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface ProductInCart {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface OrderItemPayload {
  id?: number; // Optional: ID if updating an existing OrderItem (from backend)
  product_id: string; // The ID of the product
  quantity: number;
}

export interface OrderPayload {
  order_items_input: OrderItemPayload[]; // Backend expects this specific field name now
  complete?: boolean;
  transaction_id?: string;
}

export interface BackendOrderItem {
  id: number;
  product: {
    id: string; // Product ID, kept as string from backend
    name: string;
    price: string; // Price from backend as string
    image_url?: string;
  };
  quantity: number;
  get_total: string;
}

export interface BackendOrder {
  id: number; // Order ID
  customer: number | null; // Customer ID (null for guest)
  session_key: string | null; // NEW: Session key for guest carts
  date_ordered: string;
  complete: boolean;
  transaction_id: string | null;
  get_cart_total: string;
  get_cart_items: number;
  shipping: boolean;
  items: BackendOrderItem[];
}

/**
 * Helper function to make authenticated or guest requests to Django backend.
 * It prioritizes authentication token, then falls back to X-Session-Key header for guests.
 * @param url The API endpoint URL.
 * @param options Request options (method, body, etc.).
 * @param sessionKey Optional session key for guest users.
 */
async function fetchWithAuthOrSession(url: string, options?: RequestInit, sessionKey?: string | null) {
  const session = await getSession(); // Get NextAuth session
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (session?.user?.accessToken) {
    // Authenticated user: send Bearer token
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    console.log(`Sending authenticated request to: ${url}`);
  } else if (sessionKey) {
    // Guest user: send X-Session-Key header
    headers['X-Session-Key'] = sessionKey;
    console.log(`Sending guest request with session key to: ${url}`);
  } else {
    // Neither authenticated nor session key available (e.g., initial fetch for new guest)
    console.log(`Sending unauthenticated/no-session-key request to: ${url}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

  if (response.status === 204) { // No Content
    return null;
  }

  // Check for X-Session-Key in response headers and update Zustand store (for client-side only)
  // This needs to be done on the client side, so we'll handle this in the mutation's onSuccess
  // when the actual store is accessible. This function is a backend API wrapper.

  return response.json();
}

/**
 * Fetches the user's active shopping cart (authenticated or guest).
 * @param sessionKey Optional session key for guest users.
 */
export async function fetchCartAPI(sessionKey?: string | null): Promise<BackendOrder | null> {
  try {
    const response = await fetchWithAuthOrSession(`${DJANGO_API_BASE_URL}/products/orders/my_cart/`, {}, sessionKey);
    // Backend's my_cart endpoint should now return a cart object even if empty, not null if it exists
    if (response && response.id === null && response.get_cart_items === 0) { // A new "empty" cart might have id: null
      return response; // Return the empty cart object
    }
    return response;
  } catch (error) {
    console.error("Error fetching cart:", error);
    throw error;
  }
}

/**
 * Sends the current desired state of cart items to the backend.
 * The backend's OrderViewSet will either create a new cart, or update an existing one.
 * It expects 'order_items_input' as a list of {product_id, quantity, (optional) id}
 * @param cartItems The array of ProductInCart (frontend cart items) to sync.
 * @param sessionKey Optional session key for guest users.
 * @returns The updated BackendOrder (cart).
 */
export async function updateEntireCartAPI(cartItems: ProductInCart[], sessionKey?: string | null): Promise<BackendOrder> {
  const payload: OrderPayload = {
    order_items_input: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      // If you were tracking backend order_item_id on the frontend, you'd include it here:
      // id: item.backendOrderItemId // e.g., if you store this when fetching cart
    })),
  };

  const url = `${DJANGO_API_BASE_URL}/products/orders/`;
  const response = await fetchWithAuthOrSession(url, {
    method: 'POST', // POST is used to either create a new cart or update the existing one via custom logic in OrderViewSet's create method
    body: JSON.stringify(payload),
  }, sessionKey); // Pass sessionKey to the helper
  return response;
}

/**
 * Clears the entire cart by sending an empty list of items.
 * @param cartId The ID of the cart (Order) to clear.
 * @param sessionKey Optional session key for guest users.
 * @returns The updated BackendOrder (empty cart).
 */
export async function clearCartAPI(cartId: number, sessionKey?: string | null): Promise<BackendOrder> {
  const payload: OrderPayload = {
    order_items_input: [], // Send an empty array to clear the cart
  };
  const url = `${DJANGO_API_BASE_URL}/products/orders/${cartId}/`; // Target the specific cart
  const response = await fetchWithAuthOrSession(url, {
    method: 'PUT', // Use PUT to completely replace the cart's items
    body: JSON.stringify(payload),
  }, sessionKey); // Pass sessionKey to the helper
  return response;
}

/**
 * Marks an existing cart as complete, effectively checking out.
 * @param cartId The ID of the cart (Order) to complete.
 * @returns The completed BackendOrder.
 */
export async function checkoutCartAPI(cartId: number): Promise<BackendOrder> {
  // Checkout always requires authentication as per your requirements
  const response = await fetchWithAuthOrSession(`${DJANGO_API_BASE_URL}/products/orders/${cartId}/complete_order/`, { // Ensure correct action name
    method: 'POST',
  });
  return response;
}

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  // Order history always requires authentication as per your requirements
  const response = await fetchWithAuthOrSession(`${DJANGO_API_BASE_URL}/products/orders/`);
  return response.filter((order: BackendOrder) => order.complete === true);
}
