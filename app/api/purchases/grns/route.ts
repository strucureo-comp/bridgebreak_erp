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
    const { grn_number, purchase_order_id, received_date, notes, lines } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the GRN
      const grn = await tx.gRN.create({
        data: {
          grn_number,
          purchase_order_id,
          received_date: received_date ? new Date(received_date) : new Date(),
          received_by: user.id,
          notes
        }
      });

      // 2. Process Lines (Inventory Updates)
      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          if (!line.variant_id || !line.quantity || !line.location_id) continue;

          const quantity = parseFloat(line.quantity);

          // Create Inventory Transaction Log
          await tx.inventoryTransaction.create({
            data: {
              type: 'in',
              variant_id: line.variant_id,
              to_location_id: line.location_id,
              quantity: quantity,
              reference: `GRN-${grn.grn_number}`,
              date: new Date(),
              created_by: user.id,
              project_id: body.project_id // Optional link if PO was for a project
            }
          });

          // Update/Upsert Inventory Item (Stock at Location)
          const existingItem = await tx.inventoryItem.findUnique({
            where: {
              variant_id_location_id: {
                variant_id: line.variant_id,
                location_id: line.location_id
              }
            }
          });

          if (existingItem) {
            await tx.inventoryItem.update({
              where: { id: existingItem.id },
              data: { quantity: { increment: quantity } }
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                variant_id: line.variant_id,
                location_id: line.location_id,
                quantity: quantity
              }
            });
          }
        }
      }

      // 3. Update Purchase Order Status
      await tx.purchaseOrder.update({
        where: { id: purchase_order_id },
        data: { status: 'received' }
      });

      return grn;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GRN Creation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
