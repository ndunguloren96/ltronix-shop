'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast, InputGroup, InputRightElement, Button, Link as ChakraLink } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link';
import { FaEye, FaEyeSlash, FaPhone, FaEnvelope } from 'react-icons/fa';
import apiClient from '@/lib/apiClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const toast = useToast();
  const router = useRouter();

  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const loginPayload = authMethod === 'phone' ? { phone_number: phoneNumber, password } : { email, password };
    const loginEndpoint = 'auth/login/';

    try {
      // Make a direct call to the Django backend for authentication
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/${loginEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const data = await response.json();

      if (response.ok) {
        // If Django authentication is successful, use NextAuth's `signIn`
        // to create a session with the credentials we got back.
        // NOTE: We pass the full `data` object which contains the access/refresh tokens.
        // NextAuth will handle this and create the session.
        const result = await signIn('credentials', {
          redirect: false,
          django_login_response: JSON.stringify(data), // Pass the entire response to NextAuth
        });

        if (result?.ok) {
          toast({
            title: 'Login Successful',
            description: 'You have been successfully logged in.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
        } else {
          throw new Error(result?.error || 'Failed to create NextAuth session after Django login.');
        }
      } else {
        // If Django login fails, handle the error directly
        let errorMessage = 'Login failed. Please check your details.';
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors[0];
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let description = error.message || 'An unexpected error occurred during login. Please try again.';
      toast({
        title: 'Login Failed',
        description: description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Outer Flex container for the entire page, ensuring a uniform white background and overall padding
    <Flex direction="column" minH="100vh" bg="white" p={{ base: 4, md: 8 }} pb={4}> {/* Added overall padding and padding-bottom */}
      {/* Ltronix Heading moved to top-left */}
      <Box alignSelf="flex-start" mb={{ base: 4, md: 6 }}> {/* Adjusted margin-bottom for spacing from card */}
        <NextLink href="/" passHref>
          <ChakraLink _hover={{ textDecoration: 'none' }}>
            <Heading as="h1" size="xl" color="gray.800">
              Ltronix
            </Heading>
          </ChakraLink>
        </NextLink>
      </Box>

      {/* Main content area, centered */}
      <Flex flex="1" align="center" justify="center" width="full">
        <VStack
          spacing={{ base: 5, md: 7 }}
          p={{ base: 8, md: 12 }}
          width={{ base: '90%', sm: '450px', md: '500px' }}
          maxWidth="95%"
          bg="white"
          boxShadow="none" // Removed boxShadow for a smoother, less visible card
          borderRadius="xl"
          textAlign="center"
        >
          <VStack spacing={4} align="stretch" width="full">
            <Text fontSize={{ base: 'lg', md: 'xl' }} textAlign="center" color="gray.700" fontWeight="semibold">
              Log in to continue your shopping experience
            </Text>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                {authMethod === 'phone' ? (
                  <FormControl id="phone-number" isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <InputGroup>
                      <Input
                        type="tel"
                        placeholder="e.g., 0712345678"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                      />
                      <InputRightElement children={<FaPhone color="gray.300" />} />
                    </InputGroup>
                  </FormControl>
                ) : (
                  <FormControl id="email" isRequired>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </FormControl>
                )}

                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup size="md">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleTogglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText textAlign="right">
                    <NextLink href="/auth/forgot-password" passHref>
                      <ChakraLink color="brand.500" fontWeight="bold">
                        Forgot password?
                      </ChakraLink>
                    </NextLink>
                  </FormHelperText>
                </FormControl>

                <MyButton
                  type="submit"
                  width="full"
                  isLoading={isLoading}
                  isDisabled={isLoading}
                >
                  {authMethod === 'phone' ? 'Continue with Phone' : 'Continue with Email'}
                </MyButton>
              </VStack>
            </form>

            <Flex align="center" width="full" my={4}>
              <Box flex="1" height="1px" bg="gray.300" />
              <Text mx={4} color="gray.500" fontWeight="bold">OR</Text>
              <Box flex="1" height="1px" bg="gray.300" />
            </Flex>

            <Flex direction="column" gap={3} width="full">
              <MyButton
                leftIcon={authMethod === 'phone' ? <FaEnvelope /> : <FaPhone />}
                onClick={() => setAuthMethod(authMethod === 'phone' ? 'email' : 'phone')}
                variant="outline"
                colorScheme="teal"
              >
                {authMethod === 'phone' ? 'Continue with Email' : 'Continue with Phone'}
              </MyButton>
              <GoogleSignInButton onClick={() => signIn('google')} isLoading={isLoading}>
                Log In with Google
              </GoogleSignInButton>
            </Flex>

            <Text fontSize="sm" textAlign="center" mt={4}>
              Don't have an account?{' '}
              <NextLink href="/auth/signup" passHref>
                <ChakraLink color="brand.500" fontWeight="bold">
                  Sign Up
                </ChakraLink>
              </NextLink>
            </Text>
          </VStack>
        </VStack>
      </Flex>

      {/* Privacy and Terms of Service links - untouched as requested */}
      <Flex mt={6} mb={4} align="center" justify="center" gap={2} fontSize="sm" color="gray.600">
        <NextLink href="/privacy" passHref>
          <ChakraLink _hover={{ textDecoration: 'underline' }}>
            Privacy
          </ChakraLink>
        </NextLink>
        <Text>|</Text>
        <NextLink href="/terms" passHref>
          <ChakraLink _hover={{ textDecoration: 'underline' }}>
            Terms of Service
          </ChakraLink>
        </NextLink>
      </Flex>
    </Flex>
  );
}
