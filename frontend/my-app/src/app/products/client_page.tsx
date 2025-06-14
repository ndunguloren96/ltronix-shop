// src/app/products/client_page.tsx
'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
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
  Input,
  InputGroup,
  InputLeftElement,
  Button,
} from '@chakra-ui/react';
import { ProductCard } from '@/components/ProductCard';
import { SearchIcon } from '@chakra-ui/icons';
import Fuse from 'fuse.js';

// Define the Product type based on your Django API response
// Ensure these fields match your Django Product model and serializer
export interface Product {
  id: string; // Django PK/ID, ensure it's treated as a string for consistency
  name: string;
  price: string; // Django's DecimalField often comes as a string in JSON
  description: string;
  image_url?: string; // Optional image URL from Django
  category: string; // Assuming your Django product has a category field
  brand: string;   // Assuming your Django product has a brand field
}

interface ProductsClientPageProps {
  initialProducts: Product[];
}

const getNumericPrice = (priceString: string): number => {
  // Handles 'Ksh180,000.00' format from mock data, but will need adjustment if Django returns pure numbers/decimals
  // If Django returns a clean number string, this can be simpler: return parseFloat(priceString);
  return parseFloat(priceString.replace('Ksh', '').replace(/,/g, ''));
};


const fuseOptions = {
  keys: ['name', 'category', 'brand', 'description'], // Added description for better search
  threshold: 0.3,
  includeScore: true,
};

const PRODUCTS_PER_PAGE = 8; // Define how many products to show initially / load per click

export default function ProductsClientPage({ initialProducts }: ProductsClientPageProps) {
  // Use initialProducts as the source of truth for all products
  const allProducts = React.useMemo(() => initialProducts, [initialProducts]);

  // Filter states
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<number[]>(() => {
    // Initialize price range based on actual fetched products
    if (allProducts.length === 0) return [0, 100000]; // Default if no products
    const prices = allProducts.map(p => getNumericPrice(p.price));
    return [Math.min(...prices), Math.max(...prices)];
  });
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  // Search states
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState<string>('');

  // Pagination state
  const [visibleProductsCount, setVisibleProductsCount] = React.useState(PRODUCTS_PER_PAGE);

  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Reset visible products count whenever filters or search terms change
  React.useEffect(() => {
    setVisibleProductsCount(PRODUCTS_PER_PAGE);
  }, [debouncedSearchTerm, selectedCategories, priceRange, selectedBrands]);

  // Re-initialize Fuse.js when allProducts changes (i.e., when new initialProducts are loaded)
  const fuse = React.useMemo(() => new Fuse(allProducts, fuseOptions), [allProducts]);

  // Derive filter options dynamically from allProducts
  const allCategories = React.useMemo(() => Array.from(new Set(allProducts.map(p => p.category))), [allProducts]);
  const allBrands = React.useMemo(() => Array.from(new Set(allProducts.map(p => p.brand))), [allProducts]);
  const maxPrice = React.useMemo(() => allProducts.length > 0 ? Math.max(...allProducts.map(p => getNumericPrice(p.price))) : 180000, [allProducts]);
  const minPrice = React.useMemo(() => allProducts.length > 0 ? Math.min(...allProducts.map(p => getNumericPrice(p.price))) : 0, [allProducts]);

  // Adjust priceRange if maxPrice changes (e.g., if new products loaded have higher prices)
  React.useEffect(() => {
    // Only adjust if current max is less than new max, or vice-versa
    if (priceRange[1] > maxPrice || priceRange[0] < minPrice) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice]);


  const filteredAndSearchedProducts = React.useMemo(() => {
    let productsToFilter = allProducts;

    if (debouncedSearchTerm) {
      const searchResults = fuse.search(debouncedSearchTerm);
      productsToFilter = searchResults.map(result => result.item);
    }

    return productsToFilter.filter(product => {
      const productPrice = getNumericPrice(product.price);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      return categoryMatch && priceMatch && brandMatch;
    });
  }, [debouncedSearchTerm, selectedCategories, priceRange, selectedBrands, fuse, allProducts]);

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

  // Handler for "Load More" button
  const handleLoadMore = () => {
    setVisibleProductsCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
  };

  // Determine products to display based on visibleProductsCount
  const productsToDisplay = filteredAndSearchedProducts.slice(0, visibleProductsCount);

  // Check if there are more products to load
  const hasMoreProducts = visibleProductsCount < filteredAndSearchedProducts.length;


  return (
    <Container maxW="7xl" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Our Products
      </Heading>

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
        {/* Filter Sidebar*/}
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

        {/* Product Grid Area */}
        <Box flex="1">
          {productsToDisplay.length === 0 ? (
            <Text fontSize="xl" textAlign="center" mt={10} color="gray.500">
              No products match your current filters or search.
            </Text>
          ) : (
            <>
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                spacing={6}
              >
                {productsToDisplay.map(product => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.image_url} // Use image_url from fetched data
                  />
                ))}
              </SimpleGrid>

              {/* Load More Button (ONLY SHOW IF there are more products) */}
              {hasMoreProducts && (
                <Flex justifyContent="center" mt={8}>
                  <Button
                    onClick={handleLoadMore}
                    colorScheme="brand"
                    size="lg"
                    px={10}
                  >
                    Load More
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Flex>
    </Container>
  );
}