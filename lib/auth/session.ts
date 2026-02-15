import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function getServerSession() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            console.warn('[getServerSession] No token in cookies');
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        if (!decoded || !decoded.userId) {
            console.warn('[getServerSession] Invalid token payload');
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            console.warn('[getServerSession] User not found for ID:', decoded.userId);
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword };
    } catch (error) {
        console.error('[getServerSession] Error:', error);
        return null; // Return null on error, don't throw
    }
}
