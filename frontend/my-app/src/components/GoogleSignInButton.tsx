// src/components/GoogleSignInButton.tsx
'use client';

import { Button, useToast } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface GoogleSignInButtonProps {
    onClick: () => void; // Changed from isSubmitting/buttonText to onClick
    isLoading: boolean; // Changed from isSubmitting to isLoading
    children: React.ReactNode; // Changed from buttonText to children for more flexibility
}

// Renamed to 'GoogleAuthButton' to avoid confusion if we were to name export 'GoogleSignInButton'
// However, sticking with the original name for consistency and fixing the import.
export default function GoogleSignInButton({ onClick, isLoading, children }: GoogleSignInButtonProps) {
    const toast = useToast();
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        // The onClick from the parent component (login/signup pages) will trigger signIn('google')
        // No direct signIn call needed here unless this button directly handles the flow.
        // For simplicity and consistency with Chakra UI Button's onClick prop,
        // we'll just execute the provided onClick.
        onClick();
    };

    return (
        <Button
            onClick={handleGoogleSignIn}
            leftIcon={<GoogleIcon />}
            colorScheme="red"
            variant="outline"
            size="lg"
            width="full"
            isLoading={isLoading}
            _hover={{ bg: 'red.50' }}
        >
            {children}
        </Button>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
            <path d="M12.24 10.27c.36 0 .72-.03 1.07-.08.68-.08 1.1-.66 1.02-1.34s-.66-1.1-1.34-1.02c-.38.05-.75.08-1.12.08-2.61 0-4.73-2.12-4.73-4.73S9.63 2.12 12.24 2.12c2.16 0 3.96 1.44 4.54 3.4.15.48.64.76 1.13.62.48-.15.76-.64.62-1.13C17.84 2.89 15.24.47 12.24.47 7.55.47 3.65 4.37 3.65 9.06s3.9 8.59 8.59 8.59c4.73 0 7.85-3.3 8.16-8.23.01-.13.01-.26.01-.39 0-.01-.01-.01-.01-.01H12.24zm0 4.19c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" fill="currentColor" />
            <path d="M20.2 10.37c-.12-.4-.53-.66-.93-.53-.4.12-.66.53-.53.93.07.24.1.49.1.75 0 2.22-1.81 4.03-4.03 4.03-1.68 0-3.1-.98-3.79-2.39-.14-.29-.44-.45-.75-.4-.32.06-.57.34-.63.66-.08.4-.1.8-.1 1.22 0 3.25 2.65 5.9 5.9 5.9 3.25 0 5.9-2.65 5.9-5.9 0-.32-.01-.64-.04-.96z" fill="currentColor" />
        </svg>
    );
}