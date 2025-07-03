'use client';

import {
  Box,
  Heading,
  Text,
  Stack,
  Divider,
  ButtonGroup,
  Button,
} from '@chakra-ui/react';
import Image from 'next/image'; // Import Next.js Image component
import React from 'react';

interface MyCardProps {
  title: string;
  description: string;
  imageUrl: string; // This path will now be used by next/image
  imageAlt?: string; // Add alt text for accessibility and SEO
  price: string; // Keep as string for display if formatted
  children?: React.ReactNode; // For optional footer content
}

export const MyCard: React.FC<MyCardProps> = ({
  title,
  description,
  imageUrl,
  imageAlt = title, // Default alt text to title
  price,
  children,
}) => {
  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg="white">
      {/* Use next/image for optimized image display */}
      <Box position="relative" height="200px" width="100%">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill // Makes the image fill the parent Box
          style={{ objectFit: 'cover' }} // Ensures the image covers the area
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizing
        />
      </Box>

      <Box p="6">
        <Stack spacing="3">
          <Heading size="md">{title}</Heading>
          <Text>{description}</Text>
          <Text color="brand.600" fontSize="2xl">
            {price}
          </Text>
        </Stack>
      </Box>

      <Divider />

      <Box p="6">
        {children ? (
          // If children are provided, render them as the footer
          children
        ) : (
          // Otherwise, render a default button group
          <ButtonGroup spacing="2">
            <Button variant="solid" colorScheme="blue">
              Buy now
            </Button>
            <Button variant="ghost" colorScheme="blue">
              Add to cart
            </Button>
          </ButtonGroup>
        )}
      </Box>
    </Box>
  );
};