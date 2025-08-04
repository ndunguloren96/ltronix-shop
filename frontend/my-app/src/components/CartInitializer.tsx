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
  const { initializeCart } = useCartStore();
  const { data: session, status } = useSession();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !initializedRef.current) {
      console.log("CartInitializer: Authenticated, initializing cart for user:", session.user.id);
      initializeCart();
      initializedRef.current = true;
    } else if (status === 'unauthenticated' && initializedRef.current) {
      console.log("CartInitializer: User logged out, resetting initializer ref.");
      initializedRef.current = false;
    }
  }, [initializeCart, session?.user?.id, status]);

  return null;
}

