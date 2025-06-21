// /var/www/ltronix-shop/frontend/my-app/src/app/products/client_page.tsx
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
import { ProductCard } from '@/components/ProductCard'; // Correct named import
import { SearchIcon } from '@chakra-ui/icons';
import Fuse from 'fuse.js';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts, Product } from '../../api/products';

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image_url?: string;
  category: string;
  brand: string;
  stock: number; // Ensure stock is always part of the Product interface here
}

const getNumericPrice = (priceString: string): number => {
  const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
  return parseFloat(cleanedPrice);
};

const fuseOptions = {
  keys: ['name', 'category', 'brand', 'description'],
  threshold: 0.3,
  includeScore: true,
};

const PRODUCTS_PER_PAGE = 8;

export default function ProductsClientPage() {
  const { data: products, isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const allCategories = React.useMemo(() =>
    products ? Array.from(new Set(products.map(p => p.category))) : [],
    [products]
  );
  const allBrands = React.useMemo(() =>
    products ? Array.from(new Set(products.map(p => p.brand))) : [],
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
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
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
                  {allCategories.length === 0 && !isLoading && !isError ? (
                      <Text fontSize="sm" color="gray.500">No categories available.</Text>
                  ) : (
                      allCategories.map(category => (
                          <Checkbox
                              key={category}
                              isChecked={selectedCategories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              colorScheme="brand"
                          >
                              {category}
                          </Checkbox>
                      ))
                  )}
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
                {minPrice === maxPrice && products && products.length > 0 ? (
                    <Text fontSize="sm" color="gray.500">All products are Ksh{minPrice.toLocaleString()}.</Text>
                ) : products && products.length > 0 ? (
                    <Box pt={4} pb={2}>
                        <RangeSlider
                            aria-label={['min price', 'max price']}
                            defaultValue={[minPrice, maxPrice]}
                            min={minPrice}
                            max={maxPrice}
                            step={100}
                            value={priceRange}
                            onChangeEnd={setPriceRange}
                            onChange={setPriceRange}
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
                ) : (
                    <Text fontSize="sm" color="gray.500">Price range not available.</Text>
                )}
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
                  {allBrands.length === 0 && !isLoading && !isError ? (
                      <Text fontSize="sm" color="gray.500">No brands available.</Text>
                  ) : (
                      allBrands.map(brand => (
                          <Checkbox
                              key={brand}
                              isChecked={selectedBrands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              colorScheme="brand"
                          >
                              {brand}
                          </Checkbox>
                      ))
                  )}
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
                    imageUrl={product.image_url}
                    stock={product.stock} // Ensure stock is passed here
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
