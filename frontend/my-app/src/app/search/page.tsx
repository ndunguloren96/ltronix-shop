import { Suspense } from 'react';
import SearchResultsClientPage from './client_page';
import { Container, Text, Center, Spinner } from '@chakra-ui/react';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text ml={4}>Loading search results...</Text>
      </Center>
    }>
      <SearchResultsClientPage />
    </Suspense>
  );
}