// src/components/MyButton.tsx
'use client'; // This component will be a client component

import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react';

interface MyButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const MyButton: React.FC<MyButtonProps> = ({ children, ...props }) => {
  return (
    <Button {...props} colorScheme="brand" borderRadius="full">
      {children}
    </Button>
  );
};