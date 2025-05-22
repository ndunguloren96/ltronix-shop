'use client'; // Client component for interactive UI like Accordion

import {
  Box,
  Container,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  Button,
} from '@chakra-ui/react';
import React from 'react';

// Sample FAQ data
const faqItems = [
  {
    question: 'How do I place an order?',
    answer: 'To place an order, browse our product categories, add desired items to your cart, and proceed to checkout. Follow the prompts to enter your shipping details and payment information.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept a variety of payment methods including major credit cards (Visa, MasterCard, American Express), PayPal, and mobile money options specific to your region (e.g., M-Pesa in Kenya).',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Delivery times vary depending on your location and the product. Typically, local deliveries take 1-3 business days, while international shipments may take 7-14 business days. You can track your order status in your account.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day hassle-free return policy for most products, provided they are in their original condition and packaging. Please visit our dedicated "Returns" page for detailed terms and conditions.',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Yes, we do! We ship to a wide range of international destinations. Shipping costs and delivery times will be calculated at checkout based on your location.',
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order is dispatched, you will receive a tracking number via email. You can use this number on our "Track Your Order" page or directly on the courier\'s website.',
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We use industry-standard encryption and security protocols to protect your personal and payment information. For more details, please review our Privacy Policy.',
  },
];

export default function FAQPage() {
  return (
    <Container maxW="2xl" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Frequently Asked Questions
        </Heading>
        <Text textAlign="center" mb={8} color="gray.600">
          Find answers to common questions about our products, services, and policies.
        </Text>

        <Accordion allowMultiple mt={8}>
          {faqItems.map((item, index) => (
            <AccordionItem key={index} mb={4} borderWidth={1} borderRadius="md">
              <h2>
                <AccordionButton
                  _expanded={{ bg: 'brand.500', color: 'white' }} // MikroTech brand color for expanded state
                  py={4}
                  px={6}
                  fontSize="md"
                  fontWeight="semibold"
                >
                  <Box as="span" flex='1' textAlign='left'>
                    {item.question}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} px={6} pt={2}>
                <Text color="gray.700">
                  {item.answer}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        <VStack spacing={2} mt={10} textAlign="center" color="gray.600">
          <Text>
            Still have questions?
          </Text>
          <Button
            as="a"
            href="/support/contact"
            colorScheme="brand"
            variant="link"
            size="md"
          >
            Contact Us
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}