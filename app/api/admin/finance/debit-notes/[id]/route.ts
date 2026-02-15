import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET /api/admin/finance/debit-notes/[id] - Get a single debit note
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const debitNote = await prisma.debitNote.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: { id: true, name: true, tax_id: true, address: true }
        },
        vendor_bill: {
          select: { id: true, bill_number: true, total_amount: true, amount: true }
        },
        lines: true,
        applications: {
          include: {
            vendor_bill: {
              select: { id: true, bill_number: true }
            }
          }
        }
      }
    });

    if (!debitNote) {
      return NextResponse.json(
        { error: 'Debit note not found' },
        { status: 404 }
      );
    }

    // Calculate remaining balance
    const appliedAmount = debitNote.applications?.reduce(
      (sum, app) => sum + Number(app.amount),
      0
    ) || 0;

    return NextResponse.json({
      ...debitNote,
      remaining_amount: Number(debitNote.total_amount) - appliedAmount,
      applied_amount: appliedAmount
    });
  } catch (error) {
    console.error('Error fetching debit note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debit note' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/finance/debit-notes/[id] - Update a debit note
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
    const { date, reason, notes, status, posting_status, lines } = body;

    // Check if debit note exists and is editable
    const existingDN = await prisma.debitNote.findUnique({
      where: { id: params.id },
      include: { applications: true }
    });

    if (!existingDN) {
      return NextResponse.json(
        { error: 'Debit note not found' },
        { status: 404 }
      );
    }

    // Prevent editing if already applied
    if (existingDN.applications.length > 0 && (lines || posting_status === 'draft')) {
      return NextResponse.json(
        { error: 'Cannot modify debit note that has been applied to bills' },
        { status: 400 }
      );
    }

    // Prevent editing if posted and trying to change amounts
    if (existingDN.posting_status === 'posted' && lines) {
      return NextResponse.json(
        { error: 'Cannot modify lines of a posted debit note' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (posting_status) updateData.posting_status = posting_status;

    // Recalculate totals if lines are provided
    if (lines && lines.length > 0) {
      const amount = lines.reduce(
        (sum: number, line: any) => sum + Number(line.quantity) * Number(line.unit_price),
        0
      );
      const taxAmount = lines.reduce(
        (sum: number, line: any) => sum + Number(line.tax_amount || 0),
        0
      );
      updateData.amount = amount;
      updateData.tax_amount = taxAmount;
      updateData.total_amount = amount + taxAmount;

      // Delete existing lines and create new ones
      await prisma.debitNoteLine.deleteMany({
        where: { debit_note_id: params.id }
      });

      updateData.lines = {
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
      };
    }

    const debitNote = await prisma.debitNote.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(debitNote);
  } catch (error) {
    console.error('Error updating debit note:', error);
    return NextResponse.json(
      { error: 'Failed to update debit note' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/finance/debit-notes/[id] - Delete a debit note
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if debit note exists and can be deleted
    const existingDN = await prisma.debitNote.findUnique({
      where: { id: params.id },
      include: { applications: true }
    });

    if (!existingDN) {
      return NextResponse.json(
        { error: 'Debit note not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if posted
    if (existingDN.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Cannot delete a posted debit note. Void it instead.' },
        { status: 400 }
      );
    }

    // Prevent deletion if applied
    if (existingDN.applications.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete debit note that has been applied to bills' },
        { status: 400 }
      );
    }

    await prisma.debitNote.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debit note:', error);
    return NextResponse.json(
      { error: 'Failed to delete debit note' },
      { status: 500 }
    );
  }
}
