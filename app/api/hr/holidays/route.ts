import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: { date: 'asc' },
        });
        return NextResponse.json(holidays);
    } catch (error) {
        console.error('Holidays GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const holiday = await prisma.holiday.create({
            data: {
                name: body.name,
                date: new Date(body.date).toISOString(),
                type: body.type || 'public',
            }
        });
        return NextResponse.json(holiday);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A holiday already exists on this date' }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
