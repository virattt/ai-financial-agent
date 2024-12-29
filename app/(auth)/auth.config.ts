import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true;
    },
  },
} satisfies NextAuthConfig;
