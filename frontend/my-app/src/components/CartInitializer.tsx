// frontend/my-app/src/components/CartInitializer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useSession } from 'next-auth/react';

/**
 * CartInitializer Component
 * This component is responsible for initializing the cart state from the API
 * when the component mounts or when the user's authentication status changes.
 * It's a client component, intended to be rendered once at the top level
 * (e.g., in the layout or providers) to ensure cart data is synced.
 */
export default function CartInitializer() {
  // Use destructuring to correctly get the initializeCart action from the store
  const { initializeCart } = useCartStore();
  const { data: session, status } = useSession();

  // Use a ref to ensure initializeCart is only called once per authentication state
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only fetch cart if a user is authenticated and the initializer has not run for this session
    if (status === 'authenticated' && session?.user?.id && !initializedRef.current) {
      console.log("CartInitializer: Authenticated, initializing cart for user:", session.user.id);
      initializeCart();
      initializedRef.current = true; // Mark as initialized for the current authenticated session
    } else if (status === 'unauthenticated' && initializedRef.current) {
      // If user logs out, reset the ref so the cart can be initialized again on a new login
      console.log("CartInitializer: User logged out, resetting initializer ref.");
      initializedRef.current = false;
    }
  }, [initializeCart, session?.user?.id, status]); // Added status and session.user.id to dependencies

  return null; // This component does not render anything
}
