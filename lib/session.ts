import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { User } from '@/prisma/generated/client';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ user: User } | null> {
  const user = await getCurrentUser();
  return user ? { user } : null;
}
