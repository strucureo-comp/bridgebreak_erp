import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  let where: any = {};
  if (user.role === 'client') {
    where.client_id = user.id;
  } else if (clientId) {
    where.client_id = clientId;
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        client: { select: { full_name: true, email: true } },
        project: { select: { title: true } }
      }
    });

    const serializedInvoices = invoices.map(inv => ({
      ...inv,
      amount: Number(inv.amount)
    }));

    return NextResponse.json(serializedInvoices);
  } catch (error) {
    console.error('Invoices GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const invoice = await prisma.invoice.create({
      data: {
        ...body,
        amount: parseFloat(body.amount),
        created_at: undefined, // Let DB handle default
        updated_at: undefined
      }
    });
    return NextResponse.json({
      ...invoice,
      amount: Number(invoice.amount)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
