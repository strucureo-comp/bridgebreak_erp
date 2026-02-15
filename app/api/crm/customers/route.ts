import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    try {
        const customers = await prisma.customerAccount.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { industry: { contains: search, mode: 'insensitive' } },
                    { website: { contains: search, mode: 'insensitive' } }
                ]
            } : {},
            include: {
                owner: { select: { full_name: true } },
                contacts: {
                    take: 3
                },
                opportunities: {
                    where: { stage: { not: 'closed_lost' } },
                    take: 3
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Customers Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, industry, website, phone, address, primary_contact } = body;

        const customer = await prisma.customerAccount.create({
            data: {
                name,
                industry,
                website,
                phone,
                address,
                owner_id: user.id,
                contacts: primary_contact ? {
                    create: {
                        first_name: primary_contact.first_name,
                        last_name: primary_contact.last_name,
                        email: primary_contact.email,
                        phone: primary_contact.phone,
                        title: primary_contact.title
                    }
                } : undefined
            },
            include: { contacts: true }
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Create Customer Error:', error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 400 });
    }
}
