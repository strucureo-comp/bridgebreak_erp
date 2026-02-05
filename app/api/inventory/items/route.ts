import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });

    const serializedItems = items.map(item => ({
      ...item,
      cost_price: item.cost_price ? Number(item.cost_price) : null
    }));

    return NextResponse.json(serializedItems);
  } catch (error) {
    console.error('Inventory Items GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const item = await prisma.inventoryItem.create({
      data: {
        code: body.code,
        name: body.name,
        category: body.category,
        unit: body.unit,
        current_stock: parseFloat(body.current_stock || 0),
        min_stock: parseFloat(body.min_stock || 0),
        cost_price: body.cost_price ? parseFloat(body.cost_price) : undefined,
      }
    });
    return NextResponse.json({
      ...item,
      cost_price: item.cost_price ? Number(item.cost_price) : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
