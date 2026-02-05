import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const requests = await prisma.purchaseRequest.findMany({
      orderBy: { created_at: 'desc' },
      include: { project: true, requester: true }
    });
    
    const serializedRequests = requests.map(pr => ({
      ...pr,
      estimated_cost: pr.estimated_cost ? Number(pr.estimated_cost) : null
    }));

    return NextResponse.json(serializedRequests);
  } catch (error) {
    console.error('Purchase Requests GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const pr = await prisma.purchaseRequest.create({
      data: {
        item_name: body.item_name,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        estimated_cost: body.estimated_cost ? parseFloat(body.estimated_cost) : null,
        priority: body.priority || 'medium',
        project_id: body.project_id === 'none' ? null : body.project_id,
        needed_by: body.needed_by ? new Date(body.needed_by) : null,
        notes: body.notes,
        requested_by: user.id
      }
    });
    return NextResponse.json({
      ...pr,
      estimated_cost: pr.estimated_cost ? Number(pr.estimated_cost) : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
