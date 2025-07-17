// src/api/cart.ts
import apiClient from '../lib/apiClient';
import { BackendCart, CartItemBackend } from '../types/cart';


/**
 * Fetches the user's cart from the backend.
 * This hits the `my_cart` action on the OrderViewSet.
 */
export async function fetchUserCart(guestSessionKey?: string | null): Promise<BackendCart> {
  console.log("API: Fetching user cart...");
  try {
    const data = await apiClient<BackendCart>('orders/my_cart/', { method: 'GET' }, guestSessionKey);
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
        const data = await apiClient<BackendCart>(
            'orders/',
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
