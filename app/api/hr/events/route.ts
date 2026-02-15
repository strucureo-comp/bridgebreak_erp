import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const type = searchParams.get('type');

    try {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        if (type) where.type = type;

        const events = await prisma.hREvent.findMany({
            where,
            include: { employee: { select: { id: true, name: true, employee_id: true } } },
            orderBy: { event_date: 'desc' },
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('HR Events GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const event = await prisma.hREvent.create({
            data: {
                employee_id: body.employee_id,
                type: body.type,
                title: body.title,
                description: body.description || null,
                event_date: new Date(body.event_date).toISOString(),
                effective_date: body.effective_date ? new Date(body.effective_date).toISOString() : null,
                metadata: body.metadata || null,
                created_by: user.id,
            },
            include: { employee: { select: { id: true, name: true, employee_id: true } } },
        });

        // Handle side effects based on event type
        if (body.type === 'exit' || body.type === 'layoff') {
            await prisma.employee.update({
                where: { id: body.employee_id },
                data: {
                    status: 'inactive',
                    lifecycle_status: body.type === 'exit' ? 'resigned' : 'terminated',
                    exit_date: body.effective_date ? new Date(body.effective_date) : new Date(),
                    exit_reason: body.description || body.title,
                }
            });
        } else if (body.type === 'hiring') {
            await prisma.employee.update({
                where: { id: body.employee_id },
                data: { lifecycle_status: 'probation' }
            });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
