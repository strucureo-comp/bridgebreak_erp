import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');

    try {
        const documents = await prisma.employeeDocument.findMany({
            where: employeeId ? { employee_id: employeeId } : undefined,
            orderBy: { created_at: 'desc' },
        });
        return NextResponse.json(documents);
    } catch (error) {
        console.error('Documents GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const doc = await prisma.employeeDocument.create({
            data: {
                employee_id: body.employee_id,
                name: body.name,
                doc_type: body.doc_type,
                file_url: body.file_url || null,
                file_name: body.file_name || null,
                expiry_date: body.expiry_date ? new Date(body.expiry_date).toISOString() : null,
                notes: body.notes || null,
            }
        });
        return NextResponse.json(doc);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
