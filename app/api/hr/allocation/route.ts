import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const allocations = await prisma.labourAllocation.findMany({
      include: { employee: true, project: { select: { title: true } } },
      where: { status: 'active' }
    });
    return NextResponse.json(allocations);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const allocation = await prisma.labourAllocation.create({
      data: {
        employee_id: body.employee_id,
        project_id: body.project_id,
        start_date: new Date(body.start_date).toISOString(),
        status: 'active'
      }
    });
    return NextResponse.json(allocation);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
