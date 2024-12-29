import { cookies } from 'next/headers';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

import crypto from 'crypto';

// Utility to create a random fingerprint
function createFingerprint(): string {
  return crypto.randomBytes(16).toString('hex');
}

interface FingerprintResult {
  fingerprint: string;
  autoEmail: string;
}

/**
 * Reads `fingerprint` from existing cookies (if any),
 * otherwise generates a new one and instructs the
 * server to set a new cookie in the response.
 */
export async function getOrSetFingerprint(request: any): Promise<FingerprintResult> {
  const cookieStore = await cookies();
  const storedFingerprint = cookieStore.get('fingerprint');

  let fingerprint: string;
  
  if (storedFingerprint) {
    fingerprint = storedFingerprint.value;
  } else {
    fingerprint = createFingerprint();
    
    // Set the cookie
    cookieStore.set('fingerprint', fingerprint, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      path: '/',
      sameSite: 'lax'
    });
  }

  const autoEmail = `user-${fingerprint.slice(0, 12)}@auto.generated`;

  return {
    fingerprint,
    autoEmail,
  };
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
      async authorize(credentials, req) {
        // We automatically log the user in with a random email, for now
        const { fingerprint, autoEmail } = await getOrSetFingerprint(req);

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
