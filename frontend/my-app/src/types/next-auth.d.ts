import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export interface DjangoUser {
  pk: number;
  id: number;
  email: string;
  first_name: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken?: string;
      error?: string;
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