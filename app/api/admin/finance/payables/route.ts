import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const bills = await prisma.vendorBill.findMany({
            include: {
                vendor: { select: { name: true, email: true } },
                purchase_order: { select: { po_number: true } },
                lines: true
            },
            orderBy: { created_at: 'desc' }
        });

        const serialized = bills.map(bill => ({
            ...bill,
            amount: Number(bill.amount),
            tax_amount: bill.tax_amount ? Number(bill.tax_amount) : 0,
            total_amount: bill.total_amount ? Number(bill.total_amount) : Number(bill.amount),
            lines: (bill as any).lines.map((line: any) => ({
                ...line,
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price),
                amount: Number(line.amount),
                tax_amount: line.tax_amount ? Number(line.tax_amount) : 0,
                total_amount: line.total_amount ? Number(line.total_amount) : Number(line.amount),
            }))
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Payables GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            vendor_id,
            purchase_order_id,
            bill_number,
            amount,
            tax_amount,
            total_amount,
            currency,
            due_date,
            notes,
            tax_breakdown,
            lines,
            posting_status
        } = body;

        // Validate required fields
        if (!vendor_id || !bill_number || !amount || !due_date) {
            return NextResponse.json(
                { error: 'Missing required fields: vendor_id, bill_number, amount, due_date' },
                { status: 400 }
            );
        }

        // 1. Create Vendor Bill with enhanced fields
        const bill = await prisma.vendorBill.create({
            data: {
                vendor_id,
                purchase_order_id: purchase_order_id || null,
                bill_number,
                amount: parseFloat(amount),
                tax_amount: tax_amount ? parseFloat(tax_amount) : 0,
                total_amount: total_amount ? parseFloat(total_amount) : parseFloat(amount),
                currency: currency || 'USD',
                due_date: new Date(due_date),
                status: 'pending',
                posting_status: 'draft',
                notes: notes || null,
            }
        });

        // 2. Create vendor bill line items if provided
        if (lines && Array.isArray(lines) && lines.length > 0) {
            await prisma.vendorBillLine.createMany({
                data: lines.map((line: any, index: number) => ({
                    vendor_bill_id: bill.id,
                    description: line.description,
                    quantity: Number(line.quantity) || 1,
                    unit_price: Number(line.unit_price) || 0,
                    amount: Number(line.amount) || 0,
                    tax_rate_id: line.tax_rate_id || null,
                    tax_amount: line.tax_amount ? Number(line.tax_amount) : 0,
                    total_amount: line.total_amount ? Number(line.total_amount) : Number(line.amount),
                    sort_order: index,
                }))
            });
        }

        // 3. Check for Approval workflow
        const { submitForApproval } = await import('@/lib/finance/approvals');
        const approvalRequest = await submitForApproval(bill.id, 'VendorBill', user.id, parseFloat(total_amount || amount));

        let finalPostingStatus = posting_status || 'draft';

        if (approvalRequest) {
            finalPostingStatus = 'draft';
            console.log(`Vendor Bill ${bill.id} requires approval. Request: ${approvalRequest.id}`);
        } else {
            if (posting_status === 'posted') {
                finalPostingStatus = 'posted';

                // Post to GL with tax consideration
                const expenseAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '5010' }, { code: '5000' }, { type: 'expense' }] }
                });

                const apAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '2010' }, { name: { contains: 'Payable' } }] }
                });

                const taxAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '2050' }, { name: { contains: 'Tax Receivable' } }, { name: { contains: 'VAT' } }] }
                });

                if (expenseAccount && apAccount) {
                    const lineItems: any[] = [
                        {
                            account_id: expenseAccount.id,
                            debit: parseFloat(amount),
                            credit: 0,
                            description: 'Cost of Goods / Expense'
                        },
                        {
                            account_id: apAccount.id,
                            debit: 0,
                            credit: parseFloat(total_amount || amount),
                            description: 'Accounts Payable'
                        }
                    ];

                    // Add tax recoverable if tax amount exists
                    if (tax_amount && taxAccount) {
                        lineItems.push({
                            account_id: taxAccount.id,
                            debit: parseFloat(tax_amount),
                            credit: 0,
                            description: 'Input Tax/VAT Recoverable'
                        });
                    }

                    await prisma.journalEntry.create({
                        data: {
                            date: new Date(),
                            description: `Vendor Bill Posting #${bill.bill_number}`,
                            status: 'posted',
                            reference: bill.id,
                            created_by: user.id,
                            lines: { create: lineItems }
                        }
                    });
                } else {
                    console.warn('GL Accounts for AP/Expense not found. Bill created but not posted to GL.');
                }
            }
        }

        // Update Bill with final status
        if (bill.posting_status !== finalPostingStatus) {
            await prisma.vendorBill.update({
                where: { id: bill.id },
                data: { posting_status: finalPostingStatus }
            });
        }

        // Return bill with lines
        const billWithLines = await prisma.vendorBill.findUnique({
            where: { id: bill.id },
            include: {
                lines: true,
                vendor: { select: { name: true, email: true } }
            }
        });

        return NextResponse.json(billWithLines);
    } catch (error) {
        console.error('Payables POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
