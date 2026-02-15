
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const entries = await prisma.journalEntry.findMany({
            orderBy: { date: 'desc' },
            include: {
                lines: {
                    include: { account: true }
                },
                creator: {
                    select: { full_name: true }
                }
            }
        });
        return NextResponse.json(entries);
    } catch (error) {
        console.error('GET /api/admin/finance/journals ERROR:', error);
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
        const { date, description, lines } = body;

        // Check Budget Limits
        const { checkBudget, updateBudgetUsage } = await import('@/lib/finance/budget');
        const journalDate = new Date(date);

        for (const line of lines) {
            // Only check budget for Debits (Expenses/Assets increase)
            if (Number(line.debit) > 0) {
                const check = await checkBudget(line.account_id, Number(line.debit), journalDate);
                if (!check.passed) {
                    return NextResponse.json({
                        error: `Budget Exceeded: ${check.message}`,
                        details: check
                    }, { status: 400 });
                }
            }
        }

        // Validate balance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalDebit = lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalCredit = lines.reduce((sum: number, line: any) => sum + Number(line.credit), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'Journal Entry is not balanced' }, { status: 400 });
        }

        // Transaction
        const entry = await prisma.$transaction(async (tx) => {
            // 1. Create Header
            const newEntry = await tx.journalEntry.create({
                data: {
                    date: new Date(date),
                    description,
                    status: 'posted',
                    created_by: session.user.id,
                    lines: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        create: lines.map((line: any) => ({
                            account_id: line.account_id,
                            debit: line.debit,
                            credit: line.credit,
                            description: line.description
                        }))
                    }
                },
                include: { lines: true }
            });

            // 2. Update Account Balances
            for (const line of lines) {
                const account = await tx.account.findUnique({ where: { id: line.account_id } });
                if (!account) throw new Error(`Account ${line.account_id} not found`);

                let change = Number(line.debit) - Number(line.credit);

                // Standard Accounting Logic:
                // Asset/Expense: Debit increases (+), Credit decreases (-)
                // Liability/Equity/Revenue: Credit increases (+), Debit decreases (-)

                if (['liability', 'equity', 'revenue'].includes(account.type)) {
                    change = -change;
                }

                await tx.account.update({
                    where: { id: line.account_id },
                    data: { balance: { increment: change } }
                });
            }

            return newEntry;
        });

        // Update Budget Usage after successful posting
        for (const line of lines) {
            if (Number(line.debit) > 0) {
                const { updateBudgetUsage } = await import('@/lib/finance/budget');
                await updateBudgetUsage(line.account_id, Number(line.debit), new Date(date));
            }
        }

        return NextResponse.json(entry);
    } catch (error) {
        console.error('POST /api/admin/finance/journals ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
