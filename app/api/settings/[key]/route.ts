import { NextResponse } from 'next/server';
import { Prisma } from '@/prisma/generated/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { key: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: params.key }
    });
    return NextResponse.json(setting ? setting.value : null);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json(null);
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { key: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const setting = await prisma.systemSettings.upsert({
      where: { key: params.key },
      update: { value: body },
      create: { key: params.key, value: body }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json({ success: false, error: 'Settings table missing' });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
