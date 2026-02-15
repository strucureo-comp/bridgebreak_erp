import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET /api/admin/finance/credit-notes/[id] - Get a single credit note
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { id: true, name: true, tax_id: true, address: true }
        },
        invoice: {
          select: { id: true, invoice_number: true, total_amount: true, amount: true }
        },
        lines: true,
        applications: {
          include: {
            invoice: {
              select: { id: true, invoice_number: true }
            }
          }
        }
      }
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      );
    }

    // Calculate remaining balance
    const appliedAmount = creditNote.applications?.reduce(
      (sum, app) => sum + Number(app.amount),
      0
    ) || 0;

    return NextResponse.json({
      ...creditNote,
      remaining_amount: Number(creditNote.total_amount) - appliedAmount,
      applied_amount: appliedAmount
    });
  } catch (error) {
    console.error('Error fetching credit note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit note' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/finance/credit-notes/[id] - Update a credit note
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

    // Check if credit note exists and is editable
    const existingCN = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: { applications: true }
    });

    if (!existingCN) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      );
    }

    // Prevent editing if already applied
    if (existingCN.applications.length > 0 && (lines || posting_status === 'draft')) {
      return NextResponse.json(
        { error: 'Cannot modify credit note that has been applied to invoices' },
        { status: 400 }
      );
    }

    // Prevent editing if posted and trying to change amounts
    if (existingCN.posting_status === 'posted' && lines) {
      return NextResponse.json(
        { error: 'Cannot modify lines of a posted credit note' },
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
      await prisma.creditNoteLine.deleteMany({
        where: { credit_note_id: params.id }
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

    const creditNote = await prisma.creditNote.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(creditNote);
  } catch (error) {
    console.error('Error updating credit note:', error);
    return NextResponse.json(
      { error: 'Failed to update credit note' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/finance/credit-notes/[id] - Delete a credit note
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if credit note exists and can be deleted
    const existingCN = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: { applications: true }
    });

    if (!existingCN) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if posted
    if (existingCN.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Cannot delete a posted credit note. Void it instead.' },
        { status: 400 }
      );
    }

    // Prevent deletion if applied
    if (existingCN.applications.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete credit note that has been applied to invoices' },
        { status: 400 }
      );
    }

    await prisma.creditNote.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credit note:', error);
    return NextResponse.json(
      { error: 'Failed to delete credit note' },
      { status: 500 }
    );
  }
}
