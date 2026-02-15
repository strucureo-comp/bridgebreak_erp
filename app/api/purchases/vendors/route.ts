import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const vendor = await prisma.vendor.create({
      data: {
        name: body.name,
        contact_person: body.contact_person,
        email: body.email,
        phone: body.phone,
        address: body.address,
        country_code: body.country_code,
        tax_id: body.tax_id,
        tax_exempt: body.tax_exempt || false
      }
    });
    return NextResponse.json(vendor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
