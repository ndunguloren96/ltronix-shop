// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // Re-adding uuidv4 for self-contained key generation

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_file?: string;
}

interface CartState {
  items: CartItem[];
  guestSessionKey: string | null;
  isInitialized: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { image_file?: string }) => void;
  removeItem: (id: number) => void;
  updateItemQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setGuestSessionKey: (key: string | null) => void;
  setIsInitialized: (initialized: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestSessionKey: null,
      isInitialized: false,

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

      clearCart: () => set({ items: [], guestSessionKey: null, isInitialized: false }),

      setItems: (items) => set({ items: items }),

      setGuestSessionKey: (key) => set({ guestSessionKey: key }),

      setIsInitialized: (initialized) => set({ isInitialized: initialized }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'ltronix-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        items: state.items,
        guestSessionKey: state.guestSessionKey,
      }),
      // CRITICAL FIX: Use onRehydrateStorage to ensure a guest key exists
      onRehydrateStorage: () => {
        return (state) => {
          // Check if guestSessionKey is null or undefined after rehydration
          if (!state?.guestSessionKey) {
            console.log('No guest session key found in storage. Generating a new one...');
            // Generate a new UUID and set it in the state.
            const newKey = uuidv4();
            state?.setGuestSessionKey(newKey);
          } else {
            console.log('Existing guest session key found:', state.guestSessionKey);
          }
        };
      },
    }
  )
);
