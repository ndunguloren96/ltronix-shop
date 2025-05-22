import { Box, Container, Heading, Text, VStack, ListItem, UnorderedList } from '@chakra-ui/react';
import type { Metadata } from 'next'; // Import Metadata type

// SEO Metadata for the Privacy Policy page
export const metadata: Metadata = {
  title: 'Privacy Policy - Ltronix Shop',
  description: 'Understand how Ltronix Shop collects, uses, and protects your personal data. Your privacy is important to us.',
  keywords: ['Ltronix', 'privacy policy', 'data protection', 'user privacy', 'terms and conditions', 'e-commerce'],
  openGraph: {
    title: 'Ltronix Shop Privacy Policy',
    description: 'Read our comprehensive privacy policy to learn about our data handling practices.',
    url: 'https://ltronix.co.ke/privacy', // Placeholder - Replace with your actual domain
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "May 22, 2025"; // Update this date as needed

  return (
    <Container maxW="3xl" py={10}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          Privacy Policy
        </Heading>
        <Text textAlign="center" fontSize="sm" color="gray.500" mb={8}>
          Last updated: {lastUpdated}
        </Text>

        <VStack spacing={6} align="flex-start" fontSize="md">
          <Text>
            At Ltronix Shop, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website ltronix.co.ke, including any other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the “Site”). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </Text>

          <Heading as="h2" size="md">
            1. Information We Collect
          </Heading>
          <Text>
            We may collect information about you in a variety of ways. The information we may collect on the Site includes:
          </Text>
          <UnorderedList pl={4}>
            <ListItem>
              <Text fontWeight="bold">Personal Data:</Text> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site, such as online chat and message boards.
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Derivative Data:</Text> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Financial Data:</Text> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site.
            </ListItem>
          </UnorderedList>

          <Heading as="h2" size="md">
            2. Use of Your Information
          </Heading>
          <Text>
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
          </Text>
          <UnorderedList pl={4}>
            <ListItem>Create and manage your account.</ListItem>
            <ListItem>Process your transactions and send related information.</ListItem>
            <ListItem>Send you product, service, and new feature information.</ListItem>
            <ListItem>Respond to your customer service requests.</ListItem>
            <ListItem>Compile anonymous statistical data and analysis for use internally or with third parties.</ListItem>
            <ListItem>Prevent fraudulent transactions and monitor against theft.</ListItem>
          </UnorderedList>

          <Heading as="h2" size="md">
            3. Disclosure of Your Information
          </Heading>
          <Text>
            We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
          </Text>
          <UnorderedList pl={4}>
            <ListItem>
              <Text fontWeight="bold">By Law or to Protect Rights:</Text> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Third-Party Service Providers:</Text> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
            </ListItem>
          </UnorderedList>

          <Heading as="h2" size="md">
            4. Security of Your Information
          </Heading>
          <Text>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </Text>

          <Heading as="h2" size="md">
            5. Contact Us
          </Heading>
          <Text>
            If you have questions or comments about this Privacy Policy, please contact us at:
            <br />
            <Text as="span" fontWeight="bold">support@ltronix.co.ke</Text> {/* Updated email domain */}
          </Text>
        </VStack>
      </Box>
    </Container>
  );
}