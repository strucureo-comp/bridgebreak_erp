import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const quotes = await prisma.quote.findMany({
            include: {
                account: { select: { name: true } },
                project: { select: { title: true } },
                creator: { select: { full_name: true } },
                lines: true
            },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(quotes);
    } catch (error) {
        console.error('GET /api/admin/sales/quotes ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            account_id,
            project_id,
            total_amount,
            valid_until,
            notes,
            terms,
            lines // Array of { description, quantity, unit_price, total_price }
        } = body;

        // Generate Quote Number
        const count = await prisma.quote.count();
        const number = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

        const quote = await prisma.quote.create({
            data: {
                number,
                account_id,
                project_id,
                valid_until: new Date(valid_until),
                total_amount,
                notes,
                terms,
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

        return NextResponse.json(quote);

    } catch (error) {
        console.error('POST /api/admin/sales/quotes ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
