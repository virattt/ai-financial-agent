import { getTotalUserMessagesByUserId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const count = await getTotalUserMessagesByUserId({ userId });

    return Response.json({ count });
  } catch (error) {
    console.error('Failed to get message count:', error);
    return Response.json({ error: 'Failed to get message count' }, { status: 500 });
  }
} 