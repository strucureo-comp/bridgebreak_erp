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
    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: body.po_number,
        vendor_id: body.vendor_id,
        purchase_request_id: body.purchase_request_id === 'none' ? null : body.purchase_request_id,
        total_amount: parseFloat(body.total_amount),
        status: body.status || 'approved',
        created_by: user.id
      }
    });
    return NextResponse.json({
      ...po,
      total_amount: Number(po.total_amount)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
