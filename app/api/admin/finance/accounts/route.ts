
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accounts = await prisma.account.findMany({
            orderBy: { code: 'asc' },
            include: {
                children: true, // For hierarchy if needed
            }
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error('GET /api/admin/finance/accounts ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const account = await prisma.account.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
                parent_id: body.parent_id || null, // Ensure explicit null if not provided
                // is_system: body.is_system || false, // Not currently in schema
            }
        });
        return NextResponse.json(account);
    } catch (error) {
        console.error('POST /api/admin/finance/accounts ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
