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
// CRITICAL FIX: Changed import path to a relative path for better module resolution.
// Given your project structure: frontend/my-app/src/app/products/client_page.tsx
// to reach: frontend/my-app/src/components/ProductCard.tsx
// You need to go up two directories (../../) then into components/
import { ProductCard } from '../../components/ProductCard'; 
import { SearchIcon } from '@chakra-ui/icons';
import Fuse from 'fuse.js';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts, Product } from '../../api/products';



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

interface ProductsClientPageProps {
  isHomePage?: boolean; // Optional prop to indicate if it's rendered on the home page
}

export default function ProductsClientPage({ isHomePage }: ProductsClientPageProps) {
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
      <Text>Products will be displayed here.</Text>
    </Container>
  );
}

