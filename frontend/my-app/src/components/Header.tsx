// frontend/my-app/src/components/Header.tsx
'use client';

import React, { useState, useCallback } from 'react'; // Added useCallback
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Input,
  InputGroup,
  InputRightElement,
  Badge,
  Link as ChakraLink, // Aliasing Chakra UI's Link to avoid conflict with Next.js Link
  useMediaQuery,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import { useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link'; // Renamed Next.js Link to NextLink to prevent conflict with ChakraLink
import { BsCartFill } from 'react-icons/bs';
import { signOut, useSession } from 'next-auth/react';

// Import your Zustand cart store
import { useCartStore } from '@/store/useCartStore';

// NavItem interface definition (moved here for self-containment)
interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

// NAV_ITEMS array definition (moved here for self-containment)
const NAV_ITEMS: Array<NavItem> = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    children: [
      { label: 'All Products', subLabel: 'Browse our entire collection', href: '/products' },
      { label: 'Laptops', subLabel: 'High-performance computing', href: '/products?category=laptops' },
      { label: 'Smartphones', subLabel: 'Latest mobile technology', href: '/products?category=smartphones' },
      { label: 'Accessories', subLabel: 'Enhance your devices', href: '/products?category=accessories' },
    ],
  },
  {
    label: 'Account',
    children: [
      { label: 'My Profile', subLabel: 'View and edit your personal details', href: '/account/profile' },
      { label: 'Order History', subLabel: 'Track your past and current orders', href: '/account/orders' },
      { label: 'Payment Methods', subLabel: 'Manage your payment information', href: '/account/payment' },
    ],
  },
  {
    label: 'Support',
    children: [
      { label: 'FAQ', subLabel: 'Frequently Asked Questions', href: '/support/faq' },
      { label: 'Contact Us', subLabel: 'Get in touch with our support team', href: '/support/contact' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
];


export default function Header() {
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  // Chakra UI's 'md' breakpoint is 48em (768px). This hook determines if the screen is wider than that.
  const [isLargerThanMd] = useMediaQuery('(min-width: 48em)');

  // Get total items from your cart store for the badge
  const totalItems = useCartStore((state) => state.items.length);

  // useCallback to memoize the handleSearch function, preventing unnecessary re-renders
  const handleSearch = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Close mobile drawer after search if it's open
      if (!isLargerThanMd) {
        onClose();
      }
    }
  }, [searchQuery, router, isLargerThanMd, onClose]); // Dependencies for useCallback

  // Determine if the current page is one of the authentication pages
  const isOnAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';

  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      color={useColorModeValue('gray.600', 'white')}
      position="sticky" // Make header sticky
      top="0"
      zIndex="sticky" // Ensure header stays on top of other content
      boxShadow="sm" // Add a subtle shadow
    >
      <Flex
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        {/* Mobile Menu Button (Hamburger) - Visible only on smaller screens */}
        {!isLargerThanMd && (
          <IconButton
            onClick={onOpen} // Opens the Drawer
            icon={<HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Open Navigation'}
            display={{ base: 'flex', md: 'none' }}
          />
        )}

        {/* Logo - Pushed to the left */}
        <Flex
          flex={{ base: 1, md: 'unset' }}
          justify={{ base: 'center', md: 'start' }}
          align="center"
          mr={isLargerThanMd ? 10 : 0}
        >
          {/* Use ChakraLink as NextLink with passHref for proper Next.js routing and accessibility */}
          <ChakraLink
            as={NextLink}
            href="/"
            passHref
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            cursor="pointer"
            _hover={{ textDecoration: 'none' }}
            aria-label="Ltronix Shop Home"
          >
            <Text as="span" fontSize="xl" fontWeight="bold">Ltronix Shop</Text>
          </ChakraLink>
        </Flex>

        {/* Desktop Navigation Links - Centered between logo and search, visible only on larger screens */}
        {isLargerThanMd && (
          <Flex flex={1} justify="center" ml={10} mr={4}>
            <DesktopNav />
          </Flex>
        )}

        {/* Right side stack: Search, Cart, Auth Buttons */}
        <Stack
          flex={{ base: 1, md: 'unset' }}
          justify={'flex-end'}
          direction={'row'}
          spacing={{ base: 2, md: 4 }}
          alignItems="center"
        >
          {/* Search Input and Button - Visible only on larger screens */}
          {isLargerThanMd && (
            <Box as="form" onSubmit={handleSearch} flex={1}>
              <InputGroup size="md">
                <Input
                  pr="4.5rem"
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  color={useColorModeValue('gray.800', 'white')}
                  bg={useColorModeValue('gray.100', 'gray.700')}
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                  _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
                  width="100%"
                  aria-label="Search products input"
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={handleSearch} aria-label="Search button">
                    <SearchIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
          )}

          {/* Cart Icon with Item Count */}
          <ChakraLink
            as={NextLink}
            href={'/cart'}
            passHref
            variant={'ghost'}
            position="relative"
            p={0}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            aria-label="Shopping Cart"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={BsCartFill} w={5} h={5} />
            {totalItems > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                fontSize="0.7em"
                colorScheme="red"
                borderRadius="full"
                px="1"
                lineHeight="1"
                aria-label={`${totalItems} items in cart`}
              >
                {totalItems}
              </Badge>
            )}
          </ChakraLink>

          {/* Authentication Buttons (desktop) - Hidden on auth pages and mobile */}
          {!isOnAuthPage && isLargerThanMd && (
            <>
              {status === 'authenticated' ? (
                <>
                  <Button as={ChakraLink} fontSize={'sm'} fontWeight={400} variant={'link'} href="/account" aria-label="Account settings">
                    Account
                  </Button>
                  <Button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    colorScheme="red"
                    size="sm"
                    fontWeight={600}
                    color={'white'}
                    aria-label="Logout"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={ChakraLink} fontSize={'sm'} fontWeight={400} variant={'link'} href="/auth/login" aria-label="Sign In">
                    Sign In
                  </Button>
                  <Button
                    as={ChakraLink}
                    href="/auth/signup"
                    display={{ base: 'none', md: 'inline-flex' }}
                    fontSize={'sm'}
                    fontWeight={600}
                    color={'white'}
                    bg={'blue.400'}
                    _hover={{ bg: 'blue.300' }}
                    aria-label="Sign Up"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </>
          )}
        </Stack>
      </Flex>

      {/* Mobile Navigation Drawer - Hidden on desktop, slides in from right */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue('white', 'gray.800')} color={useColorModeValue('gray.800', 'white')}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack alignItems="flex-start" spacing={5}>
              {/* Mobile Search Bar in Drawer - Visible only on mobile */}
              {!isLargerThanMd && (
                <Box as="form" onSubmit={handleSearch} width="full">
                  <InputGroup size="md">
                    <Input
                      pr="4.5rem"
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      color={useColorModeValue('gray.800', 'white')}
                      bg={useColorModeValue('gray.100', 'gray.700')}
                      borderColor={useColorModeValue('gray.300', 'gray.600')}
                      _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
                      width="100%"
                      aria-label="Search products input (mobile)"
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleSearch} aria-label="Search button (mobile)">
                        <SearchIcon />
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </Box>
              )}

              {/* Dynamically generated Mobile Nav Items from NAV_ITEMS */}
              {NAV_ITEMS.map((navItem) => (
                <MobileNavItem key={navItem.label} {...navItem} onClose={onClose} />
              ))}

              {/* Cart link for Mobile Nav with Badge */}
              <MobileNavItem
                label="My Cart"
                href="/cart"
                icon={<Icon as={BsCartFill} />}
                badgeCount={totalItems}
                onClose={onClose}
              />

              {/* Authentication Buttons for Mobile - Hidden on auth pages */}
              {!isOnAuthPage && (
                <>
                  {status === 'authenticated' ? (
                    <>
                      <Button as={ChakraLink} fontSize="xl" width="full" onClick={onClose} href="/account" aria-label="Account settings (mobile)">
                        Account
                      </Button>
                      <Button
                        onClick={() => { signOut({ callbackUrl: '/auth/login' }); onClose(); }}
                        colorScheme="red"
                        width="full"
                        aria-label="Logout (mobile)"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button as={ChakraLink} colorScheme="blue" width="full" onClick={onClose} href="/auth/login" aria-label="Sign In (mobile)">
                        Sign In
                      </Button>
                      <Button as={ChakraLink} colorScheme="blue" width="full" onClick={onClose} href="/auth/signup" aria-label="Sign Up (mobile)">
                        Sign Up
                      </Button>
                    </>
                  )}
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

// Desktop Sub-Navigation Component
const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <ChakraLink
                as={NextLink}
                href={navItem.href ?? '#'}
                passHref
                p={2}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
                aria-label={`Navigate to ${navItem.label}`}
              >
                {navItem.label}
              </ChakraLink>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

// Desktop Sub-Navigation Item Component
const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <ChakraLink
      as={NextLink}
      href={href ?? '#'}
      passHref
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}
      aria-label={`Navigate to ${label}`}
    >
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'blue.400' }}
            fontWeight={500}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </ChakraLink>
  );
};

// Mobile Nav Item Props interface
interface MobileNavItemProps extends NavItem {
  icon?: React.ReactElement;
  badgeCount?: number;
  onClose: () => void; // Callback to close the drawer
}

// Mobile Navigation Item Component
const MobileNavItem = ({ label, children, href, icon, badgeCount, onClose }: MobileNavItemProps) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children ? onToggle : undefined}> {/* Only toggle if has children */}
      <ChakraLink
        as={NextLink}
        href={href ?? '#'}
        passHref
        py={2}
        justifyContent={'space-between'}
        alignItems={'center'}
        _hover={{ textDecoration: 'none' }}
        onClick={children ? undefined : onClose} // Close drawer if it's a direct link
        display="flex"
        aria-label={`Navigate to ${label}`}
      >
        <Flex align="center">
          {icon && <Box mr={2}>{icon}</Box>}
          <Text fontWeight={600} color={useColorModeValue('gray.600', 'gray.200')}>
            {label}
          </Text>
        </Flex>
        {badgeCount !== undefined && badgeCount > 0 && (
          <Badge
            ml="2"
            fontSize="0.8em"
            colorScheme="red"
            borderRadius="full"
            px="2"
            lineHeight="1"
            aria-label={`${badgeCount} items`}
          >
            {badgeCount}
          </Badge>
        )}
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </ChakraLink>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}
        >
          {children &&
            children.map((child) => (
              <ChakraLink
                as={NextLink}
                href={child.href ?? '#'}
                key={child.label}
                passHref
                py={2}
                onClick={onClose} // Close drawer when sub-item is clicked
                aria-label={`Navigate to ${child.label}`}
              >
                {child.label}
              </ChakraLink>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

