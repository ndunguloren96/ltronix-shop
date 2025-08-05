// /var/www/ltronix-shop/frontend/my-app/src/app/auth/login/page.tsx
'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast, InputGroup, InputRightElement, Button, Link as ChakraLink } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link';
import { FaEye, FaEyeSlash, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone'); // Default to phone
  const toast = useToast();
  const router = useRouter();

  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const credentials = authMethod === 'phone' ? { phone_number: phoneNumber, password } : { email, password };

      const result = await signIn('credentials', {
        redirect: false,
        ...credentials,
      });

      if (result?.error) {
        console.error('Credentials login failed:', result.error);
        let errorMessage = 'Login failed. Please check your details.';

        if (result.error === 'CredentialsSignin') {
            errorMessage = 'Incorrect details. Please try again.';
        } else if (result.error.includes('timeout')) {
            errorMessage = 'Network timeout during login. Please check your connection.';
        } else if (result.error.includes('Invalid credentials')) {
            errorMessage = 'Invalid email/phone or password. Please try again.';
        }

        toast({
          title: 'Login Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (result?.ok) {
        toast({
          title: 'Login Successful',
          description: 'You have been successfully logged in.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/');
      }
    } catch (error) {
      console.error('Unexpected login error (network or unhandled exception):', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred during login. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" minH="100vh" align="center" justify="center" bg="gray.50">
      <VStack spacing={8} p={8} width={{ base: '90%', md: '400px' }} >
        <NextLink href="/" passHref>
          <ChakraLink _hover={{ textDecoration: 'none' }}>
            <Heading as="h1" size="lg" textAlign={{ base: 'center', md: 'left' }} width="full">
              Ltronix
            </Heading>
          </ChakraLink>
        </NextLink>

        <VStack spacing={4} align="stretch" width="full">
          <Text fontSize="md" textAlign="center" color="gray.600">
            Log in to continue your shopping experience.
          </Text>

          <Flex direction="column" gap={3}>
            <MyButton
              leftIcon={<FaPhone />}
              onClick={() => setAuthMethod('phone')}
              variant={authMethod === 'phone' ? 'solid' : 'outline'}
              colorScheme="teal"
            >
              Continue with Phone
            </MyButton>
            <MyButton
              leftIcon={<FaEnvelope />}
              onClick={() => setAuthMethod('email')}
              variant={authMethod === 'email' ? 'solid' : 'outline'}
              colorScheme="teal"
            >
              Continue with Email
            </MyButton>
            <GoogleSignInButton onClick={() => signIn('google')} isLoading={isLoading}>
              Log In with Google
            </GoogleSignInButton>
          </Flex>

          <Text textAlign="center">Or</Text>

          <form onSubmit={handleSubmit}>
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
                <FormHelperText>
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
                Log In
              </MyButton>
            </VStack>
          </form>

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
  );
}

