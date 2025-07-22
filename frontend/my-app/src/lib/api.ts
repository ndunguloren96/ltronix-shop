// frontend/my-app/src/lib/api.ts

// Define base URL for your Django API
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1';

// --- Type Definitions for Cart/Order Operations ---
export interface ProductInCart {
  id: number; // Product ID
  name: string;
  price: number;
  quantity: number;
  image_file?: string;
}

export interface OrderItemPayload {
  id?: number;
  product_id: number;
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
    id: number;
    name: string;
    price: string; // Price from backend is a string
    image_file?: string;
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

// --- Helper for API calls ---
export async function fetchWithSession(url: string, options?: RequestInit, guestSessionKey?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (guestSessionKey) {
    headers['X-Session-Key'] = guestSessionKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
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
    const url = new URL('orders/my_cart/', DJANGO_API_BASE_URL);
    const response = await fetchWithSession(url.toString(), {}, guestSessionKey);
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
      product_id: Number(item.id),
      quantity: item.quantity,
    })),
  };

  const url = new URL('orders/', DJANGO_API_BASE_URL);
  const response = await fetchWithSession(url.toString(), {
    method: 'POST',
    body: JSON.stringify(payload),
  }, guestSessionKey);
  return response;
}

/**
 * Clears the entire cart on the backend.
 * @param cartId The ID of the cart (Order) to clear.
 * @param guestSessionKey Optional: The session key for guest users.
 * @returns The updated BackendOrder (cleared cart).
 */
export async function clearCartAPI(cartId: number, guestSessionKey?: string | null): Promise<BackendOrder> {
  const url = new URL(`orders/${cartId}/`, DJANGO_API_BASE_URL);
  const response = await fetchWithSession(url.toString(), {
    method: 'PUT',
    body: JSON.stringify({ items: [] }),
  }, guestSessionKey);
  return response;
}

