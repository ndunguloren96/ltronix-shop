// frontend/my-app/src/types/order.ts

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

// FIX: Explicitly export BackendCart as an alias of BackendOrder
export type BackendCart = BackendOrder;

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

