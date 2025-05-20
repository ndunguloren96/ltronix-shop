import { create } from 'zustand';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: number) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
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
                return { items: [...state.items, { ...item, quantity: 1 }] };
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