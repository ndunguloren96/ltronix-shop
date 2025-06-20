// frontend/my-app/src/store/useCartStore.ts
import { create } from 'zustand';

interface CartItem {
    id: string; // Changed to string to match product IDs from Django
    name: string;
    price: number;
    quantity: number;
    image_url?: string; // NEW: Added image_url to cart item
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>) => void; // Expects item without quantity, adds 1
    removeItem: (id: string) => void; // Changed id to string
    updateItemQuantity: (id: string, quantity: number) => void; // Changed id to string
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addItem: (item) =>
        set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
                // If item exists, increase quantity
                return {
                    items: state.items.map((i) =>
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            } else {
                // If item is new, add it with quantity 1
                return { items: [...state.items, { ...item, quantity: 1, image_url: item.image_url }] }; // Capture image_url
            }
        }),
    removeItem: (id) =>
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        })),
    updateItemQuantity: (id, quantity) =>
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...item, quantity: quantity } : item
            ),
        })),
    clearCart: () => set({ items: [] }),
    getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
    getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
}));
