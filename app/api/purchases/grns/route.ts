import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const grns = await prisma.gRN.findMany({
      orderBy: { created_at: 'desc' },
      include: { purchase_order: { include: { vendor: true } }, receiver: true }
    });
    return NextResponse.json(grns);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const grn = await prisma.gRN.create({
      data: {
        grn_number: body.grn_number,
        purchase_order_id: body.purchase_order_id,
        received_date: body.received_date ? new Date(body.received_date) : new Date(),
        received_by: user.id,
        notes: body.notes
      }
    });
    return NextResponse.json(grn);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
