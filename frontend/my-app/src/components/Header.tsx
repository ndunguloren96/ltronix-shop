// src/components/Header.tsx
'use client';

import React, { useState } from 'react';
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
  Link as ChakraLink,
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
import Link from 'next/link';
import { BsCartFill } from 'react-icons/bs';
import { signOut, useSession } from 'next-auth/react';

// Import your Zustand cart store
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  const [isLargerThanMd] = useMediaQuery('(min-width: 48em)');

  // Get total items from your cart store
  const totalItems = useCartStore((state) => state.items.length);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isOnAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';

  return (
    <Box bg={useColorModeValue('white', 'gray.800')} color={useColorModeValue('gray.600', 'white')}>
      <Flex
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        {/* Mobile Menu Button (Hamburger) - Leftmost */}
        {!isLargerThanMd && (
          <IconButton
            onClick={onOpen}
            icon={<HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Open Navigation'}
            display={{ base: 'flex', md: 'none' }}
          />
        )}

        {/* Logo - Pushed to the left */}
        <Flex flex={{ base: 1, md: 'unset' }} justify={{ base: 'center', md: 'start' }} align="center" mr={isLargerThanMd ? 10 : 0}>
          <Link href="/" passHref>
            <ChakraLink
              textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
              fontFamily={'heading'}
              color={useColorModeValue('gray.800', 'white')}
              cursor="pointer"
              _hover={{ textDecoration: 'none' }}
            >
              {/* You can replace this with your Image component from the current file if desired */}
              {/* <Image src="/ltronix_logo.png" alt="Ltronix Logo" width={120} height={40} /> */}
              <Text as="span" fontSize="xl" fontWeight="bold">Ltronix Shop</Text>
            </ChakraLink>
          </Link>
        </Flex>

        {/* Desktop Navigation Links - Centered between logo and search */}
        {isLargerThanMd && (
          <Flex flex={1} justify="center" ml={10} mr={4}> {/* Adjusted flex and margins */}
            <DesktopNav />
          </Flex>
        )}

        {/* Right side stack: Search, Cart, Auth Buttons */}
        <Stack
          flex={{ base: 1, md: 'unset' }} /* Adjust flex for mobile/desktop */
          justify={'flex-end'}
          direction={'row'}
          spacing={{ base: 2, md: 4 }}
          alignItems="center"
        >
          {/* Search Input and Button - Elongated as requested */}
          {isLargerThanMd && (
            <Box as="form" onSubmit={handleSearch} flex={1}> {/* Use flex:1 to make it take available space */}
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
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={handleSearch}>
                    <SearchIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
          )}

          {/* Cart Icon with Item Count */}
          <Link href={'/cart'} passHref>
            <ChakraLink
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
                >
                  {totalItems}
                </Badge>
              )}
            </ChakraLink>
          </Link>

          {/* Authentication Buttons (desktop) */}
          {!isOnAuthPage && isLargerThanMd && (
            <>
              {status === 'authenticated' ? (
                <>
                  <Link href="/account" passHref>
                    <Button as={ChakraLink} fontSize={'sm'} fontWeight={400} variant={'link'}>
                      Account
                    </Button>
                  </Link>
                  <Button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    colorScheme="red"
                    size="sm"
                    fontWeight={600}
                    color={'white'}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" passHref>
                    <Button as={ChakraLink} fontSize={'sm'} fontWeight={400} variant={'link'}>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" passHref>
                    <Button
                      as={ChakraLink}
                      display={{ base: 'none', md: 'inline-flex' }}
                      fontSize={'sm'}
                      fontWeight={600}
                      color={'white'}
                      bg={'blue.400'}
                      _hover={{ bg: 'blue.300' }}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </Stack>
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue('white', 'gray.800')} color={useColorModeValue('gray.800', 'white')}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack alignItems="flex-start" spacing={5}>
              {/* Mobile Search Bar in Drawer */}
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
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleSearch}>
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

              {/* Authentication Buttons for Mobile */}
              {!isOnAuthPage && (
                <>
                  {status === 'authenticated' ? (
                    <>
                      <Link href="/account" passHref>
                        <Button as={ChakraLink} fontSize="xl" width="full" onClick={onClose}>
                          Account
                        </Button>
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
                        <Button colorScheme="blue" width="full" onClick={onClose}>
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/signup" passHref>
                        <Button colorScheme="blue" width="full" onClick={onClose}>
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
    </Box>
  );
}

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
              <Link href={navItem.href ?? '#'} passHref>
                <ChakraLink
                  p={2}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={linkColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}
                >
                  {navItem.label}
                </ChakraLink>
              </Link>
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

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link href={href ?? '#'} passHref>
      <ChakraLink
        role={'group'}
        display={'block'}
        p={2}
        rounded={'md'}
        _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}
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
    </Link>
  );
};

interface MobileNavItemProps extends NavItem {
  icon?: React.ReactElement;
  badgeCount?: number;
  onClose: () => void;
}

const MobileNavItem = ({ label, children, href, icon, badgeCount, onClose }: MobileNavItemProps) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children ? onToggle : onClose}>
      <Flex
        py={2}
        as={Link}
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
        onClick={children ? undefined : onClose}
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
      </Flex>

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
              <Link href={child.href ?? '#'} key={child.label} passHref>
                <ChakraLink py={2} onClick={onClose}>
                  {child.label}
                </ChakraLink>
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Products',
    children: [
      {
        label: 'All Products',
        subLabel: 'Browse our entire collection',
        href: '/products',
      },
      {
        label: 'Laptops',
        subLabel: 'High-performance computing',
        href: '/products?category=laptops',
      },
      {
        label: 'Smartphones',
        subLabel: 'Latest mobile technology',
        href: '/products?category=smartphones',
      },
      {
        label: 'Accessories',
        subLabel: 'Enhance your devices',
        href: '/products?category=accessories',
      },
    ],
  },
  {
    label: 'Account',
    children: [
      {
        label: 'My Profile',
        subLabel: 'View and edit your personal details',
        href: '/account/profile',
      },
      {
        label: 'Order History',
        subLabel: 'Track your past and current orders',
        href: '/account/orders',
      },
      {
        label: 'Payment Methods',
        subLabel: 'Manage your payment information',
        href: '/account/payment',
      },
    ],
  },
  {
    label: 'Support',
    children: [
      {
        label: 'FAQ',
        subLabel: 'Frequently Asked Questions',
        href: '/support/faq',
      },
      {
        label: 'Contact Us',
        subLabel: 'Get in touch with our support team',
        href: '/support/contact',
      },
    ],
  },
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Privacy',
    href: '/privacy',
  },
];