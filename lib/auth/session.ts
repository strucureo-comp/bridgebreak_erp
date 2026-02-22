import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { getCollections } from '@/lib/mongo-collections';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function getServerSession() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        if (!decoded || !decoded.userId) {
            return null;
        }

        const db = await getMongoDb();
        const { users } = getCollections(db);
        const user = await users.findOne({ _id: decoded.userId });

        if (!user) {
            return null;
        }

        const { password, ...userWithoutPassword } = user as any;
        return { user: userWithoutPassword as any };
    } catch (error) {
        console.error('[getServerSession] Error:', error);
        return null; // Return null on error, don't throw
    }
}
