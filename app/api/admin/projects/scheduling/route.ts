import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    try {
        const where: any = {};
        if (projectId) where.project_id = projectId;
        if (userId) where.user_id = userId;

        const bookings = await prisma.resourceBooking.findMany({
            where,
            include: {
                project: { select: { title: true } },
                user: { select: { full_name: true, email: true } }
            },
            orderBy: { start_date: 'asc' }
        });
        return NextResponse.json(bookings);
    } catch (error) {
        console.error('GET /api/admin/projects/scheduling ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    // Only admins or project managers
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { project_id, user_id, start_date, end_date, hours, notes } = body;

        // Basic conflict check (optional, but good for "Scheduling")
        // Overlapping bookings for same user?
        // Skipped for MVP per requirements focus purely on CRUD for now.

        const booking = await prisma.resourceBooking.create({
            data: {
                project_id,
                user_id,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                hours,
                notes,
                status: 'confirmed'
            }
        });

        return NextResponse.json(booking);

    } catch (error) {
        console.error('POST /api/admin/projects/scheduling ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
