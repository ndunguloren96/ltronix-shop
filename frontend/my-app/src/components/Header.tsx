// src/components/Header.tsx

// This component uses client-side hooks (like useDisclosure) and interactive elements,
// so it must be marked as a client component in Next.js App Router.
'use client';

import {
  Box,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  IconButton,
  useDisclosure,
  HStack,
  Badge,
  Image,
  // Components for the mobile slide-out navigation drawer
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Link as ChakraLink // Alias Chakra UI's Link to prevent conflicts with Next.js's Link
} from '@chakra-ui/react';

// Icons used in the header for search and mobile menu.
import { SearchIcon, HamburgerIcon } from '@chakra-ui/icons';

// --- ShoppingCart Component ---
// Reusable component for displaying the cart icon with an item count badge.
// In a real application, you might use a dedicated icon library like 'react-icons' for a better icon.
const ShoppingCart = () => (
  <Box position="relative">
    <Text fontSize="xl">🛒</Text> {/* Placeholder: Emoji for a shopping cart */}
    <Badge
      position="absolute"
      top="-1"
      right="-1"
      fontSize="0.6em"
      colorScheme="brand"
      borderRadius="full"
      px="1.5"
    >
      0 {/* Placeholder for the actual number of items in the cart */}
    </Badge>
  </Box>
);

// --- Header Component ---
// This component forms the top navigation bar of the Ltronix Shop,
// adapting its layout for desktop and mobile devices.
export const Header = () => {
  // useDisclosure hook manages the open/close state for the mobile drawer.
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box bg="white" px={4} py={3} borderBottom="1px" borderColor="gray.200" boxShadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">

        {/* Logo Section */}
        <Box>
          {/* Logo image sourced from the /public directory. */}
          {/* Ensure 'ltronix_logo.png' is in your Next.js project's 'public/' folder. */}
          <Image src="/ltronix_logo.png" alt="Ltronix Logo" height="40px" />
        </Box>

        {/* Desktop Search Bar */}
        {/* Hidden on small screens (base) and visible on medium and larger screens (md). */}
        <InputGroup maxW="500px" display={{ base: 'none', md: 'block' }}>
          <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.300" />} />
          <Input type="text" placeholder="Search for products" borderRadius="md" />
        </InputGroup>

        {/* Desktop Navigation Links */}
        {/* These links appear only on desktop view. */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          {/* Main navigation buttons, mirroring Mikro Tech's top nav. */}
          <Button variant="ghost" colorScheme="gray">BROWSE CATEGORIES</Button>
          <Button variant="ghost" colorScheme="gray">PRODUCTS ON SALE!</Button>
          <Button variant="ghost" colorScheme="gray">TRACK YOUR ORDER</Button>
          <Button variant="ghost" colorScheme="gray">AFFILIATE PROGRAM</Button>
          <Button variant="link" colorScheme="brand">LOGIN REGISTER</Button>
          <HStack spacing={1}>
            <ShoppingCart />
            <Text fontSize="md">R0.00</Text>
          </HStack>
          <Button variant="ghost" colorScheme="gray">Contact Us</Button>
        </HStack>

        {/* Mobile Icons: Search, Cart, and Hamburger Menu */}
        {/* These icons are visible only on mobile screens. */}
        <Flex display={{ base: 'flex', md: 'none' }} alignItems="center">
          <IconButton aria-label="Search" icon={<SearchIcon />} variant="ghost" mr={2} />
          <ShoppingCart />
          {/* Hamburger icon triggers the mobile drawer to open. */}
          <IconButton
            aria-label="Open Menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onOpen}
          />
        </Flex>
      </Flex>

      {/* --- Mobile Navigation Drawer --- */}
      {/* A slide-out panel for navigation on mobile devices. */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay /> {/* Overlay to dim the background */}
        <DrawerContent>
          <DrawerCloseButton /> {/* Button to close the drawer */}
          <DrawerBody>
            {/* Vertical stack for all navigation links within the drawer. */}
            <VStack as="nav" spacing={4} mt={8} align="stretch">
              {/* Main navigation links that mirror desktop links. */}
              <ChakraLink href="#" py={2} onClick={onClose}>BROWSE CATEGORIES</ChakraLink>
              <ChakraLink href="#" py={2} onClick={onClose}>PRODUCTS ON SALE!</ChakraLink>
              <ChakraLink href="#" py={2} onClick={onClose}>TRACK YOUR ORDER</ChakraLink>
              <ChakraLink href="#" py={2} onClick={onClose}>AFFILIATE PROGRAM</ChakraLink>
              <ChakraLink href="#" py={2} onClick={onClose}>LOGIN REGISTER</ChakraLink>
              <ChakraLink href="#" py={2} onClick={onClose}>Contact Us</ChakraLink>

              {/* Category section, mirroring the Mikro Tech sidebar structure. */}
              <Box py={2} borderTop="1px" borderColor="gray.200" mt={4}>
                <Text fontWeight="bold" mb={2}>Categories</Text>
                <VStack align="stretch" pl={2}>
                  {/* Placeholder category links. Replace '#' with actual category routes. */}
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Cameras</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Cellphones & Tablets</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Computers & Laptops</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Drones & RC Toys</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Gaming Consoles</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Headphones & Speakers</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Printers & 3D Printers</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Smart Home Appliances</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Smart Watches</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Software & Games</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Studio Equipment</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Televisions & Projectors</ChakraLink>
                  <ChakraLink href="#" py={1} fontSize="sm" onClick={onClose}>Virtual Reality</ChakraLink>
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};