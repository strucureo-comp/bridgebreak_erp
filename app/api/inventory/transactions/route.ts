import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        item: true,
        project: { select: { title: true } },
        user: { select: { full_name: true } }
      }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { item_id, type, quantity, project_id, notes, reference_no } = body;
    const qty = parseFloat(quantity);

    // Transaction logic to update stock
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: item_id } });
      if (!item) throw new Error("Item not found");

      let newStock = item.current_stock;

      switch (type) {
        case 'stock_in':
        case 'return_from_project':
          newStock += qty;
          break;
        case 'stock_out':
        case 'issue_to_project':
        case 'scrap':
        case 'wastage':
          newStock -= qty;
          break;
      }

      // Update Item Stock
      await tx.inventoryItem.update({
        where: { id: item_id },
        data: { current_stock: newStock }
      });

      // Create Transaction Record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          item_id,
          type,
          quantity: qty,
          project_id: project_id || null,
          notes,
          reference_no,
          created_by: user.id
        }
      });

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
