import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const boms = await prisma.billOfMaterial.findMany({
            include: {
                variant: { include: { product: true } },
                components: {
                    include: {
                        variant: { include: { product: true } }
                    }
                }
            }
        });
        return NextResponse.json(boms);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, variant_id, quantity, components } = body;
        // components: { variant_id, quantity }[]

        const bom = await prisma.billOfMaterial.create({
            data: {
                name,
                variant_id,
                quantity: quantity || 1,
                components: {
                    create: components.map((c: any) => ({
                        variant_id: c.variant_id,
                        quantity: c.quantity
                    }))
                }
            },
            include: { components: true }
        });

        return NextResponse.json(bom);

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
