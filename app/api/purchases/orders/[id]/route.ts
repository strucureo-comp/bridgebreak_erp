import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { 
        vendor: true, 
        creator: true, 
        purchase_request: {
          include: { requester: true }
        },
        lines: true
      }
    });

    if (!order) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });

    const serializedOrder = {
      ...order,
      total_amount: Number(order.total_amount),
      lines: order.lines.map(line => ({
        ...line,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        amount: Number(line.amount),
        tax_amount: Number(line.tax_amount || 0),
        total_amount: Number(line.total_amount)
      }))
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error('Purchase Order GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const order = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: body.status,
        vendor_id: body.vendor_id,
        total_amount: body.total_amount ? parseFloat(body.total_amount) : undefined,
      }
    });

    return NextResponse.json({
      ...order,
      total_amount: Number(order.total_amount)
    });
  } catch (error) {
    console.error('Purchase Order PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Only allow deletion if not received/billed/paid
    const order = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (['received', 'billed', 'paid'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot delete a processed purchase order' }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Purchase Order DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
