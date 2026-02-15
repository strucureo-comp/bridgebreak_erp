import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    try {
        const opportunities = await prisma.opportunity.findMany({
            where: {
                ...(stage ? { stage: stage as any } : {}),
                ...(search ? {
                    name: { contains: search, mode: 'insensitive' }
                } : {})
            },
            include: {
                account: { select: { id: true, name: true } }, // CustomerAccount
                owner: { select: { full_name: true } },
                activities: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(opportunities);
    } catch (error) {
        console.error('Opportunities Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, account_id, amount, stage, probability, close_date } = body;

        const opportunity = await prisma.opportunity.create({
            data: {
                name,
                account_id,
                amount: Number(amount || 0),
                stage: stage || 'prospecting',
                probability: Number(probability || 10),
                close_date: close_date ? new Date(close_date) : null,
                owner_id: user.id
            }
        });

        // Log creation activity
        await prisma.activity.create({
            data: {
                type: 'note',
                subject: 'Opportunity Created',
                description: `Opportunity created: ${opportunity.name} ($${opportunity.amount})`,
                opportunity_id: opportunity.id,
                account_id: account_id,
                user_id: user.id,
                completed: true
            }
        });

        return NextResponse.json(opportunity);
    } catch (error) {
        console.error('Create Opportunity Error:', error);
        return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 400 });
    }
}
