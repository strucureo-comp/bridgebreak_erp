import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const customerId = searchParams.get('customerId'); // account_id
    const opportunityId = searchParams.get('opportunityId');
    const type = searchParams.get('type');

    try {
        const activities = await prisma.activity.findMany({
            where: {
                ...(type ? { type: type as any } : {}),
                ...(leadId ? { lead_id: leadId } : {}),
                ...(customerId ? { account_id: customerId } : {}),
                ...(opportunityId ? { opportunity_id: opportunityId } : {})
            },
            include: {
                user: { select: { full_name: true, avatar_url: true } },
                lead: { select: { first_name: true, last_name: true } },
                account: { select: { name: true } },
                opportunity: { select: { name: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Activities Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { type, subject, description, due_date, lead_id, customer_id, opportunity_id, contact_id, completed } = body;

        const activity = await prisma.activity.create({
            data: {
                type,
                subject,
                description,
                due_date: due_date ? new Date(due_date) : null,
                completed: completed || false,
                user_id: user.id,
                lead_id,
                account_id: customer_id, // Map customer_id to account_id (ContactAccount)
                opportunity_id,
                contact_id
            }
        });

        return NextResponse.json(activity);
    } catch (error) {
        console.error('Create Activity Error:', error);
        return NextResponse.json({ error: 'Failed to create activity' }, { status: 400 });
    }
}
