// src/components/MyInput.tsx
'use client';

import { Input, InputProps, FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import React from 'react';

interface MyInputProps extends InputProps {
  label?: string;
  error?: string;
}

export const MyInput: React.FC<MyInputProps> = ({ label, error, ...props }) => {
  const isInvalid = !!error; // Convert error string to boolean for Chakra's isInvalid prop

  return (
    <FormControl isInvalid={isInvalid} mb={4}> {/* Add margin-bottom for spacing */}
      {label && <FormLabel>{label}</FormLabel>}
      <Input {...props} focusBorderColor='brand.500' /> {/* Apply brand color on focus */}
      {isInvalid && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};