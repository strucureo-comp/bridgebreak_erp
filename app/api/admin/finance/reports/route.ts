
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

/**
 * Financial Reports API
 * ─────────────────────
 * Returns correctly aggregated financial data for:
 *   - P&L (Profit & Loss) — Revenue & Expenses with net income
 *   - BS  (Balance Sheet) — Assets, Liabilities, Equity with retained earnings
 *   - TB  (Trial Balance) — All accounts with Dr/Cr columns
 *
 * IMPORTANT: Only LEAF accounts (accounts with no children) carry actual balances.
 * Header/Group accounts (e.g., "1000 Assets") are for grouping and their balance = sum of children.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'pnl', 'bs', or 'tb'

        const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } });

        // Build parent-child map to find leaf accounts
        const childMap: Record<string, boolean> = {};
        accounts.forEach(a => {
            if (a.parent_id) childMap[a.parent_id] = true;
        });
        const isLeaf = (id: string) => !childMap[id];

        // Helper: sum balances of leaf accounts of a given type
        const sumLeaf = (accountType: string) =>
            accounts
                .filter(a => a.type === accountType && isLeaf(a.id))
                .reduce((s, a) => s + Number(a.balance), 0);

        if (type === 'pnl') {
            const revenue = accounts.filter(a => a.type === 'revenue' || (a.type as any) === 'income');
            const expenses = accounts.filter(a => a.type === 'expense');

            const totalRevenue = revenue.filter(a => isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);
            const totalExpense = expenses.filter(a => isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);

            return NextResponse.json({
                revenue: revenue.map(a => ({ ...a, balance: Number(a.balance), is_leaf: isLeaf(a.id) })),
                expenses: expenses.map(a => ({ ...a, balance: Number(a.balance), is_leaf: isLeaf(a.id) })),
                net_income: totalRevenue - totalExpense,
                total_revenue: totalRevenue,
                total_expense: totalExpense,
            });
        }

        if (type === 'bs') {
            const assets = accounts.filter(a => a.type === 'asset');
            const liabilities = accounts.filter(a => a.type === 'liability');
            const equity = accounts.filter(a => a.type === 'equity');

            const totalAssets = assets.filter(a => isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);
            const totalLiabilities = liabilities.filter(a => isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);
            const totalEquity = equity.filter(a => isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);

            // Retained earnings = Net Income = Revenue - Expenses (current period)
            const netIncome = sumLeaf('revenue') - sumLeaf('expense');

            return NextResponse.json({
                assets: assets.map(a => ({ ...a, balance: Number(a.balance), is_leaf: isLeaf(a.id) })),
                liabilities: liabilities.map(a => ({ ...a, balance: Number(a.balance), is_leaf: isLeaf(a.id) })),
                equity: equity.map(a => ({ ...a, balance: Number(a.balance), is_leaf: isLeaf(a.id) })),
                total_assets: totalAssets,
                total_liabilities: totalLiabilities,
                total_equity: totalEquity,
                net_income: netIncome,
                equation_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome)) < 0.01,
            });
        }

        // Default: Trial Balance — all accounts with debit/credit columns
        const trialBalance = accounts.filter(a => isLeaf(a.id)).map(a => {
            const balance = Number(a.balance);
            // Asset & Expense accounts: positive = debit balance
            // Liability, Equity, Revenue: positive = credit balance
            const isDebitNormal = ['asset', 'expense'].includes(a.type);

            return {
                ...a,
                balance,
                debit: isDebitNormal ? (balance > 0 ? balance : 0) : (balance < 0 ? Math.abs(balance) : 0),
                credit: isDebitNormal ? (balance < 0 ? Math.abs(balance) : 0) : (balance > 0 ? balance : 0),
                is_leaf: true,
            };
        });

        const totalDebit = trialBalance.reduce((s, a) => s + a.debit, 0);
        const totalCredit = trialBalance.reduce((s, a) => s + a.credit, 0);

        return NextResponse.json({
            accounts: trialBalance,
            total_debit: totalDebit,
            total_credit: totalCredit,
            is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
        });
    } catch (error) {
        console.error('GET /api/admin/finance/reports ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
