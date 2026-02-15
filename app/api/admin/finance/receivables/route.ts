import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: { select: { name: true } },
                project: { select: { title: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        const serialized = invoices.map(inv => ({
            ...inv,
            amount: Number(inv.amount),
            // Add aging calculation here if needed
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Receivables GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            customer_id,
            project_id,
            invoice_number,
            amount,
            tax_amount,
            total_amount,
            currency,
            due_date,
            notes,
            terms,
            tax_breakdown,
            lines,
            posting_status
        } = body;

        // 1. Create Invoice with enhanced fields
        const invoice = await prisma.invoice.create({
            data: {
                customer_id,
                project_id,
                invoice_number,
                amount: Number(amount),
                tax_amount: tax_amount ? Number(tax_amount) : 0,
                total_amount: total_amount ? Number(total_amount) : Number(amount),
                currency: currency || 'USD',
                due_date: new Date(due_date),
                notes: notes || null,
                terms: terms || null,
                status: 'pending',
                posting_status: 'draft',
                client_id: body.client_id || null,
            }
        });

        // 2. Create invoice line items if provided
        if (lines && Array.isArray(lines) && lines.length > 0) {
            await prisma.invoiceLine.createMany({
                data: lines.map((line: any, index: number) => ({
                    invoice_id: invoice.id,
                    description: line.description,
                    quantity: Number(line.quantity),
                    unit_price: Number(line.unit_price),
                    amount: Number(line.amount),
                    tax_rate_id: line.tax_rate_id || null,
                    tax_amount: line.tax_amount ? Number(line.tax_amount) : 0,
                    total_amount: line.total_amount ? Number(line.total_amount) : Number(line.amount),
                    sort_order: index,
                }))
            });
        }

        // 3. Check for Approval
        const { submitForApproval } = await import('@/lib/finance/approvals');
        const approvalRequest = await submitForApproval(invoice.id, 'Invoice', user.id, parseFloat(total_amount || amount));

        let finalPostingStatus = posting_status || 'draft';

        if (approvalRequest) {
            finalPostingStatus = 'draft';
            console.log(`Invoice ${invoice.id} requires approval. Request: ${approvalRequest.id}`);
        } else {
            if (posting_status === 'posted') {
                finalPostingStatus = 'posted';

                // Post to GL with tax consideration
                const arAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '1030' }, { code: '1040' }, { name: { contains: 'Receivable' } }] }
                });

                const revenueAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '4010' }, { name: { contains: 'Revenue' } }, { name: { contains: 'Sales' } }] }
                });

                const taxAccount = await prisma.account.findFirst({
                    where: { OR: [{ code: '2050' }, { name: { contains: 'Tax Payable' } }, { name: { contains: 'VAT' } }] }
                });

                if (arAccount && revenueAccount) {
                    const lineItems: any[] = [
                        {
                            account_id: arAccount.id,
                            debit: parseFloat(total_amount || amount),
                            credit: 0,
                            description: 'Accounts Receivable'
                        },
                        {
                            account_id: revenueAccount.id,
                            debit: 0,
                            credit: parseFloat(amount),
                            description: 'Sales Revenue'
                        }
                    ];

                    // Add tax liability if tax amount exists
                    if (tax_amount && taxAccount) {
                        lineItems.push({
                            account_id: taxAccount.id,
                            debit: 0,
                            credit: parseFloat(tax_amount),
                            description: 'Sales Tax/VAT Liability'
                        });
                    }

                    await prisma.journalEntry.create({
                        data: {
                            date: new Date(),
                            description: `Invoice Posting #${invoice.invoice_number}`,
                            status: 'posted',
                            reference: invoice.id,
                            created_by: user.id,
                            lines: { create: lineItems }
                        }
                    });
                } else {
                    console.warn('GL Accounts for AR/Revenue not found. Invoice created but not posted to GL.');
                }
            }
        }

        // Update Invoice with final status
        if (invoice.posting_status !== finalPostingStatus) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { posting_status: finalPostingStatus }
            });
        }

        // Return invoice with lines
        const invoiceWithLines = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: { lines: true, customer: { select: { name: true } } }
        });

        return NextResponse.json(invoiceWithLines);
    } catch (error) {
        console.error('Receivables POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
