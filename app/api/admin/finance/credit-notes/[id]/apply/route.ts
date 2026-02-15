import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// POST /api/admin/finance/credit-notes/[id]/apply - Apply credit note to an invoice
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoice_id, amount } = body;

    if (!invoice_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields: invoice_id, amount' },
        { status: 400 }
      );
    }

    // Get credit note
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: {
        applications: true
      }
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      );
    }

    if (creditNote.posting_status !== 'posted') {
      return NextResponse.json(
        { error: 'Credit note must be posted before applying' },
        { status: 400 }
      );
    }

    // Calculate remaining balance
    const appliedAmount = creditNote.applications?.reduce(
      (sum, app) => sum + Number(app.amount),
      0
    ) || 0;
    const remainingAmount = Number(creditNote.total_amount) - appliedAmount;

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Cannot apply more than remaining balance: ${remainingAmount}` },
        { status: 400 }
      );
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoice_id },
      include: {
        payments: true,
        credit_note_applications: true
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Calculate invoice balance
    const invoicePayments = invoice.payments?.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) || 0;
    const invoiceCredits = invoice.credit_note_applications?.reduce(
      (sum, cna) => sum + Number(cna.amount),
      0
    ) || 0;
    const invoiceBalance = Number(invoice.total_amount) - invoicePayments - invoiceCredits;

    if (amount > invoiceBalance) {
      return NextResponse.json(
        { error: `Cannot apply more than invoice balance: ${invoiceBalance}` },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.creditNoteApplication.create({
      data: {
        credit_note_id: params.id,
        invoice_id,
        amount,
        date: new Date()
      },
      include: {
        invoice: {
          select: { id: true, invoice_number: true, total_amount: true }
        }
      }
    });

    // Update credit note status if fully applied
    const newAppliedAmount = appliedAmount + amount;
    if (newAppliedAmount >= Number(creditNote.total_amount)) {
      await prisma.creditNote.update({
        where: { id: params.id },
        data: { status: 'applied' }
      });
    } else if (creditNote.status === 'posted') {
      await prisma.creditNote.update({
        where: { id: params.id },
        data: { status: 'applied' }
      });
    }

    // Update invoice status if fully paid
    const newInvoiceBalance = invoiceBalance - amount;
    if (newInvoiceBalance <= 0) {
      await prisma.invoice.update({
        where: { id: invoice_id },
        data: { status: 'paid', paid_at: new Date() }
      });
    }

    return NextResponse.json({
      success: true,
      application,
      credit_note_remaining: remainingAmount - amount,
      invoice_balance: newInvoiceBalance
    });
  } catch (error) {
    console.error('Error applying credit note:', error);
    return NextResponse.json(
      { error: 'Failed to apply credit note' },
      { status: 500 }
    );
  }
}
