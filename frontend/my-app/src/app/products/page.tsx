// src/app/products/page.tsx
'use client';

import React from 'react'; // Import React for useState, useEffect, useRef
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  // Image, // Image is not directly used in this page component's main JSX, so it can be removed if desired
  Flex,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Checkbox,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Input, // ADD THIS FOR THE SEARCH INPUT
  InputGroup, // ADD THIS FOR INPUT STYLING
  InputLeftElement, // ADD THIS FOR SEARCH ICON
} from '@chakra-ui/react';
import { ProductCard } from '@/components/ProductCard';
import { SearchIcon } from '@chakra-ui/icons'; // ADD THIS FOR THE SEARCH ICON
import Fuse from 'fuse.js'; // ADD THIS IMPORT FOR FUSE.JS

// Updated Placeholder data for products with actual brands (NO CHANGE HERE)
const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro Max', price: 'Ksh180,000.00', category: 'Cellphones & Tablets', brand: 'iPhone', imageUrl: 'https://via.placeholder.com/250/200?text=iPhone+15' },
  { id: '2', name: 'Samsung Galaxy S24 Ultra', price: 'Ksh150,000.00', category: 'Cellphones & Tablets', brand: 'Samsung', imageUrl: 'https://via.placeholder.com/250/200?text=Galaxy+S24' },
  { id: '3', name: 'Dell XPS 15 Laptop', price: 'Ksh130,000.00', category: 'Computers & Laptops', brand: 'Dell', imageUrl: 'https://via.placeholder.com/250/200?text=Dell+XPS' },
  { id: '4', name: 'Xiaomi Redmi Note 13', price: 'Ksh25,000.00', category: 'Cellphones & Tablets', brand: 'Xiaomi', imageUrl: 'https://via.placeholder.com/250/200?text=Redmi+Note' },
  { id: '5', name: 'Oraimo FreePods 4', price: 'Ksh3,500.00', category: 'Headphones & Speakers', brand: 'Oraimo', imageUrl: 'https://via.placeholder.com/250/200?text=Oraimo+Pods' },
  { id: '6', name: 'Hisense 55" Smart 4K TV', price: 'Ksh65,000.00', category: 'Televisions & Projectors', brand: 'Hisense', imageUrl: 'https://via.placeholder.com/250/200?text=Hisense+TV' },
  { id: '7', name: 'Samsung Galaxy Tab S9', price: 'Ksh80,000.00', category: 'Cellphones & Tablets', brand: 'Samsung', imageUrl: 'https://via.placeholder.com/250/200?text=Galaxy+Tab' },
  { id: '8', name: 'Dell Inspiron 14', price: 'Ksh75,000.00', category: 'Computers & Laptops', brand: 'Dell', imageUrl: 'https://via.placeholder.com/250/200?text=Inspiron+14' },
  { id: '9', name: 'Android Smartwatch', price: 'Ksh8,000.00', category: 'Smart Watches', brand: 'Android', imageUrl: 'https://via.placeholder.com/250/200?text=Android+Watch' },
  { id: '10', name: 'Oraimo Bluetooth Speaker', price: 'Ksh2,000.00', category: 'Headphones & Speakers', brand: 'Oraimo', imageUrl: 'https://via.placeholder.com/250/200?text=Oraimo+Speaker' },
  { id: '11', name: 'Xiaomi Mi Band 8', price: 'Ksh4,000.00', category: 'Smart Watches', brand: 'Xiaomi', imageUrl: 'https://via.placeholder.com/250/200?text=Mi+Band' },
  { id: '12', name: 'Hisense Refrigerator', price: 'Ksh45,000.00', category: 'Smart Home Appliances', brand: 'Hisense', imageUrl: 'https://via.placeholder.com/250/200?text=Hisense+Fridge' },
];

// Helper function to extract and format numeric prices (NO CHANGE HERE)
const getNumericPrice = (priceString: string): number => {
  return parseFloat(priceString.replace('Ksh', '').replace(/,/g, ''));
};

// Fuse.js options for fuzzy searching (customize as needed)
const fuseOptions = {
  keys: [
    'name', // Search by product name
    'category', // Search by category name
    'brand', // Search by brand name
  ],
  threshold: 0.3, // Fuzziness (0.0 = perfect match, 1.0 = any match)
  includeScore: true, // Useful for debugging or sorting by relevance
};

export default function ProductsPage() {
  // Filter states (NO CHANGE HERE)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<number[]>([0, 180000]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  // ADD THESE NEW STATES FOR SEARCH
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState<string>('');

  // useRef to hold the timeout ID for debounce
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // useEffect to debounce the search term
  React.useEffect(() => {
    // Clear the previous timeout if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to update the debounced search term after 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce time

    // Cleanup function to clear the timeout if the component unmounts or searchTerm changes before timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]); // Re-run effect whenever searchTerm changes


  // Initialize Fuse.js instance with mock products
  const fuse = React.useMemo(() => new Fuse(mockProducts, fuseOptions), [mockProducts]);

  // Get unique categories and brands, and max/min price (NO CHANGE HERE)
  const allCategories = Array.from(new Set(mockProducts.map(p => p.category)));
  const allBrands = Array.from(new Set(mockProducts.map(p => p.brand)));
  const maxPrice = Math.max(...mockProducts.map(p => getNumericPrice(p.price)));
  const minPrice = Math.min(...mockProducts.map(p => getNumericPrice(p.price)));

  // Combined Filtering and Search Logic
  const filteredAndSearchedProducts = React.useMemo(() => {
    let productsToFilter = mockProducts;

    // Apply Search first if debouncedSearchTerm is present
    if (debouncedSearchTerm) {
      // Fuse.js search returns an array of objects with a 'item' property
      const searchResults = fuse.search(debouncedSearchTerm);
      productsToFilter = searchResults.map(result => result.item);
    }

    // Then apply category, price, and brand filters to the search results (or all products)
    return productsToFilter.filter(product => {
      const productPrice = getNumericPrice(product.price);

      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      return categoryMatch && priceMatch && brandMatch;
    });
  }, [debouncedSearchTerm, selectedCategories, priceRange, selectedBrands, fuse]); // Dependencies for useMemo

  // Handlers for filter changes (NO CHANGE HERE)
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  return (
    <Container maxW="7xl" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        All Products
      </Heading>

      {/* ADD THE SEARCH INPUT HERE */}
      <Box mb={6} width={{ base: 'full', md: '75%', lg: '50%' }} mx="auto">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="Search for products by name, category, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
            borderRadius="lg"
            variant="filled"
          />
        </InputGroup>
      </Box>

      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Filter Sidebar (NO CHANGE HERE) */}
        <Box
          w={{ base: 'full', md: '250px' }}
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          boxShadow="sm"
          mb={{ base: 6, md: 0 }}
        >
          <Heading as="h2" size="md" mb={4}>
            Filters
          </Heading>
          <Accordion allowMultiple defaultIndex={[0, 1, 2]}>

            {/* Category Filter */}
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Category
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack align="flex-start">
                  {allCategories.map(category => (
                    <Checkbox
                      key={category}
                      isChecked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      colorScheme="brand"
                    >
                      {category}
                    </Checkbox>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Price Range Filter */}
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Price Range
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Box pt={4} pb={2}>
                  <RangeSlider
                    aria-label={['min price', 'max price']}
                    defaultValue={[minPrice, maxPrice]}
                    min={minPrice}
                    max={maxPrice}
                    step={100}
                    value={priceRange}
                    onChangeEnd={setPriceRange}
                    colorScheme="brand"
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <Flex justifyContent="space-between" mt={2}>
                    <Text fontSize="sm">Ksh{priceRange[0].toLocaleString()}</Text>
                    <Text fontSize="sm">Ksh{priceRange[1].toLocaleString()}</Text>
                  </Flex>
                </Box>
              </AccordionPanel>
            </AccordionItem>

            {/* Brand Filter */}
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Brand
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack align="flex-start">
                  {allBrands.map(brand => (
                    <Checkbox
                      key={brand}
                      isChecked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      colorScheme="brand"
                    >
                      {brand}
                    </Checkbox>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>

          </Accordion>
        </Box>

        {/* Product Grid Area - NOW USING filteredAndSearchedProducts */}
        <Box flex="1">
          {filteredAndSearchedProducts.length === 0 ? (
            <Text fontSize="xl" textAlign="center" mt={10} color="gray.500">
              No products match your current filters or search.
            </Text>
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
              spacing={6}
            >
              {filteredAndSearchedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Flex>
    </Container>
  );
}