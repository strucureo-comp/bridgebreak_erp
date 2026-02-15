import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const types = await prisma.leaveType.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(types);
    } catch (error) {
        console.error('LeaveTypes GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const type = await prisma.leaveType.create({
            data: {
                code: body.code,
                name: body.name,
                days_per_year: parseInt(body.days_per_year) || 0,
                is_paid: body.is_paid !== false,
                carry_forward: body.carry_forward === true,
                max_carry: parseInt(body.max_carry) || 0,
            }
        });
        return NextResponse.json(type);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Leave type code already exists' }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
