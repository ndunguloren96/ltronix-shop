'use client';

import { Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton } from '@chakra-ui/react';
import React from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void; // Optional function to handle closing the alert
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'An Error Occurred', // Default generic error title
  message,
  onClose,
}) => {
  return (
    <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md" py={4} px={6}>
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        {title}
      </AlertTitle>
      <AlertDescription maxWidth="sm">
        {message}
      </AlertDescription>
      {onClose && (
        <CloseButton
          position="absolute"
          right="8px"
          top="8px"
          onClick={onClose}
        />
      )}
    </Alert>
  );
};

export default ErrorAlert;