import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const orders = await prisma.productionOrder.findMany({
            include: {
                variant: { include: { product: true } },
                bom: true,
                components: { include: { variant: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { bom_id, quantity, start_date } = body;

        const bom = await prisma.billOfMaterial.findUnique({
            where: { id: bom_id },
            include: { components: true }
        });

        if (!bom) return NextResponse.json({ error: 'BOM not found' }, { status: 404 });

        // Calculate component requirements
        // BOM yield = bom.quantity. If we want Order quantity Q, 
        // multiplier = Q / bom.quantity
        const multiplier = Number(quantity) / Number(bom.quantity);

        const count = await prisma.productionOrder.count();
        const number = `PROD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

        const order = await prisma.productionOrder.create({
            data: {
                number,
                bom_id,
                variant_id: bom.variant_id,
                quantity: quantity,
                status: 'planned',
                start_date: start_date ? new Date(start_date) : new Date(),
                components: {
                    create: bom.components.map(c => ({
                        variant_id: c.variant_id,
                        expected_qty: Number(c.quantity) * multiplier,
                        actual_qty: 0
                    }))
                }
            }
        });

        return NextResponse.json(order);

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status } = body;

        const order = await prisma.productionOrder.findUnique({
            where: { id },
            include: { components: true }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Simple status update for now. 
        // In a real system, 'completed' would trigger stock movements:
        // - Decrease stock of components
        // - Increase stock of finished good
        // - Create InventoryTransactions

        // MVP: Just update status
        const updated = await prisma.productionOrder.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
