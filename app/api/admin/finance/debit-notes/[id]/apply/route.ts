import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// POST /api/admin/finance/debit-notes/[id]/apply - Apply debit note to a vendor bill
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
    const { vendor_bill_id, amount } = body;

    if (!vendor_bill_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor_bill_id, amount' },
        { status: 400 }
      );
    }

    // Get debit note
    const debitNote = await prisma.debitNote.findUnique({
      where: { id: params.id },
      include: {
        applications: true
      }
    });

    if (!debitNote) {
      return NextResponse.json(
        { error: 'Debit note not found' },
        { status: 404 }
      );
    }

    if (debitNote.posting_status !== 'posted') {
      return NextResponse.json(
        { error: 'Debit note must be posted before applying' },
        { status: 400 }
      );
    }

    // Calculate remaining balance
    const appliedAmount = debitNote.applications?.reduce(
      (sum, app) => sum + Number(app.amount),
      0
    ) || 0;
    const remainingAmount = Number(debitNote.total_amount) - appliedAmount;

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Cannot apply more than remaining balance: ${remainingAmount}` },
        { status: 400 }
      );
    }

    // Get vendor bill
    const vendorBill = await prisma.vendorBill.findUnique({
      where: { id: vendor_bill_id },
      include: {
        vendor_payments: true,
        debit_note_applications: true
      }
    });

    if (!vendorBill) {
      return NextResponse.json(
        { error: 'Vendor bill not found' },
        { status: 404 }
      );
    }

    // Verify vendor matches
    if (vendorBill.vendor_id !== debitNote.vendor_id) {
      return NextResponse.json(
        { error: 'Debit note and bill must belong to the same vendor' },
        { status: 400 }
      );
    }

    // Calculate bill balance
    const billPayments = vendorBill.vendor_payments?.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) || 0;
    const billDebits = vendorBill.debit_note_applications?.reduce(
      (sum, dna) => sum + Number(dna.amount),
      0
    ) || 0;
    const billBalance = Number(vendorBill.total_amount) - billPayments - billDebits;

    if (amount > billBalance) {
      return NextResponse.json(
        { error: `Cannot apply more than bill balance: ${billBalance}` },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.debitNoteApplication.create({
      data: {
        debit_note_id: params.id,
        vendor_bill_id,
        amount,
        date: new Date()
      },
      include: {
        vendor_bill: {
          select: { id: true, bill_number: true, total_amount: true }
        }
      }
    });

    // Update debit note status
    const newAppliedAmount = appliedAmount + amount;
    if (newAppliedAmount >= Number(debitNote.total_amount)) {
      await prisma.debitNote.update({
        where: { id: params.id },
        data: { status: 'applied' }
      });
    } else if (debitNote.status === 'posted') {
      await prisma.debitNote.update({
        where: { id: params.id },
        data: { status: 'applied' }
      });
    }

    // Update vendor bill status if fully paid
    const newBillBalance = billBalance - amount;
    if (newBillBalance <= 0) {
      await prisma.vendorBill.update({
        where: { id: vendor_bill_id },
        data: { status: 'paid' }
      });
    }

    return NextResponse.json({
      success: true,
      application,
      debit_note_remaining: remainingAmount - amount,
      bill_balance: newBillBalance
    });
  } catch (error) {
    console.error('Error applying debit note:', error);
    return NextResponse.json(
      { error: 'Failed to apply debit note' },
      { status: 500 }
    );
  }
}
