import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payments = await prisma.vendorPayment.findMany({
      orderBy: { created_at: 'desc' },
      include: { vendor_bill: { include: { vendor: true } } }
    }) as Array<any>;

    const serializedPayments = payments.map(p => ({
      ...p,
      amount: Number(p.amount),
      vendor_bill: p.vendor_bill ? {
        ...p.vendor_bill,
        amount: Number(p.vendor_bill.amount),
        tax_amount: p.vendor_bill.tax_amount ? Number(p.vendor_bill.tax_amount) : null
      } : null
    }));

    return NextResponse.json(serializedPayments);
  } catch (error) {
    console.error('Vendor Payments GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { vendor_bill_id, amount, payment_date, payment_method, reference_no, notes } = body;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Payment Record
        const payment = await tx.vendorPayment.create({
            data: {
                vendor_bill_id,
                amount: parseFloat(amount),
                payment_date: payment_date ? new Date(payment_date) : new Date(),
                payment_method,
                reference_no,
                notes
            }
        });

        // 2. Check Bill Status
        const bill = await tx.vendorBill.findUnique({
            where: { id: vendor_bill_id },
            include: { vendor_payments: true }
        });

        if (bill) {
            const totalPaid = bill.vendor_payments.reduce((sum, p) => sum + Number(p.amount), 0) + parseFloat(amount); // + current payment (actually already created above so it might be included if fetched after? No, in transaction context it depends on isolation level, safer to add manually or refetch carefully. Prisma transaction sees its own writes.)
            // Actually, findUnique inside tx AFTER create will see the new payment.
            // Let's re-calculate cleanly.
            
            // Re-fetch payments to be sure
            const payments = await tx.vendorPayment.findMany({ where: { vendor_bill_id } });
            const actualTotalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

            if (actualTotalPaid >= Number(bill.total_amount)) {
                await tx.vendorBill.update({
                    where: { id: vendor_bill_id },
                    data: { status: 'paid' }
                });
                
                // If linked to PO, check if PO should be 'paid'
                if (bill.purchase_order_id) {
                    await tx.purchaseOrder.update({
                        where: { id: bill.purchase_order_id },
                        data: { status: 'paid' }
                    });
                }
            }
        }

        // 3. Create GL Transaction (Cash Flow)
        await tx.transaction.create({
            data: {
                type: 'expense',
                category: 'Vendor Payment',
                amount: parseFloat(amount),
                date: payment_date ? new Date(payment_date) : new Date(),
                description: `Payment for Bill #${bill?.bill_number}`,
                payment_method,
                reference_number: reference_no,
                created_by: user.id
            }
        });

        return payment;
    });

    return NextResponse.json({
      ...result,
      amount: Number(result.amount)
    });
  } catch (error) {
    console.error('Payment Recording Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
