import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Import authOptions from the new shared file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
