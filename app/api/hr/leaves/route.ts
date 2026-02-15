import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');

    try {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        if (status) where.status = status;

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                employee: { select: { id: true, name: true, employee_id: true, department: true } },
                leave_type: true,
            },
            orderBy: { created_at: 'desc' },
        });
        const serialized = leaves.map(l => ({
            ...l,
            days: Number(l.days),
        }));
        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Leaves GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const leave = await prisma.leave.create({
            data: {
                employee_id: body.employee_id,
                leave_type_id: body.leave_type_id,
                from_date: new Date(body.from_date).toISOString(),
                to_date: new Date(body.to_date).toISOString(),
                days: parseFloat(body.days),
                reason: body.reason || null,
            },
            include: { employee: true, leave_type: true },
        });
        return NextResponse.json({ ...leave, days: Number(leave.days) });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const leave = await prisma.leave.update({
            where: { id: body.id },
            data: {
                status: body.status,
                approved_by: user.id,
                approved_at: new Date(),
                remarks: body.remarks || null,
            },
        });
        return NextResponse.json({ ...leave, days: Number(leave.days) });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
