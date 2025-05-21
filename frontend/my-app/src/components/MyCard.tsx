// src/components/MyCard.tsx
'use client';

import { Box, Heading, Text, Image, Stack, Divider, Card, CardBody, CardFooter, ButtonGroup, Button, CardProps } from '@chakra-ui/react';
import React from 'react';

interface MyCardProps extends CardProps {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
}

export const MyCard: React.FC<MyCardProps> = ({ title, description, imageUrl, price, ...props }) => {
  return (
    <Card maxW='sm' {...props}>
      <CardBody>
        <Image
          src={imageUrl}
          alt={title}
          borderRadius='lg'
          objectFit='cover' // Ensures the image covers the area nicely
          boxSize='200px' // Fixed size for consistency
          mx="auto" // Center the image
          mb={4}
        />
        <Stack mt='6' spacing='3'>
          <Heading size='md'>{title}</Heading>
          <Text>
            {description}
          </Text>
          <Text color='brand.700' fontSize='2xl'>
            {price}
          </Text>
        </Stack>
      </CardBody>
      <Divider />
      <CardFooter>
        <ButtonGroup spacing='2'>
          <Button variant='solid' colorScheme='brand'>
            Buy now
          </Button>
          <Button variant='ghost' colorScheme='brand'>
            Add to cart
          </Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
};