import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    // Some client pages might need to fetch basic user info (e.g. for meetings), 
    // but usually restricted. For now, allow auth users but maybe filter data if not admin?
    // The previous Firebase implementation allowed getting users.
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
        // Exclude password
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
