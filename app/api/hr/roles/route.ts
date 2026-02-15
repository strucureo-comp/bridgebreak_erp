import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const roles = await prisma.hRRole.findMany({
            orderBy: { title: 'asc' },
            include: { _count: { select: { employees: true } } }
        });
        const serialized = roles.map(r => ({
            ...r,
            min_salary: r.min_salary ? Number(r.min_salary) : null,
            max_salary: r.max_salary ? Number(r.max_salary) : null,
        }));
        return NextResponse.json(serialized);
    } catch (error) {
        console.error('HR Roles GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const role = await prisma.hRRole.create({
            data: {
                code: body.code,
                title: body.title,
                grade: body.grade || null,
                min_salary: body.min_salary ? parseFloat(body.min_salary) : null,
                max_salary: body.max_salary ? parseFloat(body.max_salary) : null,
            }
        });
        return NextResponse.json({
            ...role,
            min_salary: role.min_salary ? Number(role.min_salary) : null,
            max_salary: role.max_salary ? Number(role.max_salary) : null,
        });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Role code already exists' }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
