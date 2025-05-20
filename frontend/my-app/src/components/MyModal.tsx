// src/components/MyModal.tsx
'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  ModalProps as ChakraModalProps, // Import ModalProps with an alias
} from '@chakra-ui/react';
import React from 'react';

// Define props for MyModal, extending Chakra's ModalContentProps if needed for content styling,
// but primarily focusing on children and title for the modal itself.
interface MyModalProps {
  isOpen: boolean; // Controls if the modal is open
  onClose: () => void; // Function to close the modal
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode; // Optional footer content
  size?: ChakraModalProps['size']; // Allow passing Chakra's size prop
}

export const MyModal: React.FC<MyModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = 'md', // Default size to 'md'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered> {/* isCentered for better UX */}
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {children}
        </ModalBody>
        {footerContent && <ModalFooter>{footerContent}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
};

// You can also export a hook for easy usage in parent components
export { useDisclosure };