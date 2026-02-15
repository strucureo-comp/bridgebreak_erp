import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function checkBudget(accountId: string, amount: number, date: Date) {
    const period = format(date, 'yyyy-MM'); // Monthly budget control
    // Alternately check for yearly "yyyy" if needed

    const control = await prisma.budgetControl.findFirst({
        where: {
            account_id: accountId,
            period: period
        }
    });

    if (!control) {
        // Check for annual budget if monthly not found
        const annualPeriod = format(date, 'yyyy');
        const annualControl = await prisma.budgetControl.findFirst({
            where: {
                account_id: accountId,
                period: annualPeriod
            }
        });

        if (!annualControl) return { passed: true };

        // Check annual limit
        if (Number(annualControl.consumed_amount) + amount > Number(annualControl.limit_amount)) {
            return {
                passed: annualControl.action !== 'block',
                warning: annualControl.action === 'warn',
                message: `Annual Budget Exceeded for ${annualPeriod}`
            };
        }
        return { passed: true };
    }

    // Check monthly limit
    if (Number(control.consumed_amount) + amount > Number(control.limit_amount)) {
        return {
            passed: control.action !== 'block',
            warning: control.action === 'warn',
            message: `Monthly Budget Exceeded for ${period}`
        };
    }

    return { passed: true };
}

export async function updateBudgetUsage(accountId: string, amount: number, date: Date) {
    const periodMonth = format(date, 'yyyy-MM');
    const periodYear = format(date, 'yyyy');

    // Update Monthly
    await prisma.budgetControl.updateMany({
        where: { account_id: accountId, period: periodMonth },
        data: { consumed_amount: { increment: amount } }
    });

    // Update Yearly
    await prisma.budgetControl.updateMany({
        where: { account_id: accountId, period: periodYear },
        data: { consumed_amount: { increment: amount } }
    });
}
