import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/projects/[id]/financials
 * Calculate complete project financials from all sources
 * - Labour costs (from allocations + attendance)
 * - Inventory costs (from transactions)
 * - Vendor costs (from purchase orders)
 * - Invoice revenue
 * Real-time project P&L
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projectId = params.id;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { full_name: true } },
        invoices: { include: { payments: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'admin' && project.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. REVENUE (from invoices)
    const totalInvoiced = project.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = project.invoices
      .flatMap(inv => inv.payments)
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    // 2. LABOUR COSTS
    const allocations = await prisma.labourAllocation.findMany({
      where: { project_id: projectId },
      include: {
        employee: { select: { basic_salary: true, overtime_rate: true } }
      }
    });

    const attendance = await prisma.attendance.findMany({
      where: { project_id: projectId },
      include: { employee: { select: { basic_salary: true, overtime_rate: true } } }
    });

    let labourCost = 0;
    attendance.forEach(att => {
      // Daily labour cost = (basic_salary / 26 working days) + (overtime_hours × overtime_rate)
      const dailyRate = Number(att.employee.basic_salary) / 26;
      labourCost += dailyRate + (att.overtime_hours * Number(att.employee.overtime_rate));
    });

    // 3. INVENTORY COSTS
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: { project_id: projectId },
      include: { item: { select: { cost_price: true } } }
    });

    let inventoryCost = 0;
    inventoryTransactions.forEach(inv => {
      if (['issue_to_project', 'scrap', 'wastage'].includes(inv.type)) {
        inventoryCost += (Number(inv.item.cost_price || 0) * inv.quantity);
      }
    });

    // 4. VENDOR COSTS (from purchase orders for this project)
    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: { project_id: projectId },
      include: {
        purchase_orders: {
          include: {
            vendor_bills: {
              include: { vendor_payments: true }
            }
          }
        }
      }
    });

    let vendorCostBilled = 0;
    let vendorCostPaid = 0;
    purchaseRequests.forEach(pr => {
      pr.purchase_orders.forEach(po => {
        vendorCostBilled += Number(po.total_amount);
        po.vendor_bills.forEach(vb => {
          vb.vendor_payments.forEach(vp => {
            vendorCostPaid += Number(vp.amount);
          });
        });
      });
    });

    // 5. OTHER COSTS (any transaction linked to project)
    let otherCosts = 0;
    const transactions = await prisma.transaction.findMany({
      where: {
        category: 'project_expense',
        description: { contains: projectId }
      }
    });
    otherCosts = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0);

    // Calculate totals
    const totalCosts = labourCost + inventoryCost + vendorCostBilled + otherCosts;
    const totalExpensePaid = labourCost + inventoryCost + vendorCostPaid + otherCosts;
    const grossProfit = totalInvoiced - totalCosts;
    const grossProfitMargin = totalInvoiced > 0 ? (grossProfit / totalInvoiced) * 100 : 0;
    const cashProfit = totalPaid - totalExpensePaid;

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        client: project.client.full_name
      },
      revenue: {
        invoiced: totalInvoiced,
        paid: totalPaid,
        pending: totalInvoiced - totalPaid
      },
      costs: {
        labour: {
          amount: labourCost,
          employees: allocations.length,
          attendanceDays: attendance.length
        },
        inventory: {
          amount: inventoryCost,
          items: inventoryTransactions.length,
          categories: Array.from(new Set(inventoryTransactions.map(inv => inv.type)))
        },
        vendor: {
          amount: vendorCostBilled,
          paid: vendorCostPaid,
          pending: vendorCostBilled - vendorCostPaid,
          orders: purchaseRequests.length
        },
        other: otherCosts,
        total: totalCosts
      },
      profitability: {
        grossProfit,
        grossProfitMargin: grossProfitMargin.toFixed(2) + '%',
        cashProfit,
        roi: totalCosts > 0 ? ((grossProfit / totalCosts) * 100).toFixed(2) + '%' : 'N/A'
      },
      costBreakdown: {
        labour: totalCosts > 0 ? ((labourCost / totalCosts) * 100).toFixed(1) + '%' : '0%',
        inventory: totalCosts > 0 ? ((inventoryCost / totalCosts) * 100).toFixed(1) + '%' : '0%',
        vendor: totalCosts > 0 ? ((vendorCostBilled / totalCosts) * 100).toFixed(1) + '%' : '0%',
        other: totalCosts > 0 ? ((otherCosts / totalCosts) * 100).toFixed(1) + '%' : '0%'
      },
      estimatedVsActual: {
        estimated: Number(project.estimated_cost || 0),
        actual: totalCosts,
        variance: (Number(project.estimated_cost || 0) - totalCosts).toFixed(2),
        variancePercent: Number(project.estimated_cost || 0) > 0
          ? (((Number(project.estimated_cost) - totalCosts) / Number(project.estimated_cost)) * 100).toFixed(1) + '%'
          : 'N/A'
      }
    });
  } catch (error) {
    console.error('Financials error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
