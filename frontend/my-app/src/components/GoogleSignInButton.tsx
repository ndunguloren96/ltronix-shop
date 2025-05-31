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
      {...props}
    >
      {children || 'Continue with Google'}
    </Button>
  );
}