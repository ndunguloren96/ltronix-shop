// src/components/ChatSupportWidget.tsx
'use client';

import { Box, Button, Text } from '@chakra-ui/react';
import React from 'react';

const ChatSupportWidget: React.FC = () => {
  return (
    <Box
      p={4}
      bg="green.500"
      color="white"
      borderRadius="md"
      boxShadow="lg"
      position="fixed"
      bottom="20px"
      right="20px"
      zIndex="1000"
    >
      <Text mb={2}>Need help? Chat with us!</Text>
      <Button size="sm" colorScheme="whiteAlpha" variant="outline">
        Start Chat
      </Button>
    </Box>
  );
};

export default ChatSupportWidget;