// frontend/my-app/src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Removed uuidv4 import here, as key generation is now managed externally by CartInitializer.

interface CartItem {
    id: number; // Product ID (number, consistent with your fixes)
    name: string;
    price: number;
    quantity: number;
    image_file?: string; // Consistent with your fixes
}

interface CartState {
    items: CartItem[];
    guestSessionKey: string | null; // Session key for unauthenticated users
    isInitialized: boolean; // NEW: Flag to indicate if the cart state has been synced with auth status

    // Actions
    addItem: (item: Omit<CartItem, 'quantity'> & { image_file?: string }) => void;
    removeItem: (id: number) => void;
    updateItemQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setGuestSessionKey: (key: string | null) => void;
    setIsInitialized: (initialized: boolean) => void; // NEW: Setter for initialization flag
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            guestSessionKey: null,
            isInitialized: false, // Default to false, indicating initial sync is needed

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

            clearCart: () => set({ items: [], guestSessionKey: null, isInitialized: false }), // Reset isInitialized

            setItems: (items) => set({ items: items }),

            setGuestSessionKey: (key) => set({ guestSessionKey: key }),

            setIsInitialized: (initialized) => set({ isInitialized: initialized }), // Implement new setter

            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        }),
        {
            name: 'ltronix-cart-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                guestSessionKey: state.guestSessionKey,
            }),
            // onRehydrateStorage will now NOT generate a new key.
            // The CartInitializer component will handle key generation based on auth status.
            onRehydrateStorage: (state) => {
                // You can still log here for debugging, but avoid modifying state directly for key generation.
                // console.log('Zustand store rehydrated. Guest session key:', state?.guestSessionKey);
            },
        }
    )
);
