import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/dashboard/executive-summary
 * Unified dashboard with KPIs from all modules
 * Real-time business health snapshot
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. PROJECT METRICS
    const projects = await prisma.project.findMany({
      include: {
        invoices: { include: { payments: true } },
        labour_allocations: true,
        inventory_logs: true,
        purchase_requests: true
      }
    });

    const projectMetrics = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalRevenue: projects
        .flatMap(p => p.invoices)
        .reduce((sum, inv) => sum + Number(inv.amount), 0),
      totalPaid: projects
        .flatMap(p => p.invoices)
        .flatMap(inv => inv.payments)
        .reduce((sum, pay) => sum + Number(pay.amount), 0),
      overdueDays: Math.max(
        ...projects
          .flatMap(p => p.invoices)
          .filter(inv => inv.status === 'overdue')
          .map(inv => 0) // Calculate based on due_date
      )
    };

    projectMetrics.pending = projectMetrics.totalRevenue - projectMetrics.totalPaid;

    // 2. FINANCIAL METRICS
    const invoices = await prisma.invoice.findMany({
      include: { payments: true }
    });
    const transactions = await prisma.transaction.findMany();
    const vendorBills = await prisma.vendorBill.findMany({
      include: { vendor_payments: true }
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) + projectMetrics.totalPaid;

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) +
      vendorBills.reduce((sum, vb) => sum + Number(vb.amount), 0);

    const financialMetrics = {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) + '%' : '0%',
      cashFlow: projectMetrics.totalPaid - (
        vendorBills
          .flatMap(vb => vb.vendor_payments)
          .reduce((sum, vp) => sum + Number(vp.amount), 0)
      ),
      invoicesOutstanding: projectMetrics.pending,
      vendorPayablesOutstanding: vendorBills
        .filter(vb => vb.status !== 'paid')
        .reduce((sum, vb) => sum + Number(vb.amount), 0)
    };

    // 3. HR METRICS
    const employees = await prisma.employee.findMany({
      include: { allocations: true, attendance: true }
    });
    const payrolls = await prisma.payroll.findMany({
      include: { lines: true }
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentPayroll = payrolls.find(p => p.month === currentMonth);

    const hrMetrics = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      allocatedToProjects: employees.filter(e => e.allocations.some(a => a.status === 'active')).length,
      utilizationRate: employees.length > 0
        ? (employees.filter(e => e.allocations.some(a => a.status === 'active')).length / employees.length * 100).toFixed(1) + '%'
        : '0%',
      currentMonthPayroll: currentPayroll?.total_amount || 0,
      payrollStatus: currentPayroll?.status || 'not_generated',
      attendanceThisMonth: employees
        .flatMap(e => e.attendance)
        .filter(a => a.date.toISOString().slice(0, 7) === currentMonth).length,
      attendanceRate: employees.length > 0
        ? ((employees
            .flatMap(e => e.attendance)
            .filter(a => a.date.toISOString().slice(0, 7) === currentMonth && a.status === 'present').length /
          (employees.length * 20)) * 100).toFixed(1) + '%'
        : '0%'
    };

    // 4. INVENTORY METRICS
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: { transactions: true }
    });

    const inventoryMetrics = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(i => i.min_stock && i.current_stock < i.min_stock).length,
      criticalItems: inventoryItems.filter(i => i.current_stock === 0).length,
      totalInventoryValue: inventoryItems.reduce(
        (sum, item) => sum + (Number(item.cost_price || 0) * item.current_stock), 0
      ),
      stockoutRisk: inventoryItems
        .filter(i => i.min_stock && i.current_stock < i.min_stock)
        .map(i => i.name)
        .slice(0, 5)
    };

    // 5. PROCUREMENT METRICS
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: { vendor_bills: { include: { vendor_payments: true } } }
    });
    const vendors = await prisma.vendor.findMany();

    const procurementMetrics = {
      totalVendors: vendors.length,
      totalPurchaseOrders: purchaseOrders.length,
      openOrders: purchaseOrders.filter(po => po.status !== 'paid' && po.status !== 'cancelled').length,
      totalOrderValue: purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount), 0),
      pendingPayments: purchaseOrders
        .flatMap(po => po.vendor_bills)
        .filter(vb => vb.status !== 'paid')
        .reduce((sum, vb) => sum + Number(vb.amount), 0),
      topVendors: vendors.slice(0, 5).map(v => v.name)
    };

    // 6. OPERATIONAL HEALTH
    const supportRequests = await prisma.supportRequest.findMany();
    const meetings = await prisma.meetingRequest.findMany();

    const operationalMetrics = {
      openSupportTickets: supportRequests.filter(s => s.status !== 'closed').length,
      overdueSupportTickets: supportRequests.filter(s => s.status === 'open').length,
      pendingMeetings: meetings.filter(m => m.status === 'pending').length,
      completedMeetings: meetings.filter(m => m.status === 'completed').length
    };

    // 7. TRENDS (Last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => t.created_at > thirtyDaysAgo);
    const recentProjects = projects.filter(p => p.created_at > thirtyDaysAgo);

    const trendMetrics = {
      newProjectsThisMonth: recentProjects.length,
      revenueThisMonth: recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      expenseThisMonth: recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      newEmployees: employees.filter(e => e.created_at > thirtyDaysAgo).length,
      newVendors: vendors.filter(v => v.created_at > thirtyDaysAgo).length
    };

    return NextResponse.json({
      timestamp: new Date(),
      projects: projectMetrics,
      financials: financialMetrics,
      hr: hrMetrics,
      inventory: inventoryMetrics,
      procurement: procurementMetrics,
      operations: operationalMetrics,
      trends: trendMetrics,
      alerts: [
        inventoryMetrics.lowStockItems > 0 && {
          severity: 'warning',
          message: `${inventoryMetrics.lowStockItems} items below minimum stock`,
          action: 'Review inventory and create purchase orders'
        },
        financialMetrics.netProfit < 0 && {
          severity: 'critical',
          message: 'Operating at loss',
          action: 'Review project profitability'
        },
        projectMetrics.pending > projectMetrics.totalRevenue * 0.2 && {
          severity: 'warning',
          message: 'More than 20% of revenue outstanding',
          action: 'Follow up on overdue invoices'
        },
        Number(hrMetrics.utilizationRate) < 60 && {
          severity: 'info',
          message: 'Resource utilization below 60%',
          action: 'Plan new projects or allocate existing'
        }
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
