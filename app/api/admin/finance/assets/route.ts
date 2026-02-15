import { getServerSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.fixedAsset.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                depreciation_schedule: true
            }
        });

        return NextResponse.json(assets);
    } catch (error) {
        console.error('GET /api/admin/finance/assets ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        // Basic Validation
        if (!data.name || !data.purchase_cost || !data.useful_life_years || !data.purchase_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate Asset Number if not provided
        let assetNumber = data.asset_number;
        if (!assetNumber) {
            const count = await prisma.fixedAsset.count();
            assetNumber = `FA-${String(count + 1).padStart(4, '0')}`;
        }

        const cost = Number(data.purchase_cost);
        const life = Number(data.useful_life_years);
        const salvage = Number(data.salvage_value || 0);

        // Create Asset
        const asset = await prisma.fixedAsset.create({
            data: {
                name: data.name,
                asset_number: assetNumber,
                purchase_date: new Date(data.purchase_date),
                purchase_cost: cost,
                salvage_value: salvage,
                useful_life_years: life,
                current_book_value: cost, // Initially equal to cost
                location: data.location,
                serial_number: data.serial_number,
                asset_account_id: data.asset_account_id,
                depreciation_account_id: data.depreciation_account_id,
                expense_account_id: data.expense_account_id,
            }
        });

        // Generate Draft Depreciation Schedule (Straight Line)
        // Formula: (Cost - Salvage) / Life
        if (life > 0) {
            const depreciableAmount = cost - salvage;
            const annualDepreciation = depreciableAmount / life;
            const monthlyDepreciation = annualDepreciation / 12;

            const purchaseDate = new Date(data.purchase_date);
            let currentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, 1); // Start next month? or active month? Let's say next month for simplicity

            const scheduleData = [];
            const totalMonths = life * 12;

            for (let i = 0; i < totalMonths; i++) {
                scheduleData.push({
                    fixed_asset_id: asset.id,
                    date: new Date(currentDate),
                    amount: monthlyDepreciation,
                    is_posted: false
                });
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            if (scheduleData.length > 0) {
                await prisma.depreciationSchedule.createMany({
                    data: scheduleData
                });
            }
        }

        return NextResponse.json(asset);

    } catch (error) {
        console.error('POST /api/admin/finance/assets ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
