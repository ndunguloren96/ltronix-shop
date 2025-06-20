// frontend/my-app/src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Import persist and createJSONStorage
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating session keys

interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface CartState {
    items: CartItem[];
    guestSessionKey: string | null; // NEW: Session key for unauthenticated users
    addItem: (item: Omit<CartItem, 'quantity'> & { image_url?: string }) => void;
    removeItem: (id: string) => void;
    updateItemQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setGuestSessionKey: (key: string | null) => void; // NEW: Action to set guest session key
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist( // Wrap your store with persist middleware
        (set, get) => ({
            items: [],
            guestSessionKey: null, // Initialize guestSessionKey

            addItem: (item) =>
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                        };
                    } else {
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

            clearCart: () => set({ items: [], guestSessionKey: null }), // Clear key on cart clear

            setItems: (items) => set({ items: items }),

            setGuestSessionKey: (key) => set({ guestSessionKey: key }), // Implementation for new action

            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        }),
        {
            name: 'ltronix-cart-storage', // Name of the item in localStorage
            storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
            // Optionally, you can choose which parts of the state to persist
            partialize: (state) => ({
                items: state.items,
                guestSessionKey: state.guestSessionKey, // Persist the guestSessionKey
            }),
            onRehydrateStorage: (state) => {
                // This callback is fired right before rehydration
                // Ensure guestSessionKey exists, if not, generate one
                if (state && state.guestSessionKey === null) {
                    const newSessionKey = uuidv4();
                    state.guestSessionKey = newSessionKey;
                    // Directly update localStorage here if not updated by setGuestSessionKey
                    // This is handled implicitly by persist middleware on hydration.
                    console.log('Generated new guest session key:', newSessionKey);
                }
            },
        }
    )
);

// Ensure a session key is generated/set on initial load if none exists
// This will happen implicitly with the onRehydrateStorage callback of persist middleware.
// However, if the store is accessed before rehydration, the key might be null.
// A common pattern is to check for this in a useEffect or an initializer.
// For now, the onRehydrateStorage handles initial generation.
