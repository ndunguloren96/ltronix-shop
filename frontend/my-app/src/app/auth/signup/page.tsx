'use client';

import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, FormHelperText, Flex, useToast, InputGroup, InputRightElement, Button, Link as ChakraLink } from '@chakra-ui/react';
import { MyButton } from '../../../components/MyButton';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link';
import { FaEye, FaEyeSlash, FaPhone, FaEnvelope } from 'react-icons/fa'; // Import icons

const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

export default function SignupPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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

    const payload: { [key: string]: string } = {
      password: password,
    };

    if (authMethod === 'phone') {
      payload.phone_number = phoneNumber;
    } else {
      payload.email = email;
    }

    try {
      const signupRes = await fetch(`${DJANGO_API_BASE_URL}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (signupRes.ok) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Attempting to log you in...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        const signInResult = await signIn('credentials', {
          redirect: false,
          [authMethod === 'phone' ? 'phone_number' : 'email']: authMethod === 'phone' ? phoneNumber : email,
          password,
        });

        if (signInResult?.ok) {
          toast({
            title: 'Login Successful',
            description: 'You have been automatically logged in.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
        } else {
          console.error('Automatic login after signup failed:', signInResult?.error);
          toast({
            title: 'Login Failed',
            description: 'Account created, but automatic login failed. Please try logging in manually.',
            status: 'warning',
            duration: 7000,
            isClosable: true,
          });
          router.push('/auth/login');
        }
      } else {
        const errorData = await signupRes.json();
        console.error('Django signup failed (Status:', signupRes.status, '):', errorData);
        let errorMessage = 'Signup failed. Please check your details.';

        if (signupRes.status === 400) {
            if (errorData.email && Array.isArray(errorData.email) && errorData.email.includes('A user with that email already exists.')) {
                errorMessage = 'An account with this email already exists. Please login instead.';
                toast({ title: 'Account Exists', description: errorMessage, status: 'info', duration: 7000, isClosable: true });
                router.push('/auth/login');
                return;
            } else if (errorData.phone_number && Array.isArray(errorData.phone_number) && errorData.phone_number.includes('A user with that phone number already exists.')) {
                errorMessage = 'An account with this phone number already exists. Please login instead.';
                toast({ title: 'Account Exists', description: errorMessage, status: 'info', duration: 7000, isClosable: true });
                router.push('/auth/login');
                return;
            } else if (errorData.password && Array.isArray(errorData.password)) {
                errorMessage = `Password: ${errorData.password[0]}`;
            } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
                errorMessage = errorData.non_field_errors[0];
            } else if (typeof errorData === 'object' && errorData !== null) {
                const allErrors = Object.values(errorData).flat().filter(Boolean);
                if (allErrors.length > 0) {
                    errorMessage = allErrors.join(', ');
                } else {
                    errorMessage = 'Signup failed due to invalid data.';
                }
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            }
        } else if (signupRes.status === 405) {
            errorMessage = 'Signup not allowed. Server endpoint configuration issue.';
        }

        toast({
          title: 'Signup Failed',
          description: errorMessage,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Unexpected signup error (network or unhandled exception):', error);
      toast({
        title: 'Signup Error',
        description: 'An unexpected error occurred during signup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/' });
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
          bg="white" // Ensures the card background is white, matching the page background
          boxShadow="none" // Removed boxShadow for a smoother, less visible card
          borderRadius="xl"
          textAlign="center"
        >
          <VStack spacing={4} align="stretch" width="full">
            <Text fontSize={{ base: 'lg', md: 'xl' }} textAlign="center" color="gray.700" fontWeight="semibold">
              Create an account to start shopping
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
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </FormControl>
                )}

                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup size="md">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleTogglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText textAlign="right">At least 8 characters.</FormHelperText>
                </FormControl>

                <MyButton type="submit" isLoading={isLoading} width="full">
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
              <GoogleSignInButton onClick={handleGoogleSignUp} isLoading={isLoading}>
                Sign Up with Google
              </GoogleSignInButton>
            </Flex>

            <Text textAlign="center" mt={4}>
              Already have an account?{' '}
              <NextLink href="/auth/login" passHref>
                <ChakraLink color="brand.500" fontWeight="bold">Log In</ChakraLink>
              </NextLink>
            </Text>
          </VStack>
        </VStack>
      </Flex>

      {/* Privacy and Terms of Service links - untouched as requested */}
      <Flex mt={6} mb={4} align="center" justify="center" gap={2} fontSize="sm" color="gray.600">
        <NextLink href="https://ltronix-shop.vercel.app/privacy-policy" passHref>
          <ChakraLink _hover={{ textDecoration: 'underline' }}>
            Privacy
          </ChakraLink>
        </NextLink>
        <Text>|</Text>
        <NextLink href="https://ltronix-shop.vercel.app/terms-of-service" passHref>
          <ChakraLink _hover={{ textDecoration: 'underline' }}>
            Terms of Service
          </ChakraLink>
        </NextLink>
      </Flex>
    </Flex>
  );
}

