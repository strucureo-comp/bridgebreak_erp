
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch budgets including the related account
        const budgets = await prisma.budget.findMany({
            include: { account: true }
        });

        // Transform to include 'actual' from account balance
        // Note: This is simplistic. Real budget actuals should be sum of transactions for the period.
        // For now, we compare against current account balance (Life-to-date) or we need period logic.
        // MVP: Compare Budget Amount vs Account Current Balance.

        const data = budgets.map(b => ({
            ...b,
            actual: b.account ? Number(b.account.balance) : 0
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/admin/finance/budget ERROR:', error);
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
        const { account_id, amount, period } = body;

        // Upsert budget record
        const budget = await prisma.budget.upsert({
            where: { account_id_period: { account_id, period } },
            update: { amount },
            create: {
                account_id,
                amount,
                period
            }
        });

        return NextResponse.json(budget);
    } catch (error) {
        console.error('POST /api/admin/finance/budget ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
