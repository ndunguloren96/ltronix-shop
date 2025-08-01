// src/api/checkout.ts
import { API_BASE_URL } from '@/lib/apiConfig';
import { getAuthHeader } from '@/lib/auth';
// Import the correct BackendTransaction type from the centralized types file
import { BackendTransaction } from '@/types/order';

/**
 * Type definitions for checkout-related data.
 * These should match the expected data structure of your backend API.
 */
interface OrderItemRequest {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  shipping_address: string;
  payment_method: string;
  items: OrderItemRequest[];
}

/**
 * Creates a new order by sending cart data to the backend checkout endpoint.
 *
 * @param orderData The data required to create an order (shipping, payment, items).
 * @param guestSessionKey The session key for unauthenticated users, if applicable.
 * @returns A promise that resolves to the created BackendTransaction object.
 */
export const createOrder = async (
  orderData: CreateOrderRequest,
  guestSessionKey: string | null = null,
): Promise<BackendTransaction> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (guestSessionKey) {
      headers['X-Session-Key'] = guestSessionKey;
    }

    const response = await fetch(`${API_BASE_URL}/checkout/orders/create/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
    }

    // The returned JSON will now be correctly typed as BackendTransaction from src/types/order.ts
    return (await response.json()) as BackendTransaction;
  } catch (error) {
    console.error('Error in createOrder API call:', error);
    throw error;
  }
};
