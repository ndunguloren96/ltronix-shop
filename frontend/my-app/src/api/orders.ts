// src/api/orders.ts

import { getSession } from 'next-auth/react'; // Import getSession for authenticated requests

// Define base URL for your Django API
const DJANGO_API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// --- Type Definitions for Cart/Order Operations ---
// These should mirror your Django backend's expectations for consistency.

export interface ProductInCart {
  id: string; // Product ID, used for API calls
  name: string;
  price: number;
  quantity: number;
  image_url?: string; // Optional for display, not sent to backend for cart updates
}

// Data structure expected by the backend for creating or updating OrderItems
export interface OrderItemPayload {
  id?: number; // Optional: ID if updating an existing OrderItem
  product_id: string; // The ID of the product
  quantity: number;
}

// Data structure expected by the backend for creating or updating an Order/Cart
export interface OrderPayload {
  items: OrderItemPayload[];
  // You can add shipping address, payment method ID, etc. here later for checkout
  // For initial cart management, primarily 'items' is used.
  complete?: boolean; // Used to mark order as complete during checkout
  transaction_id?: string; // Generated on backend during completion
}

// Data structure returned by the backend for a full Order (Cart or Completed Order)
export interface BackendOrderItem {
  id: number;
  product: { // Nested product data as returned by ProductSerializer
    id: string;
    name: string;
    price: string; // From Django DecimalField
    image_url?: string;
    // ... other product fields as per ProductSerializer
  };
  quantity: number;
  get_total: string; // Calculated total for this item
}

export interface BackendOrder {
  id: number; // Order ID
  customer: number; // Customer ID
  date_ordered: string;
  complete: boolean; // False for cart, True for completed order
  transaction_id: string | null;
  get_cart_total: string; // Total price of the cart/order
  get_cart_items: number; // Total quantity of items in cart/order
  shipping: boolean; // Indicates if shipping is required
  items: BackendOrderItem[]; // Nested order items
}

// --- Helper for authenticated API calls ---
async function fetchAuthenticated(url: string, options?: RequestInit) {
  const session = await getSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  // If a user is logged in, attach their JWT token
  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
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
        // Flatten nested errors from DRF serializers
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
 * Fetches the authenticated user's active shopping cart.
 * Calls the custom `/products/orders/my_cart/` endpoint.
 * Returns null if no cart exists, or the BackendOrder representing the cart.
 */
export async function fetchCartAPI(): Promise<BackendOrder | null> {
  try {
    const response = await fetchAuthenticated(`${DJANGO_API_BASE_URL}/products/orders/my_cart/`);
    // Backend returns a structured empty cart if none exists. Check its ID.
    if (response && response.id === null) {
      return null;
    }
    return response;
  } catch (error) {
    // If a 401 or similar occurs, it means no authenticated cart
    console.error("Error fetching cart:", error);
    // Depending on error, you might want to differentiate between network error vs no cart found for unauth user
    throw error; // Re-throw to be caught by useQuery
  }
}

/**
 * Adds a product to the cart or updates its quantity.
 * This function will send the *entire current cart state* to the backend.
 * The backend's OrderViewSet's `create` or `update` method will handle merging/updating.
 * @param currentCart The current state of the cart (from frontend Zustand store or previous API call).
 * @param newItem The item to add/update (product_id, quantity).
 * @returns The updated BackendOrder (cart).
 */
export async function updateEntireCartAPI(cartItems: ProductInCart[]): Promise<BackendOrder> {
  const payload: OrderPayload = {
    items: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      // Pass item.id if you have it and are supporting updating specific OrderItems by ID
      // id: item.backend_item_id // Assuming you'd store this if backend returns it
    })),
  };

  // We rely on the backend's OrderViewSet create/update logic to find or create the cart
  // and process the `items` payload.
  // The backend's `create` method in OrderViewSet handles finding/creating the cart.
  // We send a POST request with the full desired state of the cart items.
  const url = `${DJANGO_API_BASE_URL}/products/orders/`;
  const response = await fetchAuthenticated(url, {
    method: 'POST', // POST is used because the backend's create method has the logic to find or create the cart
    body: JSON.stringify(payload),
  });
  return response;
}

/**
 * Marks an existing cart as complete, effectively checking out.
 * @param cartId The ID of the cart (Order) to complete.
 * @returns The completed BackendOrder.
 */
export async function checkoutCartAPI(cartId: number): Promise<BackendOrder> {
  const url = `${DJANGO_API_BASE_URL}/products/orders/${cartId}/complete/`;
  const response = await fetchAuthenticated(url, {
    method: 'POST',
    // No body needed for this action if backend logic handles completion based on ID
  });
  return response;
}

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  const url = `${DJANGO_API_BASE_URL}/products/orders/`; // This endpoint lists all orders for the user
  const response = await fetchAuthenticated(url, {
    method: 'GET',
  });
  // Filter out the incomplete cart if it's returned here, as fetchOrdersAPI should be for history
  return response.filter((order: BackendOrder) => order.complete === true);
}
