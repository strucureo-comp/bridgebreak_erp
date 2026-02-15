import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const priceLists = await prisma.priceList.findMany({
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                }
            }
        });
        return NextResponse.json(priceLists);
    } catch (error) {
        console.error('GET /api/admin/sales/pricelists ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, currency, items } = body; // items: { variant_id, price, min_quantity }[]

        const priceList = await prisma.priceList.create({
            data: {
                name,
                currency,
                items: {
                    create: items.map((item: any) => ({
                        variant_id: item.variant_id,
                        price: item.price,
                        min_quantity: item.min_quantity || 1
                    }))
                }
            },
            include: { items: true }
        });

        return NextResponse.json(priceList);

    } catch (error) {
        console.error('POST /api/admin/sales/pricelists ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
