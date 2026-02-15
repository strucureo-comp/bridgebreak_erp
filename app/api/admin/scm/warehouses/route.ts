
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const warehouses = await prisma.warehouse.findMany({
            include: {
                locations: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(warehouses);
    } catch (error) {
        console.error('GET /api/admin/scm/warehouses ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, code, address, locations } = body;

        const warehouse = await prisma.warehouse.create({
            data: {
                name,
                code,
                address,
                locations: locations && locations.length > 0 ? {
                    create: locations.map((loc: any) => ({
                        code: loc.code,
                        name: loc.name,
                        type: loc.type
                    }))
                } : undefined
            },
            include: {
                locations: true
            }
        });

        return NextResponse.json(warehouse);
    } catch (error) {
        console.error('POST /api/admin/scm/warehouses ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
