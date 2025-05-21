// src/app/products/page.tsx
'use client';

import React from 'react'; // Import React for useState
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Image,
  Flex,           // Added for layout (sidebar + grid)
  VStack,         // Added for vertical stacking in sidebar
  // Accordion components for collapsible filter sections
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Checkbox,       // For category filtering
  // RangeSlider components for price range filtering
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Tag,            // For displaying current filter values
} from '@chakra-ui/react';
import { ProductCard } from '@/components/ProductCard';

// Placeholder data for products (keeping currency as Ksh)
const mockProducts = [
  { id: '1', name: 'Premium Wireless Headphones', price: 'Ksh2,999.00', category: 'Headphones & Speakers', brand: 'AudioTech', imageUrl: 'https://via.placeholder.com/250/200?text=Headphones' },
  { id: '2', name: 'Ultra HD 4K Smart TV', price: 'Ksh28,999.00', category: 'Televisions & Projectors', brand: 'VisionCraft', imageUrl: 'https://via.placeholder.com/250/200?text=Smart+TV' },
  { id: '3', name: 'High-Performance Gaming Laptop', price: 'Ksh55,999.00', category: 'Computers & Laptops', brand: 'GameGear', imageUrl: 'https://via.placeholder.com/250/200?text=Laptop' },
  { id: '4', name: 'Compact Digital Camera', price: 'Ksh7,500.00', category: 'Cameras', brand: 'LensMaster', imageUrl: 'https://via.placeholder.com/250/200?text=Camera' },
  { id: '5', name: 'Smart Fitness Tracker', price: 'Ksh3,200.00', category: 'Smart Watches', brand: 'HealthTech', imageUrl: 'https://via.placeholder.com/250/200?text=Tracker' },
  { id: '6', name: 'Portable Bluetooth Speaker', price: 'Ksh750.00', category: 'Headphones & Speakers', brand: 'SoundBlast', imageUrl: 'https://via.placeholder.com/250/200?text=Speaker' },
  { id: '7', name: 'External SSD 1TB', price: 'Ksh2,800.00', category: 'Computers & Laptops', brand: 'DataVault', imageUrl: 'https://via.placeholder.com/250/200?text=SSD' },
  { id: '8', name: 'Wireless Charging Pad', price: 'Ksh2350.00', category: 'Cellphones & Tablets', brand: 'PowerUp', imageUrl: 'https://via.placeholder.com/250/200?text=Charger' },
  { id: '9', name: 'Gaming Mouse', price: 'Ksh1,500.00', category: 'Gaming Consoles', brand: 'GameGear', imageUrl: 'https://via.placeholder.com/250/200?text=Gaming+Mouse' },
  { id: '10', name: 'Robot Vacuum Cleaner', price: 'Ksh12,000.00', category: 'Smart Home Appliances', brand: 'CleanBot', imageUrl: 'https://via.placeholder.com/250/200?text=Robot+Vacuum' },
];

// Helper function to extract and format numeric prices
const getNumericPrice = (priceString: string): number => {
  return parseFloat(priceString.replace('Ksh', '').replace(/,/g, ''));
};

export default function ProductsPage() {
  // State for filters
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<number[]>([0, 60000]); // Max price based on mock data

  // Get unique categories and brands from mockProducts
  const allCategories = Array.from(new Set(mockProducts.map(p => p.category)));
  const allBrands = Array.from(new Set(mockProducts.map(p => p.brand)));
  const maxPrice = Math.max(...mockProducts.map(p => getNumericPrice(p.price)));
  const minPrice = Math.min(...mockProducts.map(p => getNumericPrice(p.price)));

  // Filtered products logic
  const filteredProducts = mockProducts.filter(product => {
    const productPrice = getNumericPrice(product.price);

    // Filter by category
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);

    // Filter by price range
    const priceMatch = productPrice >= priceRange[0] && productPrice <= priceRange[1];

    return categoryMatch && priceMatch;
  });

  // Handlers for filter changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Container maxW="7xl" py={8}> {/* Increased maxW to make space for sidebar */}
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        All Products
      </Heading>

      {/* Current Filters Display (Optional, can be useful for UX) */}
      {/* <HStack spacing={2} mb={4} wrap="wrap" justifyContent="center">
        {selectedCategories.map(cat => (
          <Tag key={cat} size="lg" colorScheme="blue" variant="solid">
            {cat} <CloseButton size="sm" ml={1} onClick={() => handleCategoryChange(cat)} />
          </Tag>
        ))}
        { (priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
          <Tag size="lg" colorScheme="blue" variant="solid">
            Price: Ksh{priceRange[0].toLocaleString()} - Ksh{priceRange[1].toLocaleString()}
            <CloseButton size="sm" ml={1} onClick={() => setPriceRange([minPrice, maxPrice])} />
          </Tag>
        )}
        {selectedCategories.length > 0 || priceRange[0] > minPrice || priceRange[1] < maxPrice && (
            <Button size="sm" variant="outline" onClick={() => {
                setSelectedCategories([]);
                setPriceRange([minPrice, maxPrice]);
            }}>
                Clear All Filters
            </Button>
        )}
      </HStack> */}

      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Filter Sidebar (Hidden on small screens, shown on medium and up) */}
        <Box
          w={{ base: 'full', md: '250px' }} // Full width on mobile, fixed width on desktop
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          boxShadow="sm"
          mb={{ base: 6, md: 0 }} // Margin bottom on mobile, none on desktop
        >
          <Heading as="h2" size="md" mb={4}>
            Filters
          </Heading>
          <Accordion allowMultiple defaultIndex={[0, 1]}> {/* Expand Category and Price by default */}

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
                    defaultValue={[minPrice, maxPrice]} // Initial range
                    min={minPrice}
                    max={maxPrice}
                    step={100} // Adjust step for smoother sliding
                    value={priceRange}
                    onChangeEnd={setPriceRange} // Update state only when sliding ends
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

            {/* Brand Filter (Placeholder - will implement in next step) */}
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
                {/* Brands will go here, similar to categories */}
                <Text fontSize="sm" color="gray.500">Brands filter coming soon...</Text>
              </AccordionPanel>
            </AccordionItem>

          </Accordion>
        </Box>

        {/* Product Grid Area */}
        <Box flex="1">
          {filteredProducts.length === 0 ? (
            <Text fontSize="xl" textAlign="center" mt={10} color="gray.500">
              No products match your current filters.
            </Text>
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 2, lg: 3 }} // Adjusted for sidebar: 2 on md, 3 on lg
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