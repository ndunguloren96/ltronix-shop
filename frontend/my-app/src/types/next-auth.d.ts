// src/types/next-auth.d.ts (or wherever your custom NextAuth types are)
import 'next-auth';

// Extend the NextAuth Session type to include your custom properties
declare module 'next-auth' {
  interface Session {
    accessToken?: string; // Django token for credentials login
    googleAccessToken?: string; // Google access token
    user: {
      id?: string; // User ID from Django
      email?: string; // User email from Django
      // Add any other user properties you're returning from your Django backend
      // or from social providers (e.g., name, image)
    } & Session['user']; // Keep NextAuth's default user properties (name, email, image)
  }

  // If you also want to extend the JWT token structure (optional, but good practice)
  interface JWT {
    accessToken?: string;
    googleAccessToken?: string;
    id?: string;
    email?: string;
    // Add other properties if you store them directly in the JWT
  }
}