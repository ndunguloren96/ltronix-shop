// src/app/layout.tsx

import './globals.css';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer'; // Import the new Footer component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClientErrorBoundary } from '../components/ClientErrorBoundary';
import { ColorModeScript } from '@chakra-ui/react';
import chakraConfig from '../chakra.config';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ltronix Shop',
  description: 'Your one-stop shop for electronics',
};

// Define a separate component to handle the conditional rendering on the client side
function ConditionalLayout({ children }: { children: React.ReactNode }) {
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <ColorModeScript initialColorMode={chakraConfig.initialColorMode} />
        <ClientErrorBoundary>
          <AppProviders session={session}>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AppProviders>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}


