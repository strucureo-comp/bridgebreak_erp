import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  let where: any = {};
  if (user.role === 'client') {
    where.client_id = user.id;
  } else if (clientId) {
    where.client_id = clientId;
  }

  try {
    const meetings = await prisma.meetingRequest.findMany({
      where,
      orderBy: { requested_date: 'desc' },
      include: {
        client: { select: { full_name: true, email: true } }
      }
    });
    return NextResponse.json(meetings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const meeting = await prisma.meetingRequest.create({
      data: {
        ...body,
        client_id: user.role === 'client' ? user.id : body.client_id,
        // Ensure date is ISO string
        requested_date: new Date(body.requested_date).toISOString(),
      }
    });
    return NextResponse.json(meeting);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
