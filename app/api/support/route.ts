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
    const requests = await prisma.supportRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        client: { select: { full_name: true, email: true } }
      }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const supportRequest = await prisma.supportRequest.create({
      data: {
        ...body,
        client_id: user.role === 'client' ? user.id : body.client_id, // Admin can specify client_id? Usually client creates.
      }
    });
    return NextResponse.json(supportRequest);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
