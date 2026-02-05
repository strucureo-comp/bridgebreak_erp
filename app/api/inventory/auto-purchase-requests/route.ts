import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/inventory/low-stock-alerts
 * Identify items below minimum stock levels
 * Ready to auto-generate purchase requests
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 5
        }
      }
    }) as Array<any>;

    const lowStockAlerts = items
      .filter(item => Number(item.min_stock ?? 0) > 0 && item.current_stock < Number(item.min_stock ?? 0))
      .map(item => {
        const minStock = Number(item.min_stock ?? 0);
        // Calculate average daily usage
        const last30Days = (item.transactions || [])
          .filter((t: any) => new Date(t.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000);
        const avgDailyUsage = last30Days.length > 0
          ? last30Days.reduce((sum: number, t: any) => sum + (t.type.includes('out') ? t.quantity : 0), 0) / 30
          : 0;

        return {
          itemId: item.id,
          code: item.code,
          name: item.name,
          category: item.category,
          unit: item.unit,
          currentStock: item.current_stock,
          minStock: minStock,
          maxStock: minStock * 3, // Suggested max
          stockout: item.current_stock <= 0,
          daysToStockout: avgDailyUsage > 0 ? Math.ceil(item.current_stock / avgDailyUsage) : null,
          costPrice: item.cost_price,
          reorderQuantity: Math.max(minStock * 2, 10),
          suggestedCost: Number(item.cost_price || 0) * Math.max(minStock * 2, 10),
          avgDailyUsage: avgDailyUsage.toFixed(2)
        };
      });

    return NextResponse.json({
      itemsNeedingReorder: lowStockAlerts.length,
      criticalItems: lowStockAlerts.filter(i => i.stockout).length,
      alerts: lowStockAlerts.sort((a, b) => (a.daysToStockout || 999) - (b.daysToStockout || 999))
    });
  } catch (error) {
    console.error('Low stock alert error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/inventory/auto-generate-purchase-requests
 * Automatically create purchase requests for low-stock items
 * Optionally create purchase orders with default vendor
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemIds, defaultVendorId, autoCreatePO } = body;

    const items = await prisma.inventoryItem.findMany({
      where: itemIds ? { id: { in: itemIds } } : {
        min_stock: { gt: 0 },
        current_stock: { lt: prisma.inventoryItem.fields.min_stock }
      }
    });

    const createdRequests = [];
    const createdOrders = [];

    for (const item of items) {
      // Create purchase request
      const reorderQty = Math.max((item.min_stock || 10) * 2, 10);
      const estimatedCost = Number(item.cost_price || 0) * reorderQty;

      const purchaseRequest = await prisma.purchaseRequest.create({
        data: {
          item_name: item.name,
          quantity: reorderQty,
          unit: item.unit,
          estimated_cost: estimatedCost,
          status: 'pending',
          priority: item.current_stock <= 0 ? 'high' : 'medium',
          requested_by: user.id,
          needed_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          notes: `Auto-generated: ${item.name} (${item.code}) - Current: ${item.current_stock}, Min: ${item.min_stock}`
        }
      });

      createdRequests.push(purchaseRequest);

      // Optionally create PO
      if (autoCreatePO && defaultVendorId) {
        const poNumber = `PO-${Date.now()}-${item.code}`;
        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            po_number: poNumber,
            purchase_request_id: purchaseRequest.id,
            vendor_id: defaultVendorId,
            total_amount: estimatedCost,
            status: 'pending',
            created_by: user.id
          }
        });

        createdOrders.push(purchaseOrder);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdRequests.length} purchase requests`,
      requestsCreated: createdRequests.length,
      ordersCreated: createdOrders.length,
      requests: createdRequests,
      orders: createdOrders
    });
  } catch (error) {
    console.error('Auto-PO error:', error);
    return NextResponse.json({ error: 'Failed to create requests' }, { status: 400 });
  }
}
