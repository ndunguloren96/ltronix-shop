'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

export default function LogoutPage() {
  const router = useRouter();
  const authLogout = useAuthStore((state) => state.logout);
  const cartClear = useCartStore((state) => state.clearCart);

  useEffect(() => {
    const performLogout = async () => {
      // Clear NextAuth.js session
      await signOut({ redirect: false });

      // Clear Zustand auth store
      authLogout();

      // Clear Zustand cart store (especially guest session key)
      cartClear();

      // Redirect to login page
      router.push('/auth/login');
    };

    performLogout();
  }, [router, authLogout, cartClear]);

  return (
    <Center minH="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="brand.500" />
        <Text fontSize="xl">Logging you out...</Text>
      </VStack>
    </Center>
  );
}
