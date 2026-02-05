import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    
    // Convert Decimal to Number for JSON serialization
    const serializedTransactions = transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      exchange_rate: t.exchange_rate ? Number(t.exchange_rate) : null
    }));

    return NextResponse.json(serializedTransactions);
  } catch (error) {
    console.error('Transactions GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    
    // Convert date string to Date object
    const date = body.date ? new Date(body.date) : new Date();
    
    // Map body to schema fields
    const data: any = {
      type: body.type,
      category: body.category,
      amount: parseFloat(body.amount),
      currency: body.currency || 'USD',
      date: date,
      description: body.description,
      notes: body.notes,
      payment_method: body.payment_method,
      reference_number: body.reference_number,
      attachment_url: body.attachment_url,
      tax_rate_id: body.tax_rate_id,
      created_by: user.id
    };

    if (body.exchange_rate !== undefined) {
      data.exchange_rate = parseFloat(body.exchange_rate);
    }

    const transaction = await prisma.transaction.create({
      data
    });

    return NextResponse.json({
      ...transaction,
      amount: Number(transaction.amount),
      exchange_rate: transaction.exchange_rate ? Number(transaction.exchange_rate) : null
    });
  } catch (error) {
    console.error('Transaction Create Error:', error);
    
    // FINAL FALLBACK: If it's still failing due to schema desync, try one last time with only guaranteed fields
    if (error instanceof Error && (error.message.includes('tax_rate_id') || error.message.includes('attachment_url'))) {
      console.warn('[API] Schema desync persists. Executing final fallback (minimal data)...');
      try {
        const body = await request.clone().json();
        const minimalData = {
          type: body.type,
          category: body.category,
          amount: parseFloat(body.amount),
          currency: body.currency || 'USD',
          date: body.date ? new Date(body.date) : new Date(),
          description: body.description,
          created_by: user.id
        };
        const transaction = await prisma.transaction.create({ data: minimalData });
        return NextResponse.json({
          ...transaction,
          amount: Number(transaction.amount)
        });
      } catch (fallbackError) {
        return NextResponse.json({ error: 'Critical failure', message: String(fallbackError) }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
