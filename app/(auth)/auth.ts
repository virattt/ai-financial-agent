import { headers } from 'next/headers';
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
export function getOrSetFingerprint(request: any): FingerprintResult {
  // 1. Read incoming cookies from request headers
  const cookies = request.headers.cookie || '';
  
  // 2. Parse out the fingerprint cookie if it exists
  const fingerprintMatch = cookies
    .split(';')
    .find((cookie: string) => cookie.trim().startsWith('fingerprint='));

  let fingerprint: string;

  if (fingerprintMatch) {
    fingerprint = fingerprintMatch.split('=')[1].trim();
  } else {
    // 3. Generate new fingerprint
    fingerprint = createFingerprint();

    // // 4. Set the new cookie (with an expiration, secure, httpOnly, etc.)
    // //    In a real environment, you'd typically want a few days or weeks. 
    // //    For demonstration, let's do 30 days.
    // const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    // response.setHeader(
    //   'Set-Cookie',
    //   `fingerprint=${fingerprint}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAge}`
    // );
  }

  // 5. Create a deterministic “email” from the fingerprint
  const autoEmail = `user-${fingerprint.slice(0, 12)}@auto.generated`;

  return {
    fingerprint,
    autoEmail,
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
      async authorize(credentials, req) {
        const response = new Response();
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
