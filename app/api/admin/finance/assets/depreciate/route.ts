import { getServerSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { date } = await req.json();
        const targetDate = date ? new Date(date) : new Date();

        // Find all unposted depreciation schedules up to the target date
        const schedules = await prisma.depreciationSchedule.findMany({
            where: {
                is_posted: false,
                date: {
                    lte: targetDate
                }
            },
            include: {
                fixed_asset: true
            }
        });

        if (schedules.length === 0) {
            return NextResponse.json({ message: 'No depreciation due', count: 0 });
        }

        let postedCount = 0;

        // Process each schedule
        for (const schedule of schedules) {
            // Create Journal Entry
            // Debit: Depreciation Expense
            // Credit: Accumulated Depreciation (Contra Asset)

            const je = await prisma.journalEntry.create({
                data: {
                    date: schedule.date,
                    description: `Depreciation - ${schedule.fixed_asset.name} (${schedule.fixed_asset.asset_number})`,
                    status: 'posted',
                    created_by: session.user.id,
                    lines: {
                        create: [
                            {
                                account_id: schedule.fixed_asset.expense_account_id,
                                debit: schedule.amount, // Expense increases with Debit
                                credit: 0
                            },
                            {
                                account_id: schedule.fixed_asset.depreciation_account_id,
                                debit: 0,
                                credit: schedule.amount // Contra Asset increases with Credit (reducing book value)
                            }
                        ]
                    }
                }
            });

            // Update Asset Book Value & Schedule status
            await prisma.$transaction([
                prisma.depreciationSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        is_posted: true,
                        journal_entry_id: je.id
                    }
                }),
                prisma.fixedAsset.update({
                    where: { id: schedule.fixed_asset_id },
                    data: {
                        accumulated_depreciation: {
                            increment: schedule.amount
                        },
                        current_book_value: {
                            decrement: schedule.amount
                        },
                        last_depreciation_date: schedule.date
                    }
                })
            ]);

            postedCount++;
        }

        return NextResponse.json({ message: 'Depreciation run completed', count: postedCount });

    } catch (error) {
        console.error('POST /api/admin/finance/assets/depreciate ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
