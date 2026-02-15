import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateAccountBalance, GL_ACCOUNTS } from '@/lib/finance/accounts';

// POST /api/admin/finance/debit-notes/[id]/post - Post debit note to GL
export async function POST(
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
        vendor: true,
        lines: true
      }
    });

    if (!debitNote) {
      return NextResponse.json(
        { error: 'Debit note not found' },
        { status: 404 }
      );
    }

    if (debitNote.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Debit note is already posted' },
        { status: 400 }
      );
    }

    // Get required GL accounts
    const [apAccount, expenseAccount, taxAccount] = await Promise.all([
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.ACCOUNTS_PAYABLE } }),
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.COGS } }), // Using COGS as default expense
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.TAX_PAYABLE } })
    ]);

    if (!apAccount) {
      return NextResponse.json(
        { error: 'Required GL account not found: Accounts Payable' },
        { status: 400 }
      );
    }

    // Create journal entry for debit note
    // Debit Note = Reduce AP (debit) and Reduce Expense (credit)
    await prisma.$transaction(async (tx) => {
      // Update debit note status
      await tx.debitNote.update({
        where: { id: params.id },
        data: { posting_status: 'posted', status: 'posted' }
      });

      // Create journal entry lines
      const journalLines: any[] = [
        // Debit AP (reduce payable)
        {
          account_id: apAccount.id,
          debit: debitNote.total_amount,
          credit: 0,
          description: `Debit Note ${debitNote.number}`
        }
      ];

      // Credit Expense (reduce expense) - use specific expense account if available
      if (expenseAccount) {
        journalLines.push({
          account_id: expenseAccount.id,
          debit: 0,
          credit: debitNote.amount,
          description: `Debit Note ${debitNote.number} - Expense reversal`
        });
      }

      // Add tax reversal line if applicable
      if (debitNote.tax_amount && Number(debitNote.tax_amount) > 0 && taxAccount) {
        journalLines.push({
          account_id: taxAccount.id,
          debit: 0,
          credit: debitNote.tax_amount,
          description: `Debit Note ${debitNote.number} - Tax reversal`
        });
      }

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          date: debitNote.date,
          description: `Debit Note ${debitNote.number} - ${debitNote.reason || 'Vendor credit'}`,
          reference: debitNote.number,
          status: 'posted',
          created_by: user.id,
          lines: {
            create: journalLines
          }
        }
      });

      // Update account balances
      await updateAccountBalance(apAccount.id);
      if (expenseAccount) await updateAccountBalance(expenseAccount.id);
      if (taxAccount && debitNote.tax_amount && Number(debitNote.tax_amount) > 0) {
        await updateAccountBalance(taxAccount.id);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Debit note posted successfully',
      debitNote: await prisma.debitNote.findUnique({
        where: { id: params.id },
        include: {
          vendor: { select: { id: true, name: true } },
          lines: true
        }
      })
    });
  } catch (error) {
    console.error('Error posting debit note:', error);
    return NextResponse.json(
      { error: 'Failed to post debit note' },
      { status: 500 }
    );
  }
}
