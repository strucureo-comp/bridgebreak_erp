import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET /api/admin/scm/stock-journal/[id] - Get a single stock journal
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stockJournal = await prisma.stockJournal.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, full_name: true }
        },
        lines: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true } }
              }
            }
          }
        },
        gl_entries: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true }
            }
          }
        }
      }
    });

    if (!stockJournal) {
      return NextResponse.json(
        { error: 'Stock journal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockJournal);
  } catch (error) {
    console.error('Error fetching stock journal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock journal' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/scm/stock-journal/[id] - Update a stock journal
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, reason, notes, reference, posting_status, lines } = body;

    // Check if stock journal exists and is editable
    const existingSJ = await prisma.stockJournal.findUnique({
      where: { id: params.id },
      include: { gl_entries: true }
    });

    if (!existingSJ) {
      return NextResponse.json(
        { error: 'Stock journal not found' },
        { status: 404 }
      );
    }

    // Prevent editing if posted
    if (existingSJ.posting_status === 'posted' && (lines || posting_status === 'draft')) {
      return NextResponse.json(
        { error: 'Cannot modify a posted stock journal. Void it instead.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (reference !== undefined) updateData.reference = reference;
    if (posting_status) updateData.posting_status = posting_status;

    // Recalculate totals if lines are provided
    if (lines && lines.length > 0) {
      const totalValue = lines.reduce(
        (sum: number, line: any) => sum + Number(line.total_cost || 0),
        0
      );
      updateData.total_value = totalValue;

      // Delete existing lines and create new ones
      await prisma.stockJournalLine.deleteMany({
        where: { stock_journal_id: params.id }
      });

      updateData.lines = {
        create: lines.map((line: any, index: number) => ({
          variant_id: line.variant_id,
          from_location_id: line.from_location_id,
          to_location_id: line.to_location_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost || 0,
          total_cost: line.total_cost || (line.quantity * (line.unit_cost || 0)),
          lot_number: line.lot_number,
          expiry_date: line.expiry_date ? new Date(line.expiry_date) : null,
          notes: line.notes,
          sort_order: index
        }))
      };
    }

    const stockJournal = await prisma.stockJournal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, full_name: true }
        },
        lines: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true } }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(stockJournal);
  } catch (error) {
    console.error('Error updating stock journal:', error);
    return NextResponse.json(
      { error: 'Failed to update stock journal' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scm/stock-journal/[id] - Delete a stock journal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if stock journal exists and can be deleted
    const existingSJ = await prisma.stockJournal.findUnique({
      where: { id: params.id },
      include: { gl_entries: true }
    });

    if (!existingSJ) {
      return NextResponse.json(
        { error: 'Stock journal not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if posted
    if (existingSJ.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Cannot delete a posted stock journal. Void it instead.' },
        { status: 400 }
      );
    }

    await prisma.stockJournal.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock journal:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock journal' },
      { status: 500 }
    );
  }
}
