import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const bills = await prisma.vendorBill.findMany({
      orderBy: { created_at: 'desc' },
      include: { vendor: true, purchase_order: true }
    });

    const serializedBills = bills.map(b => ({
      ...b,
      amount: Number(b.amount),
      tax_amount: b.tax_amount ? Number(b.tax_amount) : null
    }));

    return NextResponse.json(serializedBills);
  } catch (error) {
    console.error('Vendor Bills GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const bill = await prisma.vendorBill.create({
      data: {
        bill_number: body.bill_number,
        purchase_order_id: body.purchase_order_id,
        vendor_id: body.vendor_id,
        amount: parseFloat(body.amount),
        tax_amount: body.tax_amount ? parseFloat(body.tax_amount) : null,
        due_date: new Date(body.due_date),
        status: body.status || 'pending'
      }
    });
    return NextResponse.json({
      ...bill,
      amount: Number(bill.amount),
      tax_amount: bill.tax_amount ? Number(bill.tax_amount) : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
