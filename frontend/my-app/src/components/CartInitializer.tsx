// src/components/CartInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '../store/useCartStore'; // Import your Zustand store
import { fetchUserCart, mergeGuestCart } from '../api/cart'; // Import new API functions
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating guest session keys

// Helper to convert CartItem from local store format to backend API format
const toBackendCartItem = (item: { id: number; quantity: number }) => ({
  product_id: item.id,
  quantity: item.quantity,
});

export function CartInitializer() {
  const { data: session, status } = useSession(); // NextAuth.js session hook
  const {
    items: localCartItems,
    guestSessionKey,
    setItems,
    setGuestSessionKey,
    isInitialized,
    setIsInitialized,
    clearCart, // To clear the local cart when needed
  } = useCartStore(); // Your Zustand cart store

  useEffect(() => {
    const syncCartWithAuth = async () => {
      console.log('CartInitializer: Running syncCartWithAuth. Status:', status, 'isInitialized:', isInitialized);

      // Prevent re-running if session is still loading
      if (status === 'loading') {
        return;
      }

      // If already initialized for the current session type, prevent re-running
      // This is a simple check, more complex scenarios might need a more robust mechanism
      if (isInitialized && (
        (status === 'authenticated' && session?.user?.id) ||
        (status === 'unauthenticated' && guestSessionKey)
      )) {
        return;
      }

      if (status === 'authenticated') {
        // Check if there's a guest cart in local storage that needs merging
        if (guestSessionKey && localCartItems.length > 0) {
          console.log('CartInitializer: Authenticated user with existing guest cart. Attempting to merge...');
          try {
            const mergedBackendCart = await mergeGuestCart(
              guestSessionKey,
              localCartItems.map(toBackendCartItem)
            );
            if (mergedBackendCart && mergedBackendCart.orders && mergedBackendCart.orders.length > 0 && mergedBackendCart.orders[0].items) {
              setItems(mergedBackendCart.orders[0].items.map((item: any) => ({
                  id: item.product.id,
                  name: item.product.name,
                  price: parseFloat(item.product.price),
                  quantity: item.quantity,
                  image_url: item.product.image_url,
              })));
            } else {
              setItems([]);
            }
            setGuestSessionKey(null); // Clear guest key after successful merge
            console.log('CartInitializer: Guest cart merged successfully, local guest key cleared.');
          } catch (error) {
            console.error('CartInitializer: Error merging guest cart:', error);
            // Fallback: try to load the user's existing cart from backend
            try {
              const userBackendCart = await fetchUserCart();
              if (userBackendCart && userBackendCart.orders && userBackendCart.orders.length > 0 && userBackendCart.orders[0].items) {
                setItems(userBackendCart.orders[0].items.map((item: any) => ({
                  id: item.product.id,
                  name: item.product.name,
                  price: parseFloat(item.product.price),
                  quantity: item.quantity,
                  image_url: item.product.image_url,
                })));
                setGuestSessionKey(null); // Still clear the guest key to avoid re-attempting merge
                console.log('CartInitializer: Fallback: Fetched user cart after merge failure.');
              } else {
                console.log('CartInitializer: Fallback: No user cart found after merge failure, clearing local cart.');
                clearCart();
              }
            } catch (fetchError) {
              console.error('CartInitializer: Failed to fetch user cart after merge failure:', fetchError);
              clearCart();
            }
          }
        } else {
          // User is authenticated, and no guest cart to merge (or it was empty)
          // Just fetch the authenticated user's cart from the backend
          console.log('CartInitializer: Authenticated user, no local guest cart to merge. Fetching user cart...');
          try {
            const userBackendCart = await fetchUserCart();
            if (userBackendCart && userBackendCart.orders && userBackendCart.orders.length > 0 && userBackendCart.orders[0].items) {
              setItems(userBackendCart.orders[0].items.map((item: any) => ({
                id: item.product.id,
                name: item.product.name,
                price: parseFloat(item.product.price),
                quantity: item.quantity,
                image_url: item.product.image_url,
              })));
              setGuestSessionKey(null); // Ensure guest key is null for authenticated users
              console.log('CartInitializer: Fetched authenticated user cart.');
            } else {
              console.log('CartInitializer: No authenticated user cart found, clearing local cart.');
              clearCart();
            }
          } catch (error) {
            console.error('CartInitializer: Error fetching authenticated user cart:', error);
            clearCart();
          }
        }
        setIsInitialized(true); // Mark as initialized for authenticated state
      } else if (status === 'unauthenticated') {
        // Ensure a guest session key exists for unauthenticated users
        if (!guestSessionKey) {
          const newKey = uuidv4();
          setGuestSessionKey(newKey);
          console.log('CartInitializer: Unauthenticated user, generated new guest session key:', newKey);
        }
        setIsInitialized(true); // Mark as initialized for unauthenticated state
        // For unauthenticated users, the cart state in local storage (guest cart) persists automatically.
        // No need to fetch/clear unless you want to explicitly clear items on logout (if they were authenticated items).
        // For now, we assume local items persist for guest.
      }
    };

    syncCartWithAuth();
  }, [status, guestSessionKey, localCartItems, setItems, setGuestSessionKey, isInitialized, setIsInitialized, clearCart]);

  // This component doesn't render any UI, it's purely for side effects.
  return null;
}
