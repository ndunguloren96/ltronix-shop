// frontend/my-app/src/api/orders.ts
import apiClient from '../lib/apiClient'; // Import the new generic apiClient
// CORRECTED IMPORT: Import types from the dedicated types file
import { BackendOrder, BackendTransaction } from '../types/order';


// Note: Cart-specific API functions (fetchCartAPI, updateEntireCartAPI, clearCartAPI, checkoutCartAPI)
// are now assumed to be in src/api/cart.ts and use fetchWithCartAuth.
// This file focuses on completed orders and payment transactions.

/**
 * Fetches the order history for the authenticated user.
 */
export async function fetchOrdersAPI(): Promise<BackendOrder[]> {
  console.log("API: Fetching order history...");
  try {
    const response = await apiClient<BackendOrder[]>('orders/', {
      method: 'GET',
    });
    // Assuming your backend's /orders/ endpoint returns all orders,
    // and you only want completed ones on the frontend for "order history".
    return response.filter((order: BackendOrder) => order.complete === true);
  } catch (error) {
    console.error("API: Failed to fetch order history:", error);
    throw error;
  }
}

// --- API Functions for M-Pesa Integration ---

/**
 * Initiates an M-Pesa STK Push from the backend.
 * This function uses the generic apiClient.
 * @param payload The order ID and phone number.
 * @returns The initiated BackendTransaction details.
 */
export async function initiateStkPushAPI(payload: { orderId: number; phoneNumber: string }): Promise<BackendTransaction> {
  console.log("API: Initiating STK Push with payload:", payload);
  try {
    const response = await apiClient<BackendTransaction>('payments/stk-push/', {
      method: 'POST',
      body: JSON.stringify({
        order_id: payload.orderId,
        phone_number: payload.phoneNumber,
      }),
    });
    return response;
  } catch (error) {
    console.error("API: Failed to initiate STK Push:", error);
    throw error;
  }
}

/**
 * Fetches the status of an M-Pesa transaction from the backend.
 * This function uses the generic apiClient.
 * @param transactionId The ID of the transaction (from your Django Transaction model).
 * @returns The BackendTransaction with updated status.
 */
export async function fetchTransactionStatusAPI(transactionId: number): Promise<BackendTransaction> {
  console.log("API: Fetching transaction status for ID:", transactionId);
  try {
    const response = await apiClient<BackendTransaction>(`payments/status/?transaction_id=${transactionId}`, {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error("API: Failed to fetch transaction status:", error);
    throw error;
  }
}

