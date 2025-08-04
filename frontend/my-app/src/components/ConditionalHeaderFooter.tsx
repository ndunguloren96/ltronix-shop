// frontend/my-app/src/components/ConditionalHeaderFooter.tsx
'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import React from 'react';

/**
 * A client-side component that conditionally renders the Header and Footer
 * based on the current URL path.
 *
 * It is marked with "use client" to allow the use of the `usePathname` hook.
 * The Header and Footer components are wrapped around the main children prop.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The main page content to be rendered.
 * @returns {JSX.Element} The rendered Header, Children, and Footer or just the Children.
 */
export default function ConditionalHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnAuthPage = pathname.startsWith('/auth');

  return (
    <>
      {!isOnAuthPage && <Header />}
      {children}
      {!isOnAuthPage && <Footer />}
    </>
  );
}


