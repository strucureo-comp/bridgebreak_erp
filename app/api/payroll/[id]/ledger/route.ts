import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/payroll/[id]/ledger-entries
 * Generate GL entries for a payroll record
 * Creates accounting entries for salary expense and bank payment
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payrollId = params.id;

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        lines: {
          include: {
            employee: { select: { name: true, employee_id: true, bank_details: true } }
          }
        }
      }
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Generate GL entries
    const glEntries = [
      // Debit: Salary Expense
      {
        type: 'salary_expense',
        account: '5101 - Salary Expense',
        debit: payroll.total_amount,
        credit: 0,
        description: `Payroll Expense - ${payroll.month}`
      },
      // Credit: Payroll Payable (or direct to bank if paid)
      {
        type: 'salary_payable',
        account: payroll.status === 'paid' ? '1010 - Bank Account' : '2101 - Salary Payable',
        debit: 0,
        credit: payroll.total_amount,
        description: payroll.status === 'paid'
          ? `Payroll Payment - ${payroll.month}`
          : `Payroll Payable - ${payroll.month}`
      }
    ];

    // Per-employee breakdown
    const employeeEntries = payroll.lines.map(line => ({
      employeeId: line.employee.employee_id,
      employeeName: line.employee.name,
      basicPay: line.basic_pay,
      overtimePay: line.overtime_pay,
      deductions: line.deductions,
      totalPay: line.total_pay,
      bankAccount: line.employee.bank_details
    }));

    return NextResponse.json({
      payroll: {
        id: payroll.id,
        month: payroll.month,
        status: payroll.status,
        totalAmount: payroll.total_amount,
        employeeCount: payroll.lines.length
      },
      glEntries,
      employeeBreakdown: employeeEntries,
      readyToPost: payroll.status === 'approved' || payroll.status === 'paid'
    });
  } catch (error) {
    console.error('Ledger error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/payroll/[id]/post-to-ledger
 * Actually create the GL transaction entries in the system
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payrollId = params.id;
    const body = await request.json();
    const { bankAccountId } = body;

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { lines: true }
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Create main transaction entry
    const mainTransaction = await prisma.transaction.create({
      data: {
        type: 'expense',
        category: 'salary_expense',
        amount: payroll.total_amount,
        date: new Date(),
        description: `Payroll - ${payroll.month}`,
        notes: `Payroll ID: ${payrollId}`,
        created_by: user.id
      }
    });

    // If bankAccountId provided, create bank transaction
    let bankTransaction = null;
    if (bankAccountId) {
      bankTransaction = await prisma.bankTransaction.create({
        data: {
          bank_account_id: bankAccountId,
          date: new Date(),
          description: `Payroll Payment - ${payroll.month}`,
          amount: payroll.total_amount,
          type: 'withdrawal',
          system_transaction_id: mainTransaction.id
        }
      });

      // Update payroll status
      await prisma.payroll.update({
        where: { id: payrollId },
        data: { status: 'paid' }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll posted to ledger',
      transaction: {
        id: mainTransaction.id,
        type: 'salary_expense',
        amount: payroll.total_amount
      },
      bankTransaction: bankTransaction ? {
        id: bankTransaction.id,
        bankAccountId
      } : null,
      payrollStatus: bankTransaction ? 'paid' : 'approved'
    });
  } catch (error) {
    console.error('Post to ledger error:', error);
    return NextResponse.json({ error: 'Failed to post to ledger' }, { status: 400 });
  }
}
