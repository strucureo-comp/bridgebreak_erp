import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/finance/general-ledger
 * Fetch all GL entries from all modules (transactions, invoices, payroll, etc)
 * Unified accounting view across the entire system
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');

    // Build date filter
    const dateFilter = startDate && endDate ? {
      created_at: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // 1. TRANSACTIONS (Direct GL entries)
    const transactions = await prisma.transaction.findMany({
      where: {
        ...dateFilter
      },
      include: {
        creator: { select: { full_name: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });

    // 2. INVOICES (Customer Revenue)
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
        ...dateFilter
      },
      include: {
        project: { select: { id: true, title: true } },
        client: { select: { full_name: true, email: true } },
        payments: true
      }
    });

    // 3. PAYMENTS (Customer Payments)
    const payments = await prisma.payment.findMany({
      where: dateFilter,
      include: {
        invoice: { select: { project_id: true, invoice_number: true } }
      }
    });

    // 4. VENDOR BILLS & PAYMENTS (Accounts Payable)
    const vendorBills = await prisma.vendorBill.findMany({
      where: {
        ...(projectId ? { purchase_order: { purchase_request: { project_id: projectId } } } : {}),
        ...dateFilter
      },
      include: {
        vendor: { select: { name: true } },
        vendor_payments: true
      }
    });

    // 5. PAYROLL (Labour Expenses)
    const payrolls = await prisma.payroll.findMany({
      where: dateFilter,
      include: {
        lines: {
          include: {
            employee: { select: { name: true, employee_id: true } }
          }
        }
      }
    });

    // 6. INVENTORY TRANSACTIONS (Cost of Goods)
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
        ...dateFilter
      },
      include: {
        item: { select: { name: true, cost_price: true } },
        project: { select: { title: true } }
      }
    });

    // 7. BANK TRANSACTIONS (Cash Flow)
    const bankTransactions = await prisma.bankTransaction.findMany({
      where: dateFilter,
      include: {
        bank_account: { select: { name: true, currency: true } }
      }
    });

    // Unified GL format
    const glEntries = [
      // Customer Revenue
      ...invoices.map(inv => ({
        id: inv.id,
        type: 'invoice',
        account: 'AR - Accounts Receivable',
        debit: inv.amount,
        credit: 0,
        date: inv.created_at,
        description: `Invoice ${inv.invoice_number} - ${inv.project?.title}`,
        reference: inv.invoice_number,
        entity: inv.project?.title,
        status: inv.status
      })),
      
      // Customer Payments
      ...payments.map(pay => ({
        id: pay.id,
        type: 'payment',
        account: 'Cash/Bank',
        debit: 0,
        credit: pay.amount,
        date: pay.payment_date,
        description: `Payment - ${pay.invoice.invoice_number}`,
        reference: pay.id,
        entity: pay.invoice.project_id
      })),

      // Vendor Expenses
      ...vendorBills.map(bill => ({
        id: bill.id,
        type: 'vendor_bill',
        account: 'AP - Accounts Payable',
        debit: bill.amount,
        credit: 0,
        date: bill.created_at,
        description: `Vendor Bill - ${bill.vendor.name}`,
        reference: bill.bill_number,
        entity: bill.vendor.name,
        status: bill.status
      })),

      // Vendor Payments
      ...vendorBills.flatMap(bill =>
        bill.vendor_payments.map(vp => ({
          id: vp.id,
          type: 'vendor_payment',
          account: 'Cash/Bank',
          debit: vp.amount,
          credit: 0,
          date: vp.payment_date,
          description: `Payment to ${bill.vendor.name}`,
          reference: bill.bill_number,
          entity: bill.vendor.name
        }))
      ),

      // Payroll Expenses
      ...payrolls.flatMap(payroll =>
        payroll.lines.map(line => ({
          id: line.id,
          type: 'payroll',
          account: 'Salary Expense',
          debit: line.total_pay,
          credit: 0,
          date: new Date(payroll.month),
          description: `Salary - ${line.employee.name}`,
          reference: payroll.month,
          entity: line.employee.employee_id
        }))
      ),

      // Inventory Costs
      ...inventoryTransactions.map(inv => ({
        id: inv.id,
        type: 'inventory',
        account: inv.type === 'issue_to_project' ? 'COGS' : 'Inventory',
        debit: inv.type === 'issue_to_project' ? Number(inv.item.cost_price || 0) * Number(inv.quantity || 0) : 0,
        credit: inv.type === 'stock_in' ? Number(inv.item.cost_price || 0) * Number(inv.quantity || 0) : 0,
        date: inv.date,
        description: `${inv.type} - ${inv.item.name}`,
        reference: inv.reference_no,
        entity: inv.project?.title || 'Stock'
      })),

      // Transactions (Direct GL entries)
      ...transactions.map(txn => ({
        id: txn.id,
        type: txn.type,
        account: `${txn.category}`,
        debit: txn.type === 'income' ? txn.amount : 0,
        credit: txn.type === 'expense' ? txn.amount : 0,
        date: txn.date,
        description: txn.description || txn.category,
        reference: txn.reference_number,
        entity: txn.category
      })),

      // Bank Transactions
      ...bankTransactions.map(bt => ({
        id: bt.id,
        type: 'bank_transaction',
        account: `Bank - ${bt.bank_account.name}`,
        debit: bt.type === 'deposit' ? Number(bt.amount) : 0,
        credit: bt.type === 'withdrawal' ? Number(bt.amount) : 0,
        date: bt.date,
        description: bt.description,
        reference: bt.reference,
        entity: bt.bank_account.name
      }))
    ];

    // Sort by date
    glEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals
    const totalDebits = glEntries.reduce((sum, entry) => sum + Number(entry.debit), 0);
    const totalCredits = glEntries.reduce((sum, entry) => sum + Number(entry.credit), 0);

    return NextResponse.json({
      entries: glEntries,
      summary: {
        totalDebits,
        totalCredits,
        balance: totalDebits - totalCredits,
        entryCount: glEntries.length
      }
    });
  } catch (error) {
    console.error('GL Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/finance/general-ledger/post-entries
 * Auto-post entries from all modules to create GL entries
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, entityId, amount, description } = body;

    // Create transaction entry
    const transaction = await prisma.transaction.create({
      data: {
        type: amount > 0 ? 'income' : 'expense',
        category: type || 'other',
        amount: Math.abs(amount),
        date: new Date(),
        description,
        created_by: user.id
      }
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      message: 'GL entry posted successfully'
    });
  } catch (error) {
    console.error('Post error:', error);
    return NextResponse.json({ error: 'Failed to post entry' }, { status: 400 });
  }
}
