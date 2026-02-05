import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { created_at: 'asc' }
    });
    
    const serializedAccounts = accounts.map(acc => ({
      ...acc,
      current_balance: Number(acc.current_balance)
    }));

    return NextResponse.json(serializedAccounts);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const account = await prisma.bankAccount.create({
      data: {
        name: body.name,
        account_number: body.account_number,
        bank_name: body.bank_name,
        currency: body.currency,
        current_balance: body.current_balance ? parseFloat(body.current_balance) : 0,
        type: body.type
      }
    });
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
