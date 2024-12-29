import { headers } from 'next/headers';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Helper to generate a unique user ID from browser fingerprint
async function generateUserIdFromRequest() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const forwarded = headersList.get('x-forwarded-for') || '';
  
  // Create a unique fingerprint from user agent and IP
  const fingerprint = createHash(userAgent + forwarded);
    
  // Create a deterministic email from the fingerprint
  const autoEmail = `user-${fingerprint.slice(0, 12)}@auto.generated`;
  
  return {
    fingerprint,
    autoEmail
  };
}

function createHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return Array.from(data)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize() {
        const { fingerprint, autoEmail } = await generateUserIdFromRequest();

        // Try to find existing user
        const users = await getUser(autoEmail);
        
        if (users.length > 0) {
          // Existing user - return it
          return users[0] as any;
        }

        // No user found - create new one with a random password (not used)
        const randomPassword = Math.random().toString(36);
        await createUser(autoEmail, randomPassword);
        
        // Get the newly created user
        const [newUser] = await getUser(autoEmail);

        return newUser as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
