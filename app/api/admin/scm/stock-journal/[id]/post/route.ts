import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { updateAccountBalance, GL_ACCOUNTS } from '@/lib/finance/accounts';

// POST /api/admin/scm/stock-journal/[id]/post - Post stock journal to GL
export async function POST(
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
        lines: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } }
              }
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

    if (stockJournal.posting_status === 'posted') {
      return NextResponse.json(
        { error: 'Stock journal is already posted' },
        { status: 400 }
      );
    }

    // Get required GL accounts based on journal type
    const [inventoryAccount, cogsAccount, adjustmentAccount] = await Promise.all([
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.INVENTORY } }),
      prisma.account.findFirst({ where: { code: GL_ACCOUNTS.COGS } }),
      prisma.account.findFirst({ where: { name: { contains: 'Adjustment', mode: 'insensitive' } } })
    ]);

    if (!inventoryAccount) {
      return NextResponse.json(
        { error: 'Required GL account not found: Inventory' },
        { status: 400 }
      );
    }

    // Determine accounts based on stock journal type
    let debitAccount = inventoryAccount;
    let creditAccount = adjustmentAccount || cogsAccount || inventoryAccount;

    switch (stockJournal.type) {
      case 'adjustment':
      case 'count':
        // Positive adjustment: Debit Inventory, Credit Adjustment
        // Negative adjustment: Credit Inventory, Debit Adjustment
        break;
      case 'damage':
      case 'obsolete':
        // Loss: Credit Inventory, Debit Loss/Expense
        creditAccount = cogsAccount || inventoryAccount;
        break;
      case 'transfer':
        // Transfers don't usually need GL entries (internal movement)
        break;
      case 'revaluation':
        // Revaluation: Adjust inventory value
        break;
    }

    // Create GL entries
    await prisma.$transaction(async (tx) => {
      // Update stock journal status
      await tx.stockJournal.update({
        where: { id: params.id },
        data: { posting_status: 'posted' }
      });

      const glEntries = [];

      // Create GL entry for each line
      for (const line of stockJournal.lines) {
        const lineValue = Number(line.total_cost);
        const isPositive = Number(line.quantity) > 0;

        if (stockJournal.type === 'transfer') {
          // Skip GL entries for transfers (no value change)
          continue;
        }

        if (isPositive) {
          // Increase inventory
          glEntries.push({
            stock_journal_id: params.id,
            account_id: debitAccount.id,
            debit: lineValue,
            credit: 0,
            description: `Stock Journal ${stockJournal.number} - ${line.variant?.product?.name || line.variant_id}`
          });
          glEntries.push({
            stock_journal_id: params.id,
            account_id: creditAccount.id,
            debit: 0,
            credit: lineValue,
            description: `Stock Journal ${stockJournal.number} - ${line.variant?.product?.name || line.variant_id}`
          });
        } else {
          // Decrease inventory
          glEntries.push({
            stock_journal_id: params.id,
            account_id: creditAccount.id,
            debit: Math.abs(lineValue),
            credit: 0,
            description: `Stock Journal ${stockJournal.number} - ${line.variant?.product?.name || line.variant_id} (decrease)`
          });
          glEntries.push({
            stock_journal_id: params.id,
            account_id: debitAccount.id,
            debit: 0,
            credit: Math.abs(lineValue),
            description: `Stock Journal ${stockJournal.number} - ${line.variant?.product?.name || line.variant_id} (decrease)`
          });
        }
      }

      // Create GL entries
      if (glEntries.length > 0) {
        await tx.stockJournalGLEntry.createMany({
          data: glEntries
        });
      }

      // Update inventory quantities
      for (const line of stockJournal.lines) {
        if (line.to_location_id) {
          // Handle increase at destination
          const existingItem = await tx.inventoryItem.findUnique({
            where: {
              variant_id_location_id: {
                variant_id: line.variant_id,
                location_id: line.to_location_id
              }
            }
          });

          if (existingItem) {
            await tx.inventoryItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: {
                  increment: Math.abs(Number(line.quantity))
                }
              }
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                variant_id: line.variant_id,
                location_id: line.to_location_id,
                quantity: Math.abs(Number(line.quantity))
              }
            });
          }
        }

        if (line.from_location_id) {
          // Handle decrease at source
          const existingItem = await tx.inventoryItem.findUnique({
            where: {
              variant_id_location_id: {
                variant_id: line.variant_id,
                location_id: line.from_location_id
              }
            }
          });

          if (existingItem) {
            await tx.inventoryItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: {
                  decrement: Math.abs(Number(line.quantity))
                }
              }
            });
          }
        }
      }

      // Update account balances
      await updateAccountBalance(inventoryAccount.id);
      if (creditAccount && creditAccount.id !== inventoryAccount.id) {
        await updateAccountBalance(creditAccount.id);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Stock journal posted successfully',
      stockJournal: await prisma.stockJournal.findUnique({
        where: { id: params.id },
        include: {
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
                select: { id: true, code: true, name: true }
              }
            }
          }
        }
      })
    });
  } catch (error) {
    console.error('Error posting stock journal:', error);
    return NextResponse.json(
      { error: 'Failed to post stock journal' },
      { status: 500 }
    );
  }
}
