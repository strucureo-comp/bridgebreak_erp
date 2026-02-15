import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function GET(request: Request) {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch Unreconciled Bank Transactions
        const bankTransactions = await prisma.bankTransaction.findMany({
            where: {
                system_transaction_id: null, // Not linked to system
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        // 2. Fetch Unreconciled System Payments (Invoices)
        // In a real system, we'd check if they are already linked.
        // Ideally, we add a 'reconciled' flag to Payment or check BankTransaction for linkage.
        // For now, let's fetch recent payments and simple filter in UI or just return them.
        // A better approach: Find payments that are NOT referenced by any BankTransaction

        // This is expensive without a direct link back or a 'reconciled' flag on Payment.
        // Let's just fetch recent payments for now.
        const payments = await prisma.payment.findMany({
            take: 50,
            orderBy: { payment_date: 'desc' },
            include: {
                invoice: { select: { invoice_number: true, customer: { select: { name: true } } } }
            }
        });

        // 3. Fetch Unreconciled Vendor Payments
        const vendorPayments = await prisma.vendorPayment.findMany({
            take: 50,
            orderBy: { payment_date: 'desc' },
            include: {
                vendor_bill: { select: { bill_number: true, vendor: { select: { name: true } } } }
            }
        });

        // Filter out payments that are already linked
        // We need a list of linked IDs
        const linkedIds = await prisma.bankTransaction.findMany({
            where: { system_transaction_id: { not: null } },
            select: { system_transaction_id: true }
        }).then(txs => txs.map(t => t.system_transaction_id));

        const unreconciledPayments = (payments as any[]).filter(p => !linkedIds.includes(p.id))
            .map(p => ({
                id: p.id,
                date: p.payment_date,
                amount: Number(p.amount),
                description: `Payment for ${p.invoice.invoice_number} (${p.invoice.customer?.name})`,
                type: 'expense' // Outflow
            }));

        const unreconciledVendorPayments = (vendorPayments as any[]).filter(p => !linkedIds.includes(p.id))
            .map(p => ({
                id: p.id,
                date: p.payment_date,
                amount: Number(p.amount) * -1, // Vendor payment is outflow, represented negatives usually?
                // Wait, BankTransaction amount usually: + for deposit, - for withdrawal.
                // Payment (AR) is Inflow (+). Vendor Payment (AP) is Outflow (-).
                description: `Bill Pay ${p.vendor_bill.bill_number} (${p.vendor_bill.vendor?.name})`,
                type: 'expense'
            }));

        // Transform payments to match a common interface
        const systemTransactions = [
            ...unreconciledPayments.map(p => ({ ...p, type: 'income' })), // AR Payment is Income
            ...unreconciledVendorPayments.map(p => ({ ...p, amount: Math.abs(p.amount) * -1, type: 'expense' })) // AP Payment is Expense
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            bankTransactions: bankTransactions.map(t => ({ ...t, amount: Number(t.amount) })),
            systemTransactions
        });

    } catch (error) {
        console.error('Reconciliation GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { bank_transaction_id, system_transaction_id } = await request.json();

        if (!bank_transaction_id || !system_transaction_id) {
            return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
        }

        // Link them
        const updated = await prisma.bankTransaction.update({
            where: { id: bank_transaction_id },
            data: {
                system_transaction_id,
                status: 'reconciled'
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Reconciliation POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
