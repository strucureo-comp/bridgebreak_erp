import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateAccountNumber } from '@/lib/finance/accounts';

// GET /api/admin/finance/debit-notes - List all debit notes
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status');
    const postingStatus = searchParams.get('posting_status');

    const where: any = {};
    if (vendorId) where.vendor_id = vendorId;
    if (status) where.status = status;
    if (postingStatus) where.posting_status = postingStatus;

    const debitNotes = await prisma.debitNote.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, tax_id: true }
        },
        vendor_bill: {
          select: { id: true, bill_number: true, total_amount: true }
        },
        lines: true,
        applications: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate remaining balance for each debit note
    const debitNotesWithBalance = debitNotes.map(dn => {
      const anyDn = dn as any;
      const appliedAmount = anyDn.applications?.reduce((sum: number, app: any) => sum + Number(app.amount), 0) || 0;
      return {
        ...dn,
        remaining_amount: Number(dn.total_amount) - appliedAmount,
        applied_amount: appliedAmount
      };
    });

    return NextResponse.json(debitNotesWithBalance);
  } catch (error) {
    console.error('Error fetching debit notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debit notes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/finance/debit-notes - Create a new debit note
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      vendor_id,
      vendor_bill_id,
      date,
      reason,
      notes,
      currency = 'USD',
      lines
    } = body;

    // Validate required fields
    if (!vendor_id || !date || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor_id, date, lines' },
        { status: 400 }
      );
    }

    // Generate debit note number
    const number = await generateAccountNumber('DN', 'debit_note');

    // Calculate totals
    const amount = lines.reduce(
      (sum: number, line: any) => sum + Number(line.quantity) * Number(line.unit_price),
      0
    );
    const taxAmount = lines.reduce(
      (sum: number, line: any) => sum + Number(line.tax_amount || 0),
      0
    );
    const totalAmount = amount + taxAmount;

    // Create debit note with lines in a transaction
    const debitNote = await prisma.$transaction(async (tx) => {
      const dn = await tx.debitNote.create({
        data: {
          number,
          vendor_id,
          vendor_bill_id,
          date: new Date(date),
          amount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency,
          reason,
          notes,
          status: 'draft',
          posting_status: 'draft',
          lines: {
            create: lines.map((line: any, index: number) => ({
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              amount: Number(line.quantity) * Number(line.unit_price),
              tax_rate_id: line.tax_rate_id,
              tax_amount: line.tax_amount || 0,
              total_amount:
                Number(line.quantity) * Number(line.unit_price) + Number(line.tax_amount || 0),
              sort_order: index
            }))
          }
        },
        include: {
          vendor: {
            select: { id: true, name: true, tax_id: true }
          },
          vendor_bill: {
            select: { id: true, bill_number: true }
          },
          lines: true
        }
      });

      return dn;
    });

    return NextResponse.json(debitNote, { status: 201 });
  } catch (error) {
    console.error('Error creating debit note:', error);
    return NextResponse.json(
      { error: 'Failed to create debit note' },
      { status: 500 }
    );
  }
}
