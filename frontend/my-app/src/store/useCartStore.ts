// frontend/my-app/src/store/useCartStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating session keys

interface CartItem {
    // FIX: Changed id from string to number (Product ID)
    id: number; // Product ID
    name: string;
    price: number;
    quantity: number;
    // FIX: Changed from image_url to image_file for consistency with backend and other frontend components
    image_file?: string;
}

interface CartState {
    items: CartItem[];
    guestSessionKey: string | null; // Session key for unauthenticated users
    // FIX: Ensure id is number for addItem, removeItem, updateItemQuantity
    // FIX: Changed item type in addItem to use image_file
    addItem: (item: Omit<CartItem, 'quantity'> & { image_file?: string }) => void;
    removeItem: (id: number) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setGuestSessionKey: (key: string | null) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    // NEW: Add findItemById to CartState interface
    findItemById: (id: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            guestSessionKey: null,

            addItem: (item) =>
                set((state) => {
                    // FIX: Ensure comparison is with number id
                    const existingItem = state.items.find((i) => i.id === item.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                // FIX: Ensure comparison is with number id
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                        };
                    } else {
                        // Ensure the item added has the correct image_file property
                        return { items: [...state.items, { ...item, quantity: 1 }] };
                    }
                }),

            removeItem: (id) =>
                set((state) => ({
                    // FIX: Ensure comparison is with number id
                    items: state.items.filter((item) => item.id !== id),
                })),

            updateItemQuantity: (id, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        // FIX: Ensure comparison is with number id
                        item.id === id ? { ...item, quantity: quantity } : item
                    ),
                })),

            clearCart: () => set({ items: [], guestSessionKey: null }),

            setItems: (items) => set({ items: items }),

            setGuestSessionKey: (key) => set({ guestSessionKey: key }),

            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),

            // NEW: Implement findItemById
            findItemById: (id) => get().items.find((item) => item.id === id),
        }),
        {
            name: 'ltronix-cart-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                guestSessionKey: state.guestSessionKey,
            }),
            onRehydrateStorage: (state) => {
                if (state && state.guestSessionKey === null) {
                    const newSessionKey = uuidv4();
                    state.guestSessionKey = newSessionKey;
                    console.log('Generated new guest session key on rehydrate:', newSessionKey);
                }
            },
        }
    )
);
