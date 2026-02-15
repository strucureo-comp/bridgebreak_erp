import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'goals' or 'reviews'
    const userId = searchParams.get('userId') || user.id; // Default to self if not admin speciying someone else

    // Simple permission check: Can only view own unless admin
    if (userId !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        if (type === 'goals') {
            const goals = await prisma.performanceGoal.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });
            return NextResponse.json(goals);
        } else {
            const reviews = await prisma.performanceReview.findMany({
                where: { OR: [{ user_id: userId }, { reviewer_id: userId }] },
                include: {
                    user: { select: { full_name: true } },
                    reviewer: { select: { full_name: true } }
                },
                orderBy: { created_at: 'desc' }
            });
            return NextResponse.json(reviews);
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { type } = body;

        if (type === 'goal') {
            const { title, description, due_date } = body;
            const goal = await prisma.performanceGoal.create({
                data: {
                    user_id: user.id, // for now allow self-creation
                    title,
                    description,
                    due_date: due_date ? new Date(due_date) : null,
                    status: 'not_started'
                }
            });
            return NextResponse.json(goal);
        } else if (type === 'review') {
            if (user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            const { user_id, cycle } = body;
            const review = await prisma.performanceReview.create({
                data: {
                    user_id,
                    reviewer_id: user.id, // Current admin is the reviewer
                    cycle,
                    status: 'draft'
                }
            });
            return NextResponse.json(review);
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
