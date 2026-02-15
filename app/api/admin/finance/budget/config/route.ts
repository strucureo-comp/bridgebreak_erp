import { getServerSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period');

        const controls = await prisma.budgetControl.findMany({
            where: period ? { period } : undefined,
            include: { account: true, },
            orderBy: { account: { code: 'asc' } }
        });

        return NextResponse.json(controls);
    } catch (error) {
        console.error('GET /api/admin/finance/budget/config ERROR:', error);
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
        const { account_id, period, limit_amount, action } = body;

        const control = await prisma.budgetControl.upsert({
            where: {
                account_id_period: {
                    account_id,
                    period
                }
            },
            update: {
                limit_amount,
                action
            },
            create: {
                account_id,
                period,
                limit_amount,
                action
            }
        });

        return NextResponse.json(control);

    } catch (error) {
        console.error('POST /api/admin/finance/budget/config ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
