import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateAccountNumber } from '@/lib/finance/accounts';

// GET /api/admin/finance/credit-notes - List all credit notes
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const postingStatus = searchParams.get('posting_status');

    const where: any = {};
    if (customerId) where.customer_id = customerId;
    if (status) where.status = status;
    if (postingStatus) where.posting_status = postingStatus;

    const creditNotes = await prisma.creditNote.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, tax_id: true }
        },
        invoice: {
          select: { id: true, invoice_number: true, total_amount: true }
        },
        lines: true,
        applications: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate remaining balance for each credit note
    const creditNotesWithBalance = creditNotes.map(cn => {
      const anyCn = cn as any;
      const appliedAmount = anyCn.applications?.reduce((sum: number, app: any) => sum + Number(app.amount), 0) || 0;
      return {
        ...cn,
        remaining_amount: Number(cn.total_amount) - appliedAmount,
        applied_amount: appliedAmount
      };
    });

    return NextResponse.json(creditNotesWithBalance);
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit notes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/finance/credit-notes - Create a new credit note
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customer_id,
      invoice_id,
      date,
      reason,
      notes,
      currency = 'USD',
      lines
    } = body;

    // Validate required fields
    if (!customer_id || !date || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, date, lines' },
        { status: 400 }
      );
    }

    // Generate credit note number
    const number = await generateAccountNumber('CN', 'credit_note');

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

    // Create credit note with lines in a transaction
    const creditNote = await prisma.$transaction(async (tx) => {
      const cn = await tx.creditNote.create({
        data: {
          number,
          customer_id,
          invoice_id,
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
          customer: {
            select: { id: true, name: true, tax_id: true }
          },
          invoice: {
            select: { id: true, invoice_number: true }
          },
          lines: true
        }
      });

      return cn;
    });

    return NextResponse.json(creditNote, { status: 201 });
  } catch (error) {
    console.error('Error creating credit note:', error);
    return NextResponse.json(
      { error: 'Failed to create credit note' },
      { status: 500 }
    );
  }
}
