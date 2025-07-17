// src/types/cart.ts

export interface CartItemBackend {
  product_id: number;
  quantity: number;
}

export interface BackendCart {
  id: number;
  items: Array<{
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_file?: string;
  }>;
}
