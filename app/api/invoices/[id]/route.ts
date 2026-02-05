import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id }
    });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin' && invoice.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...invoice,
      amount: Number(invoice.amount)
    });
  } catch (error) {
    console.error('Invoice GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    
    // Convert amount to number if it exists in the body
    const data = { ...body };
    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount);
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data
    });
    
    return NextResponse.json({
      ...invoice,
      amount: Number(invoice.amount)
    });
  } catch (error) {
    console.error('Invoice PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.invoice.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
