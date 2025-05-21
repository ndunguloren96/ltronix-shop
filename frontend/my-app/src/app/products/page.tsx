// src/app/products/page.tsx
'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Image,
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
  Tag,
} from '@chakra-ui/react';
import { ProductCard } from '@/components/ProductCard';

// Updated Placeholder data for products with actual brands
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

// Helper function to extract and format numeric prices (no change)
const getNumericPrice = (priceString: string): number => {
  return parseFloat(priceString.replace('Ksh', '').replace(/,/g, ''));
};

export default function ProductsPage() {
  // State for filters (no change)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  // Adjusted initial max price to match the new mock data's highest price (iPhone 15 Pro Max)
  const [priceRange, setPriceRange] = React.useState<number[]>([0, 180000]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  // Get unique categories and brands from mockProducts
  // Max/Min price will dynamically adjust based on the updated mockProducts
  const allCategories = Array.from(new Set(mockProducts.map(p => p.category)));
  const allBrands = Array.from(new Set(mockProducts.map(p => p.brand)));
  const maxPrice = Math.max(...mockProducts.map(p => getNumericPrice(p.price)));
  const minPrice = Math.min(...mockProducts.map(p => getNumericPrice(p.price)));


  // Filtered products logic (no change)
  const filteredProducts = mockProducts.filter(product => {
    const productPrice = getNumericPrice(product.price);

    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);

    return categoryMatch && priceMatch && brandMatch;
  });

  // Handlers for filter changes (no change)
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

      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
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
                    // Use minPrice and maxPrice derived from mockProducts for default and bounds
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

        <Box flex="1">
          {filteredProducts.length === 0 ? (
            <Text fontSize="xl" textAlign="center" mt={10} color="gray.500">
              No products match your current filters.
            </Text>
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
              spacing={6}
            >
              {filteredProducts.map(product => (
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