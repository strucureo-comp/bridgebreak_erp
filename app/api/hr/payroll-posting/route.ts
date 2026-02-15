import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// POST to post payroll to finance (creates a journal entry)
export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const payroll = await prisma.payroll.findUnique({
            where: { id: body.payroll_id },
            include: { lines: { include: { employee: true } } }
        });

        if (!payroll) return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
        if (payroll.posted_to_finance) return NextResponse.json({ error: 'Already posted to finance' }, { status: 400 });
        if (payroll.status === 'draft') return NextResponse.json({ error: 'Payroll must be approved first' }, { status: 400 });

        // Find or create accounts for payroll posting
        const salaryExpenseAccount = await prisma.account.findFirst({ where: { code: '5100' } }); // Salary Expense
        const pfPayableAccount = await prisma.account.findFirst({ where: { code: '2200' } }); // PF Payable
        const esiPayableAccount = await prisma.account.findFirst({ where: { code: '2201' } }); // ESI Payable
        const salaryPayableAccount = await prisma.account.findFirst({ where: { code: '2100' } }); // Salary Payable
        const bankAccount = await prisma.account.findFirst({ where: { code: '1200' } }); // Bank

        // Calculate totals
        const totalGross = payroll.lines.reduce((sum, l) => sum + Number(l.total_pay), 0);
        const totalPF = payroll.lines.reduce((sum, l) => sum + Number(l.pf_deduction), 0);
        const totalESI = payroll.lines.reduce((sum, l) => sum + Number(l.esi_deduction), 0);
        const totalNet = payroll.lines.reduce((sum, l) => sum + Number(l.net_pay), 0);

        // Create journal entry lines
        const journalLines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

        // Debit: Salary Expense
        if (salaryExpenseAccount) {
            journalLines.push({
                account_id: salaryExpenseAccount.id,
                debit: totalGross,
                credit: 0,
                description: `Salary expense for ${payroll.month}`
            });
        }

        // Credit: Salary Payable / Bank
        const payableAccount = salaryPayableAccount || bankAccount;
        if (payableAccount) {
            journalLines.push({
                account_id: payableAccount.id,
                debit: 0,
                credit: totalNet,
                description: `Net salary payable for ${payroll.month}`
            });
        }

        // Credit: PF Payable
        if (pfPayableAccount && totalPF > 0) {
            journalLines.push({
                account_id: pfPayableAccount.id,
                debit: 0,
                credit: totalPF,
                description: `PF contribution for ${payroll.month}`
            });
        }

        // Credit: ESI Payable
        if (esiPayableAccount && totalESI > 0) {
            journalLines.push({
                account_id: esiPayableAccount.id,
                debit: 0,
                credit: totalESI,
                description: `ESI contribution for ${payroll.month}`
            });
        }

        // Balance remaining deductions to salary payable
        const remainingDeductions = totalGross - totalNet - totalPF - totalESI;
        if (remainingDeductions > 0 && payableAccount) {
            journalLines.push({
                account_id: payableAccount.id,
                debit: 0,
                credit: remainingDeductions,
                description: `Other deductions for ${payroll.month}`
            });
        }

        let journalEntryId: string | null = null;

        if (journalLines.length > 0) {
            const journalEntry = await prisma.journalEntry.create({
                data: {
                    date: new Date(),
                    description: `Payroll posting for ${payroll.month}`,
                    reference: `PAYROLL-${payroll.month}`,
                    status: 'posted',
                    created_by: user.id,
                    lines: {
                        create: journalLines
                    }
                }
            });
            journalEntryId = journalEntry.id;

            // Update account balances
            for (const line of journalLines) {
                const account = await prisma.account.findUnique({ where: { id: line.account_id } });
                if (account) {
                    const balanceChange = Number(line.debit) - Number(line.credit);
                    const isDebitNormal = ['asset', 'expense'].includes(account.type);
                    const newBalance = Number(account.balance) + (isDebitNormal ? balanceChange : -balanceChange);
                    await prisma.account.update({
                        where: { id: line.account_id },
                        data: { balance: newBalance }
                    });
                }
            }
        }

        // Update payroll status
        await prisma.payroll.update({
            where: { id: body.payroll_id },
            data: {
                posted_to_finance: true,
                status: 'posted',
                finance_journal_id: journalEntryId,
            }
        });

        return NextResponse.json({
            success: true,
            journal_entry_id: journalEntryId,
            message: `Payroll for ${payroll.month} posted to Finance successfully.`,
        });
    } catch (error) {
        console.error('Payroll Posting Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
