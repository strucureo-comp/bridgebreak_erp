import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            project_id,
            date,
            amount,
            category,
            description,
            receipt_url,
            billable
        } = body;

        const expense = await prisma.expenseClaim.create({
            data: {
                project_id,
                user_id: user.id,
                date: new Date(date),
                amount,
                category,
                description,
                receipt_url,
                billable: billable ?? true,
                status: 'submitted'
            }
        });

        return NextResponse.json(expense);

    } catch (error) {
        console.error('POST /api/admin/projects/expenses ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status } = body;

        const expense = await prisma.expenseClaim.update({
            where: { id },
            data: {
                status,
                approver_id: user.id
            }
        });

        // If approved, update Project Actual Cost AND Post to GL
        if (status === 'approved') {
            await prisma.$transaction(async (tx) => {
                // 1. Update Project Cost
                await tx.project.update({
                    where: { id: expense.project_id },
                    data: { actual_cost: { increment: expense.amount } }
                });

                // 2. Post Journal Entry (Expense vs Payable)
                // Find Accounts
                const expenseAccount = await tx.account.findFirst({
                    where: { name: { contains: 'Project Expense' } }
                }) || await tx.account.findFirst({
                    where: { type: 'expense' }
                });

                const payableAccount = await tx.account.findFirst({
                    where: { code: '2000' } // AP or Employee Payable
                });

                if (expenseAccount && payableAccount) {
                    await tx.journalEntry.create({
                        data: {
                            date: new Date(),
                            description: `Expense Claim #${expense.id} - ${expense.category}`,
                            status: 'posted',
                            created_by: user.id,
                            lines: {
                                create: [
                                    {
                                        account_id: expenseAccount.id,
                                        debit: expense.amount,
                                        credit: 0,
                                        description: `Project Expense: ${expense.description}`
                                    },
                                    {
                                        account_id: payableAccount.id, // Accounts Payable / Employee Reimbursement
                                        debit: 0,
                                        credit: expense.amount,
                                        description: `Payable to ${user.full_name}`
                                    }
                                ]
                            }
                        }
                    });
                }
            });
        }

        return NextResponse.json(expense);

    } catch (error) {
        console.error('PUT /api/admin/projects/expenses ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
