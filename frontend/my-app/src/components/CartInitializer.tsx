// frontend/my-app/src/components/CartInitializer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore'; // Assuming you have useAuthStore

/**
 * CartInitializer Component
 * This component is responsible for initializing the cart state from the API
 * when the component mounts or when the user's authentication status changes.
 * It's a client component, intended to be rendered once at the top level
 * (e.g., in the layout or providers) to ensure cart data is synced.
 */
export default function CartInitializer() {
  const initializeCart = useCartStore((state) => state.initializeCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const session = useAuthStore((state) => state.user); // Assuming user object contains session info

  // Use a ref to ensure initializeCart is only called once per auth status change
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only fetch cart if authenticated and not already initialized for this session state
    if (isAuthenticated && !initializedRef.current) {
      console.log("CartInitializer: Authenticated, initializing cart...");
      initializeCart();
      initializedRef.current = true; // Mark as initialized for current authenticated state
    } else if (!isAuthenticated && initializedRef.current) {
      // If user logs out after being initialized, reset the ref for future login
      console.log("CartInitializer: User logged out, resetting initializer ref.");
      initializedRef.current = false;
    }
  }, [isAuthenticated, initializeCart, session?.user?.id]); // Added session?.user?.id to dependencies for robustness

  return null; // This component does not render anything
}

