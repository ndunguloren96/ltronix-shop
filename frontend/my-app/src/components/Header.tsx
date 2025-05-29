// src/components/Header.tsx
'use client';

// ADD VStack here
import { Box, Flex, Link as ChakraLink, Button, Stack, useMediaQuery, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure, VStack } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { HamburgerIcon } from '@chakra-ui/icons';
import { signOut, useSession } from 'next-auth/react'; // Import signOut and useSession

export const Header: React.FC = () => {
  const [isLargerThanMd] = useMediaQuery('(min-width: 48em)');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname(); // Get current pathname
  const { data: session, status } = useSession(); // Get session data

  // Determine if on login or signup page
  const isOnAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';

  return (
    <Box bg="brand.800" px={4} py={2} color="white">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {/* Logo */}
        <Link href="/" passHref>
          <ChakraLink display="flex" alignItems="center">
            <Image src="/ltronix_logo.png" alt="Ltronix Logo" width={120} height={40} />
          </ChakraLink>
        </Link>

        {isLargerThanMd ? (
          <>
            {/* Desktop Navigation Links */}
            <Stack direction="row" spacing={7} as="nav" alignItems="center">
              <Link href="/" passHref>
                <ChakraLink fontSize="lg" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                  Home
                </ChakraLink>
              </Link>
              <Link href="/products" passHref>
                <ChakraLink fontSize="lg" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                  Products
                </ChakraLink>
              </Link>
              <Link href="/cart" passHref>
                <ChakraLink fontSize="lg" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                  Cart
                </ChakraLink>
              </Link>
              <Link href="/about" passHref>
                <ChakraLink fontSize="lg" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                  About
                </ChakraLink>
              </Link>
              {/* Conditionally render Sign In/Up or Account/Logout buttons */}
              {!isOnAuthPage && ( // Only show these buttons if NOT on an auth page
                <>
                  {status === 'authenticated' ? (
                    <>
                      <Link href="/account" passHref>
                        <ChakraLink fontSize="lg" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                          Account
                        </ChakraLink>
                      </Link>
                      <Button
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                        colorScheme="red"
                        size="sm"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" passHref>
                        <Button colorScheme="brand" size="sm">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/signup" passHref>
                        <Button colorScheme="brand" size="sm">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </Stack>
          </>
        ) : (
          <>
            {/* Mobile Menu Button */}
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="outline"
              onClick={onOpen}
              color="white"
              borderColor="white"
              _hover={{ bg: 'brand.700' }}
            />
            <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
              <DrawerOverlay />
              <DrawerContent bg="brand.800" color="white">
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px" borderColor="brand.700">Navigation</DrawerHeader>
                <DrawerBody>
                  <VStack alignItems="flex-start" spacing={5}> {/* VStack is now correctly imported */}
                    <Link href="/" passHref>
                      <ChakraLink fontSize="xl" onClick={onClose}>
                        Home
                      </ChakraLink>
                    </Link>
                    <Link href="/products" passHref>
                      <ChakraLink fontSize="xl" onClick={onClose}>
                        Products
                      </ChakraLink>
                    </Link>
                    <Link href="/cart" passHref>
                      <ChakraLink fontSize="xl" onClick={onClose}>
                        Cart
                      </ChakraLink>
                    </Link>
                    <Link href="/about" passHref>
                      <ChakraLink fontSize="xl" onClick={onClose}>
                        About
                      </ChakraLink>
                    </Link>
                    {/* Conditionally render Sign In/Up or Account/Logout buttons in mobile */}
                    {!isOnAuthPage && ( // Only show these buttons if NOT on an auth page
                      <>
                        {status === 'authenticated' ? (
                          <>
                            <Link href="/account" passHref>
                              <ChakraLink fontSize="xl" onClick={onClose}>
                                Account
                              </ChakraLink>
                            </Link>
                            <Button
                              onClick={() => { signOut({ callbackUrl: '/auth/login' }); onClose(); }}
                              colorScheme="red"
                              width="full"
                            >
                              Logout
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link href="/auth/login" passHref>
                              <Button colorScheme="brand" width="full" onClick={onClose}>
                                Sign In
                              </Button>
                            </Link>
                            <Link href="/auth/signup" passHref>
                              <Button colorScheme="brand" width="full" onClick={onClose}>
                                Sign Up
                              </Button>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </>
        )}
      </Flex>
    </Box>
  );
};