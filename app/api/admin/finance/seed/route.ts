
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Standard Chart of Accounts (COA)
 * ─────────────────────────────────
 * LEAF accounts carry balances.
 * HEADER/GROUP accounts (1000, 1100, 2000, 3000, 4000, 5000, 5200)
 * are for grouping only — their balance is ALWAYS aggregated from children.
 *
 * Accounting Equation: Assets = Liabilities + Equity + Net Income
 * After seed (12 journal entries):
 *   Assets:
 *     1110 Cash on Hand        = $6,500
 *     1120 Bank Accounts       = $47,000
 *     1200 Accounts Receivable = $15,000
 *     1210 Equipment           = $12,000
 *     Total Assets             = $80,500
 *
 *   Liabilities:
 *     2100 Accounts Payable    = $5,000
 *     2200 Short-Term Loan     = $10,000
 *     Total Liabilities        = $15,000
 *
 *   Equity:
 *     3100 Capital Stock        = $50,000
 *     3200 Retained Earnings    = $0 (net income goes here at year-end)
 *     Total Equity              = $50,000
 *
 *   Revenue:
 *     4100 Sales Revenue        = $35,000
 *
 *   Expenses:
 *     5100 COGS                 = $13,000 (8K cloud + 5K hosting)
 *     5210 Office Supplies      = $1,500
 *     5220 Travel               = $2,000
 *     5230 Salaries             = $3,000
 *     Total Expenses            = $19,500
 *
 *   Net Income = Revenue - Expenses = $35,000 - $19,500 = $15,500
 *
 *   Check: Assets = Liabilities + Equity + Net Income
 *          $80,500 = $15,000 + $50,000 + $15,500 ✓
 */
const STANDARD_COA = [
    // ─── Assets ───
    { code: '1000', name: 'Assets', type: 'asset' },
    { code: '1100', name: 'Current Assets', type: 'asset', parent: '1000' },
    { code: '1110', name: 'Cash on Hand', type: 'asset', parent: '1100' },
    { code: '1120', name: 'Bank Accounts', type: 'asset', parent: '1100' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', parent: '1000' },
    { code: '1210', name: 'Equipment', type: 'asset', parent: '1000' },
    // ─── Liabilities ───
    { code: '2000', name: 'Liabilities', type: 'liability' },
    { code: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000' },
    { code: '2200', name: 'Short-Term Loan', type: 'liability', parent: '2000' },
    // ─── Equity ───
    { code: '3000', name: 'Equity', type: 'equity' },
    { code: '3100', name: 'Capital Stock', type: 'equity', parent: '3000' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', parent: '3000' },
    // ─── Revenue ───
    { code: '4000', name: 'Revenue', type: 'revenue' },
    { code: '4100', name: 'Sales Revenue', type: 'revenue', parent: '4000' },
    // ─── Expenses ───
    { code: '5000', name: 'Expenses', type: 'expense' },
    { code: '5100', name: 'Cost of Goods Sold', type: 'expense', parent: '5000' },
    { code: '5200', name: 'Operational Expenses', type: 'expense', parent: '5000' },
    { code: '5210', name: 'Office Supplies', type: 'expense', parent: '5200' },
    { code: '5220', name: 'Travel', type: 'expense', parent: '5200' },
    { code: '5230', name: 'Salaries & Wages', type: 'expense', parent: '5200' },
];

/**
 * Helper: post a balanced journal entry via the same accounting logic as POST /journals
 * This correctly updates balances using double-entry sign conventions:
 *   - Asset/Expense accounts: DEBIT increases balance, CREDIT decreases balance
 *   - Liability/Equity/Revenue accounts: CREDIT increases balance, DEBIT decreases balance
 *
 * NOTE: accountType is passed in directly to avoid per-line findUnique() queries,
 * which caused Prisma Accelerate transaction timeouts.
 */
async function postEntry(
    tx: any,
    args: {
        date: Date;
        description: string;
        status: string;
        createdBy: string;
        lines: Array<{ accountId: string; accountType: string; debit: number; credit: number }>;
    }
) {
    // Validate balance
    const totalDebit = args.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = args.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Unbalanced entry "${args.description}": Dr ${totalDebit} ≠ Cr ${totalCredit}`);
    }

    const entry = await tx.journalEntry.create({
        data: {
            date: args.date,
            description: args.description,
            status: args.status,
            created_by: args.createdBy,
            lines: {
                create: args.lines.map(l => ({
                    account_id: l.accountId,
                    debit: l.debit,
                    credit: l.credit,
                })),
            },
        },
    });

    // Update account balances using correct accounting sign conventions
    for (const line of args.lines) {
        // change = debit - credit
        let change = line.debit - line.credit;

        // For Liability/Equity/Revenue: flip sign so that credits INCREASE balance
        if (['liability', 'equity', 'revenue'].includes(line.accountType)) {
            change = -change;
        }

        await tx.account.update({
            where: { id: line.accountId },
            data: { balance: { increment: change } },
        });
    }

    return entry;
}

export async function POST() {
    try {
        console.log('═══ Finance Seed: Starting ═══');

        // Find admin user
        const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } })
            || await prisma.user.findFirst();
        if (!adminUser) {
            return NextResponse.json({ error: 'No user found to assign as creator' }, { status: 400 });
        }

        // ────────────────────────────────────────────
        // 1. CLEAR EXISTING DATA (clean re-seed)
        // ────────────────────────────────────────────
        await prisma.journalLine.deleteMany({});
        await prisma.journalEntry.deleteMany({});
        await prisma.budget.deleteMany({});
        await prisma.account.deleteMany({});
        console.log('  ✓ Cleared existing finance data');

        // ────────────────────────────────────────────
        // 2. CREATE ACCOUNTS (hierarchy)
        // ────────────────────────────────────────────
        const created: Record<string, string> = {};

        // Pass 1: Root accounts (no parent)
        for (const acc of STANDARD_COA.filter(a => !a.parent)) {
            const res = await prisma.account.create({
                data: { code: acc.code, name: acc.name, type: acc.type as any },
            });
            created[acc.code] = res.id;
        }

        // Pass 2: Level-1 children (parent is a root)
        for (const acc of STANDARD_COA.filter(a => a.parent && STANDARD_COA.find(p => p.code === a.parent && !p.parent))) {
            const parentId = created[acc.parent!];
            if (!parentId) continue;
            const res = await prisma.account.create({
                data: { code: acc.code, name: acc.name, type: acc.type as any, parent_id: parentId },
            });
            created[acc.code] = res.id;
        }

        // Pass 3: Level-2 children (parent is a level-1)
        for (const acc of STANDARD_COA.filter(a => a.parent && STANDARD_COA.find(p => p.code === a.parent && p.parent))) {
            const parentId = created[acc.parent!];
            if (!parentId) continue;
            const res = await prisma.account.create({
                data: { code: acc.code, name: acc.name, type: acc.type as any, parent_id: parentId },
            });
            created[acc.code] = res.id;
        }
        console.log(`  ✓ Created ${Object.keys(created).length} accounts`);

        // Build a lookup: account ID → type (so we don't need findUnique inside the transaction)
        const codeToType: Record<string, string> = {};
        STANDARD_COA.forEach(a => { codeToType[a.code] = a.type; });

        // Helper to create a line item with accountType pre-resolved
        const L = (code: string, debit: number, credit: number) => ({
            accountId: created[code],
            accountType: codeToType[code],
            debit,
            credit,
        });

        // ────────────────────────────────────────────
        // 3. POST JOURNAL ENTRIES (balanced, proper double-entry)
        // ────────────────────────────────────────────
        const today = new Date();
        const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
        const twoMonthsAgo = new Date(today); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Batch A: First 6 entries
        await prisma.$transaction(async (tx) => {
            await postEntry(tx, {
                date: threeMonthsAgo,
                description: 'Initial Capital Funding — Owner Investment',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1120', 50000, 0), L('3100', 0, 50000)],
            });
            await postEntry(tx, {
                date: threeMonthsAgo,
                description: 'Short-Term Business Loan from ABC Bank',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1120', 10000, 0), L('2200', 0, 10000)],
            });
            await postEntry(tx, {
                date: twoMonthsAgo,
                description: 'Cash Withdrawal from Bank for Operations',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1110', 10000, 0), L('1120', 0, 10000)],
            });
            await postEntry(tx, {
                date: twoMonthsAgo,
                description: 'Purchase of Office Equipment (Laptops & Furniture)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1210', 12000, 0), L('1120', 0, 12000)],
            });
            await postEntry(tx, {
                date: twoMonthsAgo,
                description: 'Invoice #INV-001 — Project Alpha (Web Development)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1200', 20000, 0), L('4100', 0, 20000)],
            });
            await postEntry(tx, {
                date: monthAgo,
                description: 'Invoice #INV-002 — Project Beta (Mobile App)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1200', 15000, 0), L('4100', 0, 15000)],
            });
        }, { maxWait: 10000, timeout: 15000 });

        // Batch B: Last 6 entries
        await prisma.$transaction(async (tx) => {
            await postEntry(tx, {
                date: monthAgo,
                description: 'Payment from Client — Project Alpha (Full Payment)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('1120', 20000, 0), L('1200', 0, 20000)],
            });
            await postEntry(tx, {
                date: monthAgo,
                description: 'Cost of Goods Sold — Software Licenses & Cloud',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('5100', 8000, 0), L('1120', 0, 8000)],
            });
            await postEntry(tx, {
                date: monthAgo,
                description: 'Office Supplies — Stationery & Consumables',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('5210', 1500, 0), L('1110', 0, 1500)],
            });
            await postEntry(tx, {
                date: today,
                description: 'Business Travel — Client Site Visit (Project Beta)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('5220', 2000, 0), L('1110', 0, 2000)],
            });
            await postEntry(tx, {
                date: today,
                description: 'Monthly Salaries — February 2026',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('5230', 3000, 0), L('1120', 0, 3000)],
            });
            await postEntry(tx, {
                date: today,
                description: 'Vendor Bill — Server Hosting Services (Unpaid)',
                status: 'posted',
                createdBy: adminUser.id,
                lines: [L('5100', 5000, 0), L('2100', 0, 5000)],
            });
        }, { maxWait: 10000, timeout: 15000 });

        console.log('  ✓ Posted 12 balanced journal entries');

        // ────────────────────────────────────────────
        // 4. VERIFY ACCOUNTING EQUATION
        // ────────────────────────────────────────────
        const allAccounts = await prisma.account.findMany({});
        const sum = (type: string) => allAccounts.filter(a => a.type === type && !allAccounts.some(c => c.parent_id === a.id))
            .reduce((s, a) => s + Number(a.balance), 0);

        const totalAssets = sum('asset');
        const totalLiabilities = sum('liability');
        const totalEquity = sum('equity');
        const totalRevenue = sum('revenue');
        const totalExpenses = sum('expense');
        const netIncome = totalRevenue - totalExpenses;

        const equationCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome));

        console.log('');
        console.log('═══ ACCOUNTING EQUATION VERIFICATION ═══');
        console.log(`  Assets:      $${totalAssets.toLocaleString()}`);
        console.log(`  Liabilities: $${totalLiabilities.toLocaleString()}`);
        console.log(`  Equity:      $${totalEquity.toLocaleString()}`);
        console.log(`  Revenue:     $${totalRevenue.toLocaleString()}`);
        console.log(`  Expenses:    $${totalExpenses.toLocaleString()}`);
        console.log(`  Net Income:  $${netIncome.toLocaleString()}`);
        console.log(`  A = L + E + NI → ${totalAssets} = ${totalLiabilities} + ${totalEquity} + ${netIncome}`);
        console.log(`  Difference:  $${equationCheck}`);
        console.log(`  Status:      ${equationCheck < 0.01 ? '✅ BALANCED' : '❌ UNBALANCED'}`);
        console.log('═══════════════════════════════════════════');

        // ────────────────────────────────────────────
        // 5. CREATE BUDGET DATA
        // ────────────────────────────────────────────
        if (created['5210']) {
            await prisma.budget.upsert({
                where: { account_id_period: { account_id: created['5210'], period: '2026' } },
                create: { account_id: created['5210'], period: '2026', amount: 5000 },
                update: { amount: 5000 },
            });
        }
        if (created['5220']) {
            await prisma.budget.upsert({
                where: { account_id_period: { account_id: created['5220'], period: '2026' } },
                create: { account_id: created['5220'], period: '2026', amount: 8000 },
                update: { amount: 8000 },
            });
        }
        if (created['5230']) {
            await prisma.budget.upsert({
                where: { account_id_period: { account_id: created['5230'], period: '2026' } },
                create: { account_id: created['5230'], period: '2026', amount: 40000 },
                update: { amount: 40000 },
            });
        }
        if (created['5100']) {
            await prisma.budget.upsert({
                where: { account_id_period: { account_id: created['5100'], period: '2026' } },
                create: { account_id: created['5100'], period: '2026', amount: 25000 },
                update: { amount: 25000 },
            });
        }
        console.log('  ✓ Created budgets for expense accounts');

        return NextResponse.json({
            success: true,
            message: 'Finance seed completed — all entries balanced ✅',
            verification: {
                assets: totalAssets,
                liabilities: totalLiabilities,
                equity: totalEquity,
                revenue: totalRevenue,
                expenses: totalExpenses,
                net_income: netIncome,
                equation_balanced: equationCheck < 0.01,
                account_count: Object.keys(created).length,
                journal_entries: 12,
            },
        });
    } catch (error) {
        console.error('Seed API Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
