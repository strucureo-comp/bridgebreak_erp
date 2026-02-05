import { NextResponse } from 'next/server';
import { Prisma } from '@/prisma/generated/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await prisma.bankTransaction.findMany({
      orderBy: { date: 'desc' },
      include: { bank_account: true }
    }) as Array<any>;

    const serializedTransactions = transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
      bank_account: tx.bank_account ? {
        ...tx.bank_account,
        current_balance: Number(tx.bank_account.current_balance)
      } : null
    }));

    return NextResponse.json(serializedTransactions);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json([]);
      }
    }
    console.error('Bank Transactions GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const amount = parseFloat(body.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.bankTransaction.create({
        data: {
          bank_account_id: body.bank_account_id,
          date: new Date(body.date).toISOString(),
          description: body.description,
          amount: amount,
          type: body.type, // deposit, withdrawal
          reference: body.reference,
          status: body.status || 'cleared'
        }
      });

      // Update account balance
      const account = await tx.bankAccount.findUnique({ where: { id: body.bank_account_id } });
      if (account) {
        let newBalance = account.current_balance;
        if (body.type === 'deposit') {
            newBalance = newBalance.add(amount);
        } else {
            newBalance = newBalance.sub(amount);
        }
        
        await tx.bankAccount.update({
            where: { id: body.bank_account_id },
            data: { current_balance: newBalance }
        });
      }

      return {
        ...transaction,
        amount: Number(transaction.amount)
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json({ error: 'Banking tables missing' });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
