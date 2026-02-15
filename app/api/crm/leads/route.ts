import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    try {
        const leads = await prisma.lead.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(search ? {
                    OR: [
                        { first_name: { contains: search, mode: 'insensitive' } },
                        { last_name: { contains: search, mode: 'insensitive' } },
                        { company: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                owner: { select: { full_name: true, email: true } },
                activities: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error('Leads Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { first_name, last_name, email, company, phone, title, source } = body;

        const lead = await prisma.lead.create({
            data: {
                first_name,
                last_name,
                email,
                company,
                phone,
                title,
                source,
                status: 'new',
                owner_id: user.id
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'note',
                subject: 'Lead Created',
                description: `Lead created by ${user.full_name}`,
                lead_id: lead.id,
                user_id: user.id,
                completed: true
            }
        });

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Create Lead Error:', error);
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 400 });
    }
}
