// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export interface DjangoUser {
  id: string; // Changed from 'pk' to 'id' for consistency, as per the serializer snippet
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  // New profile property to match the backend
  profile?: {
    middle_name?: string;
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken?: string;
      error?: string;
      refreshToken?: string;
      djangoUser?: DjangoUser;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    djangoUser?: DjangoUser;
  }
}
