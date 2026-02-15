import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await prisma.purchaseOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: { vendor: true, creator: true, purchase_request: true }
    });

    const serializedOrders = orders.map(o => ({
      ...o,
      total_amount: Number(o.total_amount)
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error('Purchase Orders GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { po_number, vendor_id, purchase_request_id, total_amount, status, lines } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Create the Purchase Order
      const po = await tx.purchaseOrder.create({
        data: {
          po_number,
          vendor_id,
          purchase_request_id: purchase_request_id === 'none' ? null : purchase_request_id,
          total_amount: parseFloat(total_amount),
          status: status || 'approved',
          created_by: user.id,
          lines: {
            create: lines.map((line: any, index: number) => ({
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

      // Update purchase request status if linked
      if (purchase_request_id && purchase_request_id !== 'none') {
        await tx.purchaseRequest.update({
          where: { id: purchase_request_id },
          data: { status: 'ordered' }
        });
      }

      return po;
    });

    return NextResponse.json({
      ...result,
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
    console.error('Purchase Order POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
