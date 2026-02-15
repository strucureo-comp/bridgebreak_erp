
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const variant_id = searchParams.get('variant_id');
        const location_id = searchParams.get('location_id');

        const where: any = {};
        if (variant_id) where.variant_id = variant_id;
        if (location_id) where.to_location_id = location_id; // Filter by destination or source?

        const transactions = await prisma.inventoryTransaction.findMany({
            where,
            include: {
                variant: true,
                user: { select: { id: true, full_name: true } }
            },
            orderBy: { date: 'desc' },
            take: 100
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('GET /api/admin/scm/inventory ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { type, variant_id, from_location_id, to_location_id, quantity, reference, notes } = body;

        // Transaction to ensure stock consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction Log
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    type,
                    variant_id,
                    from_location_id,
                    to_location_id,
                    quantity,
                    reference,
                    created_by: session.user.id
                }
            });

            // 2. Update Stock Levels
            if (from_location_id) {
                // Decrease from source
                const sourceItem = await tx.inventoryItem.findUnique({
                    where: {
                        variant_id_location_id: {
                            variant_id,
                            location_id: from_location_id
                        }
                    }
                });

                if (!sourceItem || sourceItem.quantity.toNumber() < Number(quantity)) {
                    throw new Error(`Insufficient stock at source location ${from_location_id}`);
                }

                await tx.inventoryItem.update({
                    where: { id: sourceItem.id },
                    data: { quantity: { decrement: quantity } }
                });
            }

            if (to_location_id) {
                // Increase at destination
                await tx.inventoryItem.upsert({
                    where: {
                        variant_id_location_id: {
                            variant_id,
                            location_id: to_location_id
                        }
                    },
                    create: {
                        variant_id,
                        location_id: to_location_id,
                        quantity
                    },
                    update: {
                        quantity: { increment: quantity }
                    }
                });
            }

            return transaction;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('POST /api/admin/scm/inventory ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
