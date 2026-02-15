
const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
}
import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

const STANDARD_COA = [
    { code: '1000', name: 'Assets', type: 'asset' },
    { code: '1100', name: 'Current Assets', type: 'asset', parent: '1000' },
    { code: '1110', name: 'Cash on Hand', type: 'asset', parent: '1100' },
    { code: '1120', name: 'Bank Accounts', type: 'asset', parent: '1100' },
    { code: '1200', name: 'Fixed Assets', type: 'asset', parent: '1000' },
    { code: '1210', name: 'Equipment', type: 'asset', parent: '1200' },
    { code: '2000', name: 'Liabilities', type: 'liability' },
    { code: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000' },
    { code: '3000', name: 'Equity', type: 'equity' },
    { code: '3100', name: 'Capital Stock', type: 'equity', parent: '3000' },
    { code: '4000', name: 'Revenue', type: 'revenue' },
    { code: '4100', name: 'Sales Revenue', type: 'revenue', parent: '4000' },
    { code: '5000', name: 'Expenses', type: 'expense' },
    { code: '5100', name: 'Cost of Goods Sold', type: 'expense', parent: '5000' },
    { code: '5200', name: 'Operational Expenses', type: 'expense', parent: '5000' },
    { code: '5210', name: 'Office Supplies', type: 'expense', parent: '5200' },
    { code: '5220', name: 'Travel', type: 'expense', parent: '5200' },
];

async function main() {
    console.log('Seeding Finance Data...');

    // 1. Create Accounts
    const created: Record<string, string> = {}; // code -> id

    // Roots
    for (const acc of STANDARD_COA.filter(a => !a.parent)) {
        const existing = await prisma.account.findFirst({ where: { code: acc.code } });
        if (!existing) {
            const res = await prisma.account.create({
                data: {
                    code: acc.code,
                    name: acc.name,
                    type: acc.type as any,
                }
            });
            created[acc.code] = res.id;
            console.log(`Created Root: ${acc.name}`);
        } else {
            created[acc.code] = existing.id;
            console.log(`Found Root: ${acc.name}`);
        }
    }

    // Level 1 Children
    for (const acc of STANDARD_COA.filter(a => a.parent && STANDARD_COA.find(p => p.code === a.parent && !p.parent))) {
        const existing = await prisma.account.findFirst({ where: { code: acc.code } });
        if (!existing && created[acc.parent!]) {
            const res = await prisma.account.create({
                data: {
                    code: acc.code,
                    name: acc.name,
                    type: acc.type as any,
                    parent_id: created[acc.parent!]
                }
            });
            created[acc.code] = res.id;
            console.log(`Created Child L1: ${acc.name}`);
        } else if (existing) {
            created[acc.code] = existing.id;
        }
    }

    // Level 2 Children
    for (const acc of STANDARD_COA.filter(a => a.parent && STANDARD_COA.find(p => p.code === a.parent && p.parent))) {
        const existing = await prisma.account.findFirst({ where: { code: acc.code } });
        if (!existing && created[acc.parent!]) {
            const res = await prisma.account.create({
                data: {
                    code: acc.code,
                    name: acc.name,
                    type: acc.type as any,
                    parent_id: created[acc.parent!]
                }
            });
            created[acc.code] = res.id;
            console.log(`Created Child L2: ${acc.name}`);
        } else if (existing) {
            created[acc.code] = existing.id;
        }
    }


    // 2. Create Sample Journal Entry (Initial Capital)
    const bankId = created['1120'];
    const capitalId = created['3100'];

    // Fetch a user to attribute the journal entries to
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } }) || await prisma.user.findFirst();
    const userId = adminUser?.id;

    if (!userId) {
        console.warn('No user found to create journal entries. Skipping journal creation.');
    } else {

        if (bankId && capitalId) {
            const existingEntry = await prisma.journalEntry.findFirst({ where: { description: 'Initial Capital Funding' } });
            if (!existingEntry) {
                await prisma.journalEntry.create({
                    data: {
                        date: new Date(),
                        description: 'Initial Capital Funding',
                        status: 'posted',
                        created_by: userId,
                        lines: {
                            create: [
                                { account_id: bankId, debit: 50000, credit: 0 },
                                { account_id: capitalId, debit: 0, credit: 50000 }
                            ]
                        }
                    }
                });
                // Update balances (naive, real app uses triggers or service)
                await prisma.account.update({ where: { id: bankId }, data: { balance: { increment: 50000 } } });
                await prisma.account.update({ where: { id: capitalId }, data: { balance: { increment: 50000 } } }); // Credit increases Equity
                console.log('Posted Initial Capital Entry');
            }
        }

        // 3. Create Sample Expense (Office Supplies)
        const suppliesId = created['5210'];
        if (bankId && suppliesId) {
            const existingEntry = await prisma.journalEntry.findFirst({ where: { description: 'Office Equipment Purchase' } });
            if (!existingEntry) {
                await prisma.journalEntry.create({
                    data: {
                        date: new Date(),
                        description: 'Office Equipment Purchase',
                        status: 'posted',
                        created_by: userId,
                        lines: {
                            create: [
                                { account_id: suppliesId, debit: 1500, credit: 0 },
                                { account_id: bankId, debit: 0, credit: 1500 }
                            ]
                        }
                    }
                });
                await prisma.account.update({ where: { id: suppliesId }, data: { balance: { increment: 1500 } } });
                await prisma.account.update({ where: { id: bankId }, data: { balance: { decrement: 1500 } } });
                console.log('Posted Expense Entry');
            }
        }
    }

    // 4. Create Budget
    const suppliesId = created['5210'];
    if (suppliesId) {
        await prisma.budget.upsert({
            where: { account_id_period: { account_id: suppliesId, period: '2024' } },
            create: { account_id: suppliesId, period: '2024', amount: 5000 },
            update: { amount: 5000 }
        });
        console.log('Created Budget for Office Supplies');
    }

    console.log('Seeding Complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
