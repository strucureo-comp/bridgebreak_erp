import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const orders = await prisma.salesOrder.findMany({
            include: {
                account: { select: { name: true } },
                project: { select: { title: true } },
                creator: { select: { full_name: true } },
                quote: { select: { number: true } },
                lines: true
            },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error('GET /api/admin/sales/orders ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            quote_id, // Optional: Convert from Quote
            account_id,
            project_id,
            total_amount,
            lines // Array of { description, quantity, unit_price, total_price }
        } = body;

        // Generate Order Number
        const count = await prisma.salesOrder.count();
        const number = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

        // If converting from Quote, mark quote as converted
        if (quote_id) {
            await prisma.quote.update({
                where: { id: quote_id },
                data: { status: 'converted' }
            });
        }

        const order = await prisma.salesOrder.create({
            data: {
                number,
                quote_id,
                account_id,
                project_id,
                total_amount,
                status: 'confirmed',
                created_by: user.id,
                lines: {
                    create: lines.map((line: any) => ({
                        description: line.description,
                        quantity: line.quantity,
                        unit_price: line.unit_price,
                        total_price: line.total_price
                    }))
                }
            },
            include: { lines: true }
        });

        return NextResponse.json(order);

    } catch (error) {
        console.error('POST /api/admin/sales/orders ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
