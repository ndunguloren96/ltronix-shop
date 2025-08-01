'use client';

import { Box, Heading, Text, VStack, SimpleGrid, Link } from '@chakra-ui/react';
import { LucideIcon, HandCoins, MessageCircleHeart, Users } from 'lucide-react';
import React from 'react';

// A reusable component for the feature cards to keep the code clean and organized.
interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
}

const FeatureCard: React.FC<CardProps> = ({ icon: Icon, title, description, href, isExternal = false }) => {
  return (
    <Link
      href={href}
      isExternal={isExternal}
      _hover={{ textDecoration: 'none' }}
      boxShadow="lg"
      rounded="lg"
      transition="all 0.2s ease-in-out"
      _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
      isTruncated
    >
      <Box p={6} bg="white" rounded="lg" h="100%">
        <VStack spacing={4} align="center" textAlign="center">
          <Box p={3} bg="brand.500" rounded="full" color="white">
            <Icon size={28} />
          </Box>
          <Heading as="h3" size="md">
            {title}
          </Heading>
          <Text color="gray.600">
            {description}
          </Text>
        </VStack>
      </Box>
    </Link>
  );
};

export default function HomePageClientWidgets() {
  return (
    <Box py={10} px={4} bg="gray.50" className="bg-gray-50 dark:bg-gray-800">
      <VStack spacing={8} textAlign="center" mb={10}>
        <Heading as="h2" size="xl">
          Join Our Community
        </Heading>
        <Text fontSize="lg" color="gray.600" maxW="2xl">
          Connect with us and other tech enthusiasts.
        </Text>
      </VStack>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="6xl" mx="auto">
        <FeatureCard
          icon={HandCoins}
          title="Become a Seller"
          description="Monetize your passion for technology by selling products on our platform. Get started today!"
          href="https://ltronix-shop.vercel.app/seller"
        />
        <FeatureCard
          icon={MessageCircleHeart}
          title="Share Feedback"
          description="Your feedback is crucial. Help us improve our services and create a better shopping experience for everyone."
          href="https://bit.ly/wevaluefeedback"
          isExternal
        />
        <FeatureCard
          icon={Users}
          title="Join Community"
          description="Connect with fellow customers, share insights, and get the latest updates in our vibrant tech community."
          href="https://chat.whatsapp.com/IXZJR34c1gCLwpqcMLbXme"
          isExternal
        />
      </SimpleGrid>
    </Box>
  );
}
