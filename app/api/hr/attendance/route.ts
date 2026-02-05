import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const attendance = await prisma.attendance.findMany({
      where: date ? { date: new Date(date).toISOString() } : undefined,
      include: { employee: true, project: { select: { title: true } } },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const attendance = await prisma.attendance.upsert({
      where: {
        employee_id_date: {
          employee_id: body.employee_id,
          date: new Date(body.date).toISOString()
        }
      },
      update: {
        status: body.status,
        overtime_hours: parseFloat(body.overtime_hours || 0),
        project_id: body.project_id || null,
        check_in: body.check_in ? new Date(body.check_in) : null,
        check_out: body.check_out ? new Date(body.check_out) : null,
      },
      create: {
        employee_id: body.employee_id,
        date: new Date(body.date).toISOString(),
        status: body.status,
        overtime_hours: parseFloat(body.overtime_hours || 0),
        project_id: body.project_id || null,
        check_in: body.check_in ? new Date(body.check_in) : null,
        check_out: body.check_out ? new Date(body.check_out) : null,
      }
    });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
