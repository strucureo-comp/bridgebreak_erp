import { prisma } from '@/lib/prisma';

/**
 * Generate a unique account/document number with prefix
 * Format: PREFIX-YYYY-NNNN (e.g., CN-2025-0001)
 */
export async function generateAccountNumber(
  prefix: string,
  type: 'credit_note' | 'debit_note' | 'stock_journal' | 'journal' | 'invoice' | 'bill'
): Promise<string> {
  const year = new Date().getFullYear();

  // Get the latest number for this prefix and year
  let latestNumber = 0;

  switch (type) {
    case 'credit_note':
      const latestCN = await prisma.creditNote.findFirst({
        where: {
          number: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { number: 'desc' }
      });
      if (latestCN) {
        const match = latestCN.number.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;

    case 'debit_note':
      const latestDN = await prisma.debitNote.findFirst({
        where: {
          number: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { number: 'desc' }
      });
      if (latestDN) {
        const match = latestDN.number.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;

    case 'stock_journal':
      const latestSJ = await prisma.stockJournal.findFirst({
        where: {
          number: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { number: 'desc' }
      });
      if (latestSJ) {
        const match = latestSJ.number.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;

    case 'journal':
      const latestJE = await prisma.journalEntry.findFirst({
        where: {
          reference: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { reference: 'desc' }
      });
      if (latestJE?.reference) {
        const match = latestJE.reference.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;

    case 'invoice':
      const latestInv = await prisma.invoice.findFirst({
        where: {
          invoice_number: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { invoice_number: 'desc' }
      });
      if (latestInv) {
        const match = latestInv.invoice_number.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;

    case 'bill':
      const latestBill = await prisma.vendorBill.findFirst({
        where: {
          bill_number: { startsWith: `${prefix}-${year}-` }
        },
        orderBy: { bill_number: 'desc' }
      });
      if (latestBill) {
        const match = latestBill.bill_number.match(/-(\d+)$/);
        if (match) latestNumber = parseInt(match[1], 10);
      }
      break;
  }

  // Generate new number with 4-digit padding
  const nextNumber = (latestNumber + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${nextNumber}`;
}

/**
 * Get account balance with optional date filter
 */
export async function getAccountBalance(
  accountId: string,
  asOfDate?: Date
): Promise<number> {
  const where: any = { account_id: accountId };

  if (asOfDate) {
    where.journal_entry = {
      date: { lte: asOfDate }
    };
  }

  const result = await prisma.journalLine.aggregate({
    where,
    _sum: {
      debit: true,
      credit: true
    }
  });

  const debits = Number(result._sum.debit || 0);
  const credits = Number(result._sum.credit || 0);

  // Get account type to determine balance calculation
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { type: true }
  });

  if (!account) return 0;

  // Asset and Expense: Debit increases balance
  // Liability, Equity, Revenue: Credit increases balance
  const isDebitBalance = account.type === 'asset' || account.type === 'expense';

  return isDebitBalance ? debits - credits : credits - debits;
}

/**
 * Update account balance
 */
export async function updateAccountBalance(accountId: string): Promise<void> {
  const balance = await getAccountBalance(accountId);

  await prisma.account.update({
    where: { id: accountId },
    data: { balance }
  });
}

/**
 * Standard GL account codes
 */
export const GL_ACCOUNTS = {
  // Assets
  CASH: '1000',
  ACCOUNTS_RECEIVABLE: '1100',
  INVENTORY: '1200',
  PREPAID_EXPENSES: '1300',
  FIXED_ASSETS: '1500',
  ACCUMULATED_DEPRECIATION: '1510',

  // Liabilities
  ACCOUNTS_PAYABLE: '2000',
  ACCRUED_LIABILITIES: '2100',
  DEFERRED_REVENUE: '2200',
  TAX_PAYABLE: '2300',

  // Equity
  CAPITAL: '3000',
  RETAINED_EARNINGS: '3100',

  // Revenue
  SALES_REVENUE: '4000',
  SERVICE_REVENUE: '4100',

  // Cost of Goods Sold
  COGS: '5000',

  // Expenses
  SALARIES: '6000',
  RENT: '6100',
  UTILITIES: '6200',
  DEPRECIATION_EXPENSE: '6300',
  OFFICE_SUPPLIES: '6400',

  // Other
  INTEREST_INCOME: '7000',
  INTEREST_EXPENSE: '7100'
};
