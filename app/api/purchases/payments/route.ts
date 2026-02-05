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
    const payment = await prisma.vendorPayment.create({
      data: {
        vendor_bill_id: body.vendor_bill_id,
        amount: parseFloat(body.amount),
        payment_date: body.payment_date ? new Date(body.payment_date) : new Date(),
        payment_method: body.payment_method,
        reference_no: body.reference_no,
        notes: body.notes
      }
    });
    return NextResponse.json({
      ...payment,
      amount: Number(payment.amount)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
