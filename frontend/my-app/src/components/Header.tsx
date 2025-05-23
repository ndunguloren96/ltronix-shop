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
  Badge, // Import Badge for the item count
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { BsCartFill } from 'react-icons/bs'; // Import cart icon

// Import your Zustand cart store
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Get total items from your cart store
  const totalItems = useCartStore((state) => state.items.length); // Assuming 'items' is an array in your cart store

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }} align="center">
          <Text
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            onClick={() => router.push('/')}
            cursor="pointer"
          >
            Ltronix Shop
          </Text>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          // Adjusted spacing to make room for the cart
          // You can play with this value (e.g., from 6 to 3 or 4) to find the perfect fit.
          spacing={{ base: 2, md: 4 }}
          alignItems="center"
        >
          {/* Search Input and Button */}
          <Box as="form" onSubmit={handleSearch} width={{ base: '100%', md: '250px' }} mr={2}> {/* Slightly reduced width and margin-right */}
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

          {/* Cart Icon with Item Count */}
          <Button
            as={'a'}
            href={'/cart'} // Link to your cart page
            variant={'ghost'}
            position="relative"
            p={0} // Remove default padding for better control
            _hover={{ bg: 'transparent' }} // Keep it subtle on hover
            _active={{ bg: 'transparent' }} // Keep it subtle on active
            aria-label="Shopping Cart"
          >
            <Icon as={BsCartFill} w={5} h={5} /> {/* Cart icon */}
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
          </Button>

          <Button as={'a'} fontSize={'sm'} fontWeight={400} variant={'link'} href={'/auth/login'}>
            Sign In
          </Button>
          <Button
            as={'a'}
            display={{ base: 'none', md: 'inline-flex' }}
            fontSize={'sm'}
            fontWeight={600}
            color={'white'}
            bg={'blue.400'}
            href={'/auth/signup'}
            _hover={{
              bg: 'blue.300',
            }}
          >
            Sign Up
          </Button>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
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
              <Box
                as="a"
                p={2}
                href={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
              >
                {navItem.label}
              </Box>
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
    <Box
      as="a"
      href={href}
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
    </Box>
  );
};

const MobileNav = () => {
  // Mobile nav also needs cart info for consistency
  const totalItems = useCartStore((state) => state.items.length); // Get total items for mobile view

  return (
    <Stack bg={useColorModeValue('white', 'gray.800')} p={4} display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
      {/* Add Cart link for Mobile Nav */}
      <MobileNavItem
        label="My Cart"
        href="/cart"
        icon={<Icon as={BsCartFill} />} // Add icon for mobile cart link
        badgeCount={totalItems} // Pass totalItems for badge
      />
    </Stack>
  );
};

interface MobileNavItemProps extends NavItem {
    icon?: React.ReactElement; // Allow an optional icon for mobile nav items
    badgeCount?: number; // Allow an optional badge count for mobile nav items (e.g., for cart)
}

const MobileNavItem = ({ label, children, href, icon, badgeCount }: MobileNavItemProps) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as="a"
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
      >
        <Flex align="center"> {/* Use Flex to align icon and text */}
          {icon && <Box mr={2}>{icon}</Box>} {/* Render icon if provided */}
          <Text fontWeight={600} color={useColorModeValue('gray.600', 'gray.200')}>
            {label}
          </Text>
        </Flex>
        {badgeCount !== undefined && badgeCount > 0 && ( // Display badge if count exists and is > 0
            <Badge
                ml="2" // Margin left for spacing from text
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
              <Box as="a" key={child.label} py={2} href={child.href}>
                {child.label}
              </Box>
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
        href: '/products?category=laptops', // Example with query param
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
        href: '/account/orders', // Assuming you'll add an orders page
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