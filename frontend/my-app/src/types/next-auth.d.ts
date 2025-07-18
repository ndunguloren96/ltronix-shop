// src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// Define the shape of your custom DjangoUser data
export interface DjangoUser {
  pk: number; // Primary key, often same as id
  id: number; // The actual ID from Django's User model
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  // Add any other properties your Django user object has
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user: {
      /** The user's unique ID from the authentication provider. */
      id: string; // FIX: This must be a string for NextAuth's internal consistency
      /** The user's JWT access token from Django. */
      accessToken?: string;
      /** The user's JWT refresh token from Django. */
      refreshToken?: string; // <--- THIS IS THE CRITICAL LINE
      /** Custom Django user object. */
      djangoUser?: DjangoUser;
    } & DefaultSession["user"]; // Inherit default user properties (name, email, image)
  }

  interface User extends DefaultUser {
    // Add custom properties here that you expect from your Django backend
    // FIX: This must be a string for NextAuth's internal consistency
    id: string;
    accessToken?: string;
    refreshToken?: string; // <--- THIS IS THE CRITICAL LINE
    djangoUser?: DjangoUser;
  }
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, and used by the `session` callback
   */
  interface JWT extends DefaultJWT {
    /** The user's unique ID. Added to JWT if available from provider or custom logic. */
    id?: string; // FIX: This must be a string for NextAuth's internal consistency
    /** The user's JWT access token from Django. */
    accessToken?: string;
    /** The user's JWT refresh token from Django. */
    refreshToken?: string; // <--- THIS IS THE CRITICAL LINE
    /** Custom Django user object. */
    djangoUser?: DjangoUser;
    // Add any other custom properties you store in the JWT
  }
}
