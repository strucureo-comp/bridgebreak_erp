import { getServerSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workflows = await prisma.approvalWorkflow.findMany({
            orderBy: { min_amount: 'asc' }
        });

        return NextResponse.json(workflows);
    } catch (error) {
        console.error('GET /api/admin/finance/approvals/config ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { entity_type, min_amount, approver_role, approver_id } = body;

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                entity_type,
                min_amount,
                approver_role,
                approver_id
            }
        });

        return NextResponse.json(workflow);

    } catch (error) {
        console.error('POST /api/admin/finance/approvals/config ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
