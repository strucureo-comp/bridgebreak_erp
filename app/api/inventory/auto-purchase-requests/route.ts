import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/inventory/low-stock-alerts
 * Identify items below minimum stock levels (reorder_point)
 * Ready to auto-generate purchase requests
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const variants = await prisma.productVariant.findMany({
      include: {
        product: true,
        inventory: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    const lowStockAlerts = variants
      .map((variant: any) => {
        const currentStock = variant.inventory.reduce((sum: number, i: any) => sum + Number(i.quantity), 0);
        const reorderPoint = variant.reorder_point || 0;

        if (reorderPoint > 0 && currentStock <= reorderPoint) {
          // Calculate average daily usage
          const last30Days = variant.transactions
            .filter((t: any) => new Date(t.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000);

          const totalOut = last30Days
            .filter((t: any) => t.type === 'out')
            .reduce((sum: number, t: any) => sum + Number(t.quantity), 0);

          const avgDailyUsage = totalOut / 30;

          return {
            variantId: variant.id,
            sku: variant.sku,
            name: variant.name || variant.product.name,
            productName: variant.product.name,
            currentStock,
            minStock: reorderPoint,
            reorderQuantity: variant.reorder_quantity || Math.max(reorderPoint * 2, 10),
            stockout: currentStock <= 0,
            daysToStockout: avgDailyUsage > 0 ? Math.ceil(currentStock / avgDailyUsage) : null,
            cost: Number(variant.cost),
            suggestedCost: Number(variant.cost) * (variant.reorder_quantity || Math.max(reorderPoint * 2, 10))
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

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
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { variantIds, defaultVendorId, autoCreatePO } = body;

    // Fetch variants that need reorder
    const variants = await prisma.productVariant.findMany({
      where: variantIds ? { id: { in: variantIds } } : {
        reorder_point: { gt: 0 }
      },
      include: { product: true, inventory: true }
    });

    const createdRequests = [];
    const createdOrders = [];

    for (const variant of variants) {
      const currentStock = variant.inventory.reduce((sum, i) => sum + Number(i.quantity), 0);

      // Double check if it actually needs reorder if not explicitly requested
      if (!variantIds && currentStock > variant.reorder_point) continue;

      const reorderQty = variant.reorder_quantity || Math.max(variant.reorder_point * 2, 10);
      const estimatedCost = Number(variant.cost) * reorderQty;

      const purchaseRequest = await prisma.purchaseRequest.create({
        data: {
          item_name: `${variant.product.name} (${variant.sku})`,
          quantity: reorderQty,
          unit: variant.product.uom,
          estimated_cost: estimatedCost,
          status: 'pending',
          priority: currentStock <= 0 ? 'high' : 'medium',
          requested_by: user.id,
          needed_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          notes: `Auto-replenishment: Stock ${currentStock} <= Reorder Point ${variant.reorder_point}`
        }
      });

      createdRequests.push(purchaseRequest);

      // Optionally create PO
      if (autoCreatePO && defaultVendorId) {
        const poNumber = `PO-${Date.now()}-${variant.sku}`;
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
      ordersCreated: createdOrders.length
    });
  } catch (error) {
    console.error('Auto-PO error:', error);
    return NextResponse.json({ error: 'Failed to create requests' }, { status: 400 });
  }
}
