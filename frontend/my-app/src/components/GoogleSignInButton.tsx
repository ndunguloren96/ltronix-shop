// src/components/GoogleSignInButton.tsx
'use client';

import { Button, ButtonProps, Icon } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc'; // Import Google icon from react-icons/fc

interface GoogleSignInButtonProps extends ButtonProps {
  children?: React.ReactNode;
  onClick: () => void;
}

export default function GoogleSignInButton({ children, onClick, ...props }: GoogleSignInButtonProps) {
  return (
    <Button
      leftIcon={<Icon as={FcGoogle} boxSize={5} />} // Use FcGoogle icon
      colorScheme="gray" // Use a neutral color scheme, as Google's branding is distinct
      variant="outline"
      width="full"
      onClick={onClick}
      // FIX: Explicitly set text color to ensure visibility on light background
      color="text.900" // Use your defined dark text color
      // You might also want to set the border color explicitly if it's too light
      borderColor="gray.300" // A slightly darker gray for the border
      _hover={{
        bg: 'gray.50', // Light background on hover
        borderColor: 'gray.400', // Darker border on hover
      }}
      {...props}
    >
      {children || 'Continue with Google'}
    </Button>
  );
}
