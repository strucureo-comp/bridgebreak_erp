import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateAccountBalance, GL_ACCOUNTS } from '@/lib/finance/accounts';

// POST /api/admin/finance/credit-notes/[id]/post - Post credit note to GL
export async function POST(
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
        customer: true,
        lines: true
      }
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      );
    }

    if (creditNote.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Credit note is already posted' },
        { status: 400 }
      );
    }

    // Get required GL accounts
    const [arAccount, revenueAccount, taxAccount] = await Promise.all([
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.ACCOUNTS_RECEIVABLE } }),
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.SALES_REVENUE } }),
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.TAX_PAYABLE } })
    ]);

    if (!arAccount || !revenueAccount) {
      return NextResponse.json(
        { error: 'Required GL accounts not found. Please set up accounts receivable and revenue accounts.' },
        { status: 400 }
      );
    }

    // Create journal entry for credit note
    // Credit Note = Reduce AR (debit) and Reduce Revenue (credit)
    // Plus reverse tax if applicable
    await prisma.$transaction(async (tx) => {
      // Update credit note status
      await tx.creditNote.update({
        where: { id: params.id },
        data: { posting_status: 'posted', status: 'posted' }
      });

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          date: creditNote.date,
          description: `Credit Note ${creditNote.number} - ${creditNote.reason || 'Customer credit'}`,
          reference: creditNote.number,
          status: 'posted',
          created_by: user.id,
          lines: {
            create: [
              // Debit AR (reduce receivable)
              {
                account_id: arAccount.id,
                debit: 0,
                credit: creditNote.total_amount,
                description: `Credit Note ${creditNote.number}`
              },
              // Credit Revenue (reduce revenue)
              {
                account_id: revenueAccount.id,
                debit: creditNote.amount,
                credit: 0,
                description: `Credit Note ${creditNote.number} - Revenue reversal`
              }
            ]
          }
        }
      });

      // Add tax reversal line if applicable
      if (creditNote.tax_amount && Number(creditNote.tax_amount) > 0 && taxAccount) {
        await tx.journalLine.create({
          data: {
            journal_entry_id: journalEntry.id,
            account_id: taxAccount.id,
            debit: creditNote.tax_amount,
            credit: 0,
            description: `Credit Note ${creditNote.number} - Tax reversal`
          }
        });
      }

      // Update account balances
      await updateAccountBalance(arAccount.id);
      await updateAccountBalance(revenueAccount.id);
      if (taxAccount && creditNote.tax_amount && Number(creditNote.tax_amount) > 0) {
        await updateAccountBalance(taxAccount.id);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Credit note posted successfully',
      creditNote: await prisma.creditNote.findUnique({
        where: { id: params.id },
        include: {
          customer: { select: { id: true, name: true } },
          lines: true
        }
      })
    });
  } catch (error) {
    console.error('Error posting credit note:', error);
    return NextResponse.json(
      { error: 'Failed to post credit note' },
      { status: 500 }
    );
  }
}
