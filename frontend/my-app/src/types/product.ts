// frontend/my-app/src/types/product.ts

export interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    digital: boolean;
    image_file?: string;
    category?: string;
    stock: number;
    brand?: string;
    sku?: string;
    rating: string;
    reviews_count: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}
