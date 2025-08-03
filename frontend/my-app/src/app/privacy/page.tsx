// frontend/my-app/src/app/privacy/page.tsx
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

export default function PrivacyPolicyPage() {
  return (
    <Box p={8} maxWidth="800px" margin="auto">
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          Privacy Policy
        </Heading>
        <Text fontSize="lg">
          This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from ltronix-shop.vercel.app (the “Site”).
        </Text>
        <Heading as="h2" size="lg" mt={4}>
          Personal Information We Collect
        </Heading>
        <Text>
          When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site. We refer to this automatically-collected information as “Device Information.”
        </Text>
        <Text>
          We collect Device Information using the following technologies:
          <VStack pl={4} align="start">
            <Text>- “Cookies” are data files that are placed on your device or computer and often include an anonymous unique identifier. For more information about cookies, and how to disable cookies, visit http://www.allaboutcookies.org.</Text>
            <Text>- “Log files” track actions occurring on the Site, and collect data including your IP address, browser type, Internet service provider, referring/exit pages, and date/time stamps.</Text>
            <Text>- “Web beacons,” “tags,” and “pixels” are electronic files used to record information about how you browse the Site.</Text>
          </VStack>
        </Text>
        <Text>
          Additionally when you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information (including credit card numbers), email address, and phone number. We refer to this information as “Order Information.”
        </Text>
        <Text>
          When we talk about “Personal Information” in this Privacy Policy, we are talking both about Device Information and Order Information.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          How We Use Your Personal Information
        </Heading>
        <Text>
          We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:
          <VStack pl={4} align="start">
            <Text>- Communicate with you;</Text>
            <Text>- Screen our orders for potential risk or fraud; and</Text>
            <Text>- When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</Text>
          </VStack>
        </Text>
        <Text>
          We use the Device Information that we collect to help us screen for potential risk and fraud (in particular, your IP address), and more generally to improve and optimize our Site (for example, by generating analytics about how our customers browse and interact with the Site, and to assess the success of our marketing and advertising campaigns).
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Sharing Your Personal Information
        </Heading>
        <Text>
          We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Google Analytics to help us understand how our customers use the Site--you can read more about how Google uses your Personal Information here: https://www.google.com/intl/en/policies/privacy/. You can also opt-out of Google Analytics here: https://tools.google.com/dlpage/gaoptout.
        </Text>
        <Text>
          Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Your Rights
        </Heading>
        <Text>
          If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.
        </Text>
        <Text>
          Additionally, if you are a European resident we note that we are processing your information in order to fulfill contracts we might have with you (for example if you make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Additionally, please note that your information will be transferred outside of Europe, including to Canada and the United States.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Data Retention
        </Heading>
        <Text>
          When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to erase this information.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Changes
        </Heading>
        <Text>
          We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Contact Us
        </Heading>
        <Text>
          For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at [Your Email Address Here] or by mail using the details provided below:
        </Text>
        <Text>
          [Your Company Name]
          [Your Street Address]
          [Your City, Postal Code]
          [Your Country]
        </Text>
      </VStack>
    </Box>
  );
}
