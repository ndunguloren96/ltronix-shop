// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// Define the shape of your custom DjangoUser data
export interface DjangoUser {
  pk: number;
  id: number;
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
  interface Session {
    user: {
      /** The user's unique ID from the authentication provider. */
      id?: string; // <--- ADD THIS LINE
      /** The user's JWT access token from Django. */
      accessToken?: string;
      /** Custom Django user object. */
      djangoUser?: DjangoUser;
    } & DefaultSession["user"]; // Inherit default user properties (name, email, image)
  }

  
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, and used by the `session` callback
   */
  interface JWT extends DefaultJWT {
    /** The user's unique ID. Added to JWT if available from provider or custom logic. */
    id?: string; // <--- ADD THIS LINE if your JWT also carries a direct 'id'
    /** The user's JWT access token from Django. */
    accessToken?: string;
    /** Custom Django user object. */
    djangoUser?: DjangoUser;
    // Add any other custom properties you store in the JWT
  }
}
