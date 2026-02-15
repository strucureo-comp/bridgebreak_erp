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
    const { bill_number, purchase_order_id, vendor_id, amount, tax_amount, due_date, status, lines, total_amount } = body;

    const result = await prisma.$transaction(async (tx) => {
        const bill = await tx.vendorBill.create({
            data: {
                bill_number,
                purchase_order_id: purchase_order_id === 'none' ? null : purchase_order_id,
                vendor_id,
                amount: parseFloat(amount),
                tax_amount: tax_amount ? parseFloat(tax_amount) : 0,
                total_amount: parseFloat(total_amount || amount),
                due_date: new Date(due_date),
                status: status || 'pending',
                posting_status: 'draft',
                lines: {
                    create: lines?.map((line: any, index: number) => ({
                        description: line.description,
                        quantity: parseFloat(line.quantity),
                        unit_price: parseFloat(line.unit_price),
                        amount: parseFloat(line.amount),
                        tax_amount: parseFloat(line.tax_amount || 0),
                        total_amount: parseFloat(line.total_amount),
                        sort_order: index
                    }))
                }
            },
            include: { lines: true }
        });

        // Update PO status if linked
        if (purchase_order_id && purchase_order_id !== 'none') {
            await tx.purchaseOrder.update({
                where: { id: purchase_order_id },
                data: { status: 'billed' }
            });
        }

        return bill;
    });

    return NextResponse.json({
      ...result,
      amount: Number(result.amount),
      tax_amount: result.tax_amount ? Number(result.tax_amount) : 0,
      total_amount: Number(result.total_amount),
      lines: result.lines.map(l => ({
          ...l,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          amount: Number(l.amount),
          tax_amount: Number(l.tax_amount),
          total_amount: Number(l.total_amount)
      }))
    });
  } catch (error) {
    console.error('Vendor Bill POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
