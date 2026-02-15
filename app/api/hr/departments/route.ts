import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { employees: true } } }
        });
        return NextResponse.json(departments);
    } catch (error) {
        console.error('Departments GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const department = await prisma.department.create({
            data: {
                code: body.code,
                name: body.name,
                head_id: body.head_id || null,
                parent_id: body.parent_id || null,
            }
        });
        return NextResponse.json(department);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Department code already exists' }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
