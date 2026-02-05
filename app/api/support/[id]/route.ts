import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const request = await prisma.supportRequest.findUnique({
      where: { id: params.id }
    });

    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin' && request.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(request);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const requestItem = await prisma.supportRequest.findUnique({ where: { id: params.id } });

    if (!requestItem) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin' && requestItem.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.supportRequest.update({
      where: { id: params.id },
      data: body
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
