import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateAccountNumber } from '@/lib/finance/accounts';

// GET /api/admin/scm/stock-journal - List all stock journals
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const postingStatus = searchParams.get('posting_status');
    const variantId = searchParams.get('variant_id');

    const where: any = {};
    if (type) where.type = type;
    if (postingStatus) where.posting_status = postingStatus;

    // Filter by variant through lines
    const includeLinesWhere: any = {};
    if (variantId) includeLinesWhere.variant_id = variantId;

    const stockJournals = await prisma.stockJournal.findMany({
      where,
      include: {
        creator: {
          select: { id: true, full_name: true }
        },
        lines: {
          where: Object.keys(includeLinesWhere).length > 0 ? includeLinesWhere : undefined,
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true } }
              }
            }
          }
        },
        _count: {
          select: { gl_entries: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(stockJournals);
  } catch (error) {
    console.error('Error fetching stock journals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock journals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scm/stock-journal - Create a new stock journal
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      date,
      type,
      reference,
      reason,
      notes,
      valuation_method = 'fifo',
      lines
    } = body;

    // Validate required fields
    if (!date || !type || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: date, type, lines' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['adjustment', 'transfer', 'count', 'damage', 'obsolete', 'revaluation'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate stock journal number
    const number = await generateAccountNumber('SJ', 'stock_journal');

    // Calculate total value
    const totalValue = lines.reduce(
      (sum: number, line: any) => sum + Number(line.total_cost || 0),
      0
    );

    // Create stock journal with lines in a transaction
    const stockJournal = await prisma.$transaction(async (tx) => {
      // Create stock journal
      const sj = await tx.stockJournal.create({
        data: {
          number,
          date: new Date(date),
          type,
          reference,
          reason,
          notes,
          total_value: totalValue,
          valuation_method,
          posting_status: 'draft',
          created_by: user.id,
          lines: {
            create: lines.map((line: any, index: number) => ({
              variant_id: line.variant_id,
              from_location_id: line.from_location_id,
              to_location_id: line.to_location_id,
              quantity: line.quantity,
              unit_cost: line.unit_cost || 0,
              total_cost: line.total_cost || (line.quantity * (line.unit_cost || 0)),
              lot_number: line.lot_number,
              expiry_date: line.expiry_date ? new Date(line.expiry_date) : null,
              notes: line.notes,
              sort_order: index
            }))
          }
        },
        include: {
          creator: {
            select: { id: true, full_name: true }
          },
          lines: {
            include: {
              variant: {
                include: {
                  product: { select: { id: true, name: true } }
                }
              }
            }
          }
        }
      });

      // Update inventory quantities for non-draft entries
      // For now, we only update when explicitly requested or when posting
      if (type === 'adjustment' || type === 'count') {
        for (const line of lines) {
          if (line.to_location_id) {
            // Update or create inventory item
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
                    increment: line.quantity
                  }
                }
              });
            } else {
              await tx.inventoryItem.create({
                data: {
                  variant_id: line.variant_id,
                  location_id: line.to_location_id,
                  quantity: line.quantity
                }
              });
            }
          }
        }
      }

      return sj;
    });

    return NextResponse.json(stockJournal, { status: 201 });
  } catch (error) {
    console.error('Error creating stock journal:', error);
    return NextResponse.json(
      { error: 'Failed to create stock journal' },
      { status: 500 }
    );
  }
}
