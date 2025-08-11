// src/app/products/client_page.tsx
'use client'; // This is a client component

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
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { ProductCard } from '../../components/ProductCard';
import { SearchIcon } from '@chakra-ui/icons';
import Fuse from 'fuse.js';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../api/products';

/**
 * Interface for the Product object.
 */
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  digital: boolean;
  image_url?: string;
  category?: string;
  stock: number;
  brand?: string;
  sku?: string;
  rating: string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a price string to a numeric value.
 * @param priceString - The price string to convert.
 * @returns The numeric value of the price.
 */
const getNumericPrice = (priceString: string): number => {
  const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
  return parseFloat(cleanedPrice);
};

/**
 * Fuse.js options for fuzzy searching.
 */
const fuseOptions = {
  keys: ['name', 'category', 'brand', 'description'],
  threshold: 0.3,
  includeScore: true,
};

const PRODUCTS_PER_PAGE = 8;

/**
 * Interface for the ProductsClientPage component props.
 */
interface ProductsClientPageProps {
  isHomePage?: boolean; // Optional prop to indicate if it's rendered on the home page
}

/**
 * Client-side component for the products page.
 * This component handles fetching, filtering, and displaying products.
 * @param isHomePage - Optional prop to indicate if it's rendered on the home page.
 * @returns The products client page component.
 */
export default function ProductsClientPage({ isHomePage }: ProductsClientPageProps) {
  const { data: products, isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const allCategories = React.useMemo(() =>
    products ? Array.from(new Set(products.map(p => p.category))).filter(Boolean) : [], // Filter out null/undefined
    [products]
  );
  const allBrands = React.useMemo(() =>
    products ? Array.from(new Set(products.map(p => p.brand))).filter(Boolean) : [], // Filter out null/undefined
    [products]
  );

  const maxPrice = React.useMemo(() =>
    products && products.length > 0 ? Math.max(...products.map(p => getNumericPrice(p.price))) : 100000,
    [products]
  );
  const minPrice = React.useMemo(() =>
    products && products.length > 0 ? Math.min(...products.map(p => getNumericPrice(p.price))) : 0,
    [products]
  );

  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<number[]>(() => [minPrice, maxPrice]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState<string>('');

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

  React.useEffect(() => {
    // Only update priceRange if products are loaded and min/max prices are valid
    if (products && products.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice, products]); // Depend on products here

  React.useEffect(() => {
    setVisibleProductsCount(PRODUCTS_PER_PAGE);
  }, [debouncedSearchTerm, selectedCategories, priceRange, selectedBrands]);

  const fuse = React.useMemo(() => new Fuse(products || [], fuseOptions), [products]);

  const filteredAndSearchedProducts = React.useMemo(() => {
    if (!products) return [];

    let productsToFilter = products;

    if (debouncedSearchTerm) {
      const searchResults = fuse.search(debouncedSearchTerm);
      productsToFilter = searchResults.map(result => result.item);
    }

    return productsToFilter.filter(product => {
      const productPrice = getNumericPrice(product.price);
      // Ensure category and brand are treated as strings or fallback to empty string for includes
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category || '');
      const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand || '');
      return categoryMatch && priceMatch && brandMatch;
    });
  }, [debouncedSearchTerm, selectedCategories, priceRange, selectedBrands, fuse, products]);

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

  const handleLoadMore = () => {
    setVisibleProductsCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
  };

  const productsToDisplay = filteredAndSearchedProducts.slice(0, visibleProductsCount);

  const hasMoreProducts = visibleProductsCount < filteredAndSearchedProducts.length;

  // --- Start of Conditional Renders ---
  if (isLoading) {
    return (
      <Center height="50vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" />
        <Text ml={4} fontSize="lg" color="gray.600">Loading products...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center height="50vh" p={4}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          boxShadow="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <Heading size="md" mt={4} mb={1}>Failed to load products</Heading>
          <AlertDescription maxWidth="sm">
            {error?.message || 'An unexpected error occurred while fetching products.'}
            <br />
            Please ensure your Django backend is running and reachable.
            <br />
            <Button onClick={() => window.location.reload()} mt={4} colorScheme="brand">
              Try Reloading Page
            </Button>
          </AlertDescription>
        </Alert>
      </Center>
    );
  }

  // This check should come after isLoading and isError
  if (!products || products.length === 0) {
    return (
      <Center height="50vh">
        <Box textAlign="center" p={4}>
          <Heading size="lg" mb={4} color="gray.700">No Products Found</Heading>
          <Text fontSize="md" color="gray.500">
            It seems there are no products available at the moment or your filters/search yielded no results.
          </Text>
        </Box>
      </Center>
    );
  }
  // --- End of Conditional Renders ---


  return (
    <Container maxW="7xl" py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Filters/Sidebar */}
        <Box w={{ base: '100%', md: '250px' }} p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
          <VStack spacing={6} align="stretch">
            <Heading size="md" mb={2}>Filters</Heading>

            {/* Search Bar */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {/* Categories Filter */}
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left" fontWeight="semibold">
                      Categories
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack align="flex-start">
                    {allCategories.map(category => (
                      <Checkbox
                        key={category}
                        isChecked={selectedCategories.includes(category || '')}
                        onChange={() => handleCategoryChange(category || '')}
                      >
                        {category || 'Uncategorized'}
                      </Checkbox>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Brands Filter */}
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left" fontWeight="semibold">
                      Brands
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack align="flex-start">
                    {allBrands.map(brand => (
                      <Checkbox
                        key={brand}
                        isChecked={selectedBrands.includes(brand || '')}
                        onChange={() => handleBrandChange(brand || '')}
                      >
                        {brand || 'Unbranded'}
                      </Checkbox>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Price Range Filter */}
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left" fontWeight="semibold">
                      Price Range
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text fontSize="sm" mb={2}>{`$${priceRange[0].toFixed(2)} - $${priceRange[1].toFixed(2)}`}</Text>
                  <RangeSlider
                    aria-label={['min price', 'max price']}
                    defaultValue={[minPrice, maxPrice]}
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    // Only update on changeEnd to avoid excessive re-renders during slide
                    onChangeEnd={(val) => setPriceRange(val)}
                    // Set value prop to control it and display current range correctly
                    value={priceRange}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </Box>

        {/* Product Grid */}
        <Box flex="1">
          {productsToDisplay.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
              {productsToDisplay.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  image_url={product.image_url}
                  price={product.price}
                  stock={product.stock}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center p={8}>
              <Text fontSize="xl" color="gray.500">No products match your criteria.</Text>
            </Center>
          )}
          {hasMoreProducts && (
            <Center mt={8}>
              <Button onClick={handleLoadMore} colorScheme="brand">
                Load More
              </Button>
            </Center>
          )}
        </Box>
      </Flex>
    </Container>
  );
}