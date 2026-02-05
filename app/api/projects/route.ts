import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return await prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let where: any = {};

    if (user.role === 'client') {
      where.client_id = user.id;
    } else if (user.role === 'admin') {
        if (clientId) where.client_id = clientId;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        client: {
          select: { full_name: true, email: true, avatar_url: true }
        }
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate basics
    if (!body.title || !body.description) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Default to current user as client if not specified (or if not admin)
    const clientId = (user.role === 'admin' && body.client_id) ? body.client_id : user.id;

    const project = await prisma.project.create({
      data: {
        title: body.title,
        description: body.description,
        client_id: clientId,
        status: 'pending',
        // Add other fields as needed
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Projects POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
