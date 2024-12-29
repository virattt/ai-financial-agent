import { signIn } from '@/app/(auth)/auth';

export const runtime = 'nodejs';

export async function POST() {
  await signIn('credentials', {
    redirect: false,
  });
  return Response.json({ success: true });
} 