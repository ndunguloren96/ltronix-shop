// frontend/my-app/src/api/orders.ts
import apiClient from '../lib/apiClient';
import { BackendOrder, BackendTransaction, OrderPayload, ProductInCart } from '../types/order';


// --- API Functions for Cart (via Order endpoint) ---

/**
 * Fetches the user's current active shopping cart.
 * @param guestSessionKey Optional: The session key for guest users.
 */
export async function fetchCartAPI(guestSessionKey?: string | null): Promise<BackendOrder | null> {
  try {
    const response = await apiClient<BackendOrder>('orders/my_cart/', { method: 'GET' }, guestSessionKey);
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
      product_id: Number(item.id), // Explicitly convert to number
      quantity: item.quantity,
    })),
  };

  const response = await apiClient<BackendOrder>('orders/', {
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
  const response = await apiClient<BackendOrder>(`orders/${cartId}/`, {
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
  const response = await apiClient<BackendOrder>(`orders/${cartId}/complete_order/`, {
    method: 'POST',
  }, guestSessionKey);
  return response;
}

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  const response = await apiClient<BackendOrder[]>('orders/', {
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
  console.log("Initiating STK Push with payload:", payload);
  const response = await apiClient<BackendTransaction>('payments/stk-push/', {
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
  console.log("Fetching transaction status for ID:", transactionId);
  const response = await apiClient<BackendTransaction>(`payments/status/?transaction_id=${transactionId}`, {
    method: 'GET',
  }, guestSessionKey);
  return response;
}

