import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import type { Metadata } from 'next'; // Import Metadata type

// SEO Metadata for the About page
export const metadata: Metadata = {
  title: 'About Us - Ltronix Shop',
  description: 'Learn more about Ltronix Shop, our mission, vision, and commitment to providing quality electronics products and services.',
  keywords: ['Ltronix', 'electronics', 'about us', 'company mission', 'tech shop Kenya', 'e-commerce'],
  openGraph: {
    title: 'About Ltronix Shop',
    description: 'Discover the story behind Ltronix Shop and our dedication to technology.',
    url: 'https://ltronix.co.ke/about', // Placeholder - Replace with your actual domain
    type: 'website',
    images: [
      {
        url: 'https://ltronix.co.ke/og-image.jpg', // Placeholder for a social media image
        width: 1200,
        height: 630,
        alt: 'Ltronix Shop Company Overview',
      },
    ],
  },
  // Add other meta tags like twitter:card, etc., as needed
};

export default function AboutPage() {
  return (
    <Container maxW="3xl" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          About Ltronix Shop
        </Heading>
        <VStack spacing={4} align="flex-start" fontSize="md">
          <Text>
            Welcome to Ltronix Shop, your premier destination for cutting-edge electronics. Founded in [Year], our mission is to bring the latest and greatest in technology directly to your fingertips, ensuring quality, affordability, and exceptional customer service.
          </Text>
          <Text>
            We believe that technology should be accessible to everyone. That's why we meticulously curate our product selection, ranging from the newest smartphones and laptops to smart home devices, gaming consoles, and professional studio equipment. Every product in our catalog is chosen for its innovation, reliability, and value.
          </Text>
          <Text>
            At Ltronix Shop, our commitment extends beyond just selling products. We are passionate about empowering our customers with knowledge and support, ensuring a seamless shopping experience from Browse to post-purchase assistance. Our dedicated team is always ready to help you find the perfect gadget or resolve any query.
          </Text>
          <Text>
            Thank you for choosing Ltronix Shop. We are excited to be part of your tech journey and look forward to serving you!
          </Text>
          <Text fontWeight="bold" mt={4}>
            Our Vision:
          </Text>
          <Text>
            To be the leading online electronics retailer in Kenya and across Africa, recognized for our diverse range of high-quality products, competitive pricing, and unparalleled customer satisfaction.
          </Text>
          <Text fontWeight="bold" mt={4}>
            Our Values:
          </Text>
          <Text>
            Innovation, Customer Centricity, Integrity, Quality, and Accessibility.
          </Text>
        </VStack>
      </Box>
    </Container>
  );
}