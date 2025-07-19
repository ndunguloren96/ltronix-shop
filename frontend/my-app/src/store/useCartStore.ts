// frontend/my-app/src/store/useCartStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating session keys

interface CartItem {
    id: number; // Product ID
    name: string;
    price: number;
    quantity: number; // Quantity is an integral part of CartItem
    image_file?: string;
}

interface CartState {
    items: CartItem[];
    guestSessionKey: string | null; // Session key for unauthenticated users
    // CORRECTED: The addItem function now accepts a complete CartItem.
    // client_content.tsx will determine if it's a new item or an update.
    addItem: (item: CartItem) => void;
    removeItem: (id: number) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setGuestSessionKey: (key: string | null) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    findItemById: (id: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            guestSessionKey: null,

            // MODIFIED: addItem now simply adds the item as provided.
            // The logic in client_content.tsx (checking for existing item and calling updateItemQuantity)
            // ensures this 'addItem' is only called when truly adding a *new* item.
            addItem: (itemToAdd) =>
                set((state) => {
                    return { items: [...state.items, itemToAdd] };
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

            clearCart: () => set({ items: [], guestSessionKey: null }),

            setItems: (items) => set({ items: items }),

            setGuestSessionKey: (key) => set({ guestSessionKey: key }),

            getTotalItems: () to get().items.reduce((total, item) => total + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),

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
