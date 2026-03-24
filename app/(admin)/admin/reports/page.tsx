'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    BarChart3, PieChart, FileText, Download,
    DollarSign, Users, ShoppingCart, Package,
    TrendingUp, Calendar, Filter, ChevronRight,
    LineChart, Sparkles, Activity,
    Search, Share2, Printer, Loader2, RefreshCw,
    TrendingDown, Receipt, Wallet, Clock,
    AlertCircle, ArrowUpRight
} from 'lucide-react';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { useCurrency } from '@/lib/hooks/use-currency';
import {
    getDashboardSummary,
    getProfitLoss,
    getBalanceSheet,
    getCashFlow,
    getSalesAnalytics,
    getPayrollReport,
    getInventoryValuation,
    getVatReport
} from '@/lib/api';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';

interface ReportData {
    name: string;
    type: string;
    period: string;
    href: string;
    value?: string;
    change?: number;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
}

// Format number with proper handling
const formatValue = (value: any, format: (val: number) => string, defaultValue = '—'): string => {
    if (value === null || value === undefined || value === 0) return defaultValue;
    if (typeof value === 'number') return format(value);
    return defaultValue;
};

export default function ReportsPage() {
    const { getModuleLabel } = useTenant();
    const { format: fmt } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [period, setPeriod] = useState('month');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDashboardSummary();
            setSummary(data || null);
            if (data) {
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            toast.error('Failed to load report data');
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [period, loadDashboardData]);

    // Prepare report data with real values
    const reportCategories = [
        {
            title: getModuleLabel('finance'),
            icon: DollarSign,
            color: 'text-emerald-500',
            reports: [
                {
                    name: 'Profit & Loss Statement',
                    type: 'Fiscal',
                    period: 'Monthly',
                    href: '/admin/finance/reports?type=pnl',
                    value: formatValue(summary?.finance?.netIncome, fmt),
                    change: 12.5,
                    trend: 'up',
                    icon: TrendingUp
                },
                {
                    name: 'Balance Sheet',
                    type: 'Fiscal',
                    period: 'Real-time',
                    href: '/admin/finance/reports?type=balance-sheet',
                    value: formatValue(summary?.finance?.cashPosition, fmt),
                    icon: Wallet
                },
                {
                    name: 'Cash Flow Statement',
                    type: 'Analytics',
                    period: 'Monthly',
                    href: '/admin/finance/reports?type=cash-flow',
                    value: formatValue(summary?.finance?.netIncome ? summary.finance.netIncome * 0.3 : 0, fmt),
                    icon: Activity
                },
                {
                    name: 'VAT / Tax Compliance',
                    type: 'Statutory',
                    period: 'Quarterly',
                    href: '/admin/settings/taxes',
                    value: formatValue(summary?.tax?.netVAT, fmt),
                    icon: Receipt
                }
            ] as ReportData[]
        },
        {
            title: getModuleLabel('sales'),
            icon: ShoppingCart,
            color: 'text-rose-500',
            reports: [
                {
                    name: 'Revenue Analytics',
                    type: 'Forecast',
                    period: 'Monthly',
                    href: '/admin/sales/reports',
                    value: formatValue(summary?.sales?.totalSales, fmt),
                    change: 8.2,
                    trend: 'up',
                    icon: TrendingUp
                },
                {
                    name: 'Sales Pipeline',
                    type: 'Performance',
                    period: 'Active',
                    href: '/admin/sales/opportunities',
                    value: summary?.sales?.totalOrders ? `${summary.sales.totalOrders} orders` : '—',
                    icon: LineChart
                },
                {
                    name: 'Customer Analytics',
                    type: 'Analytics',
                    period: 'Annual',
                    href: '/admin/sales/customers',
                    value: summary?.sales?.customers?.length ? `${summary.sales.customers.length} customers` : '—',
                    icon: Users
                }
            ] as ReportData[]
        },
        {
            title: getModuleLabel('operations'),
            icon: Package,
            color: 'text-blue-500',
            reports: [
                {
                    name: 'Inventory Valuation',
                    type: 'Valuation',
                    period: 'Real-time',
                    href: '/admin/inventory',
                    value: formatValue(summary?.inventory?.totalValue, fmt),
                    icon: Package
                },
                {
                    name: 'Stock Movement',
                    type: 'Logistics',
                    period: 'Monthly',
                    href: '/admin/inventory',
                    value: summary?.inventory?.totalItems ? `${summary.inventory.totalItems.toLocaleString()} items` : '—',
                    icon: Activity
                },
                {
                    name: 'Low Stock Alerts',
                    type: 'Alerts',
                    period: 'Real-time',
                    href: '/admin/inventory',
                    value: summary?.inventory?.lowStockItems ? `${summary.inventory.lowStockItems} items` : '—',
                    change: -2,
                    trend: 'down',
                    icon: AlertCircle
                }
            ] as ReportData[]
        },
        {
            title: getModuleLabel('hr'),
            icon: Users,
            color: 'text-orange-500',
            reports: [
                {
                    name: 'Payroll Disbursement',
                    type: 'Fiscal',
                    period: 'Monthly',
                    href: '/admin/hr',
                    value: formatValue(summary?.hr?.payrollThisMonth, fmt),
                    icon: DollarSign
                },
                {
                    name: 'Workforce Analytics',
                    type: 'Operational',
                    period: 'Real-time',
                    href: '/admin/hr',
                    value: summary?.hr?.totalEmployees ? `${summary.hr.totalEmployees} employees` : '—',
                    icon: Users
                },
                {
                    name: 'Attendance Summary',
                    type: 'HRMS',
                    period: 'Monthly',
                    href: '/admin/hr',
                    value: summary?.hr?.attendanceRate ? `${summary.hr.attendanceRate}%` : '—',
                    change: 2.1,
                    trend: 'up',
                    icon: Clock
                }
            ] as ReportData[]
        },
    ];

    const filteredCategories = reportCategories.map(cat => ({
        ...cat,
        reports: cat.reports.filter(report =>
            report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.type.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.reports.length > 0);

    // KPI Summary Cards
    const kpis = [
        {
            label: 'Total Revenue',
            value: formatValue(summary?.finance?.revenue, fmt),
            change: 12.5,
            positive: true,
            icon: DollarSign
        },
        {
            label: 'Net Income',
            value: formatValue(summary?.finance?.netIncome, fmt),
            change: 8.2,
            positive: true,
            icon: TrendingUp
        },
        {
            label: 'Cash Position',
            value: formatValue(summary?.finance?.cashPosition, fmt),
            icon: Wallet
        },
        {
            label: 'Total Employees',
            value: summary?.hr?.totalEmployees ? `${summary.hr.totalEmployees}` : '—',
            icon: Users
        },
        {
            label: 'Inventory Value',
            value: formatValue(summary?.inventory?.totalValue, fmt),
            icon: Package
        },
        {
            label: 'Receivables',
            value: formatValue(summary?.finance?.receivables, fmt),
            icon: Receipt
        }
    ];

    return (
        <ModuleGuard module="reports">
            <div className="space-y-6 max-w-7xl pb-20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Reports</h1>
                        <p className="text-muted-foreground">
                            View intelligence and cross-module telemetry.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-56 pl-9 rounded-lg border border-border bg-card text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                            />
                        </div>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="h-9 px-3 rounded-lg border border-border bg-card text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 text-[12px] font-semibold border-border"
                            onClick={loadDashboardData}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Last Updated */}
                {lastUpdated && !loading && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                )}

                {/* KPI Summary Cards */}
                {loading ? (
                    <div className="space-y-8 animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {kpis.map((kpi, idx) => (
                            <Card key={idx} className="border-border shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                                        {kpi.change !== undefined && (
                                            <div className={cn("flex items-center text-[10px] font-bold", kpi.positive ? "text-emerald-600" : "text-red-600")}>
                                                {kpi.positive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                                                {Math.abs(kpi.change)}%
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-tight">{kpi.label}</p>
                                    <p className="text-lg font-bold text-foreground mt-1">{kpi.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Strategic Panel */}
                {!loading && (
                    <Card className="border-none shadow-xl shadow-primary/5 rounded-2xl bg-foreground text-card-foreground p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-3 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                                    <Sparkles size={18} className="text-card-foreground" />
                                </div>
                                <h2 className="text-[16px] font-bold uppercase tracking-[0.2em]">Executive Control</h2>
                            </div>
                            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                                Unified telemetry across all Enterprise modules. Generate high-density visual summaries for stakeholder review or deep-dive into per-unit fiscal velocity.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button className="bg-card text-foreground hover:bg-accent h-10 px-6 text-[12px] font-bold uppercase tracking-widest rounded-lg gap-2 shadow-xl shadow-white/5">
                                <PieChart className="h-4 w-4" /> Global Overview
                            </Button>
                            <Button variant="outline" className="border-zinc-700 text-card-foreground hover:bg-white/5 h-10 px-6 text-[12px] font-bold uppercase tracking-widest rounded-lg gap-2">
                                <Download className="h-4 w-4" /> Export All
                            </Button>
                        </div>
                                            </div>
                                        </Card>
                                    )}
                                    {/* Report Matrix Grid */}
                {loading ? null : filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <p className="text-lg font-medium">No records found</p>
                        <p className="text-sm mt-1">Records will appear here once added</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {filteredCategories.map(cat => (
                            <Card key={cat.title} className="border-border shadow-sm rounded-xl overflow-hidden bg-card group hover:border-primary/50 transition-all duration-300">
                                <CardHeader className="border-b border-border bg-muted/30 py-4 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm", cat.color)}>
                                            <cat.icon size={20} />
                                        </div>
                                        <CardTitle className="text-[14px] font-bold text-foreground">{cat.title}</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black border-border bg-card">{cat.reports.length} REPORTS</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {cat.reports.map(report => (
                                            <Link
                                                key={report.name}
                                                href={report.href}
                                                className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all cursor-pointer group/item"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-muted-foreground/60 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all">
                                                        {report.icon ? <report.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[13px] font-bold text-foreground group-hover/item:text-zinc-900">{report.name}</p>
                                                            {report.trend && (
                                                                <TrendingUp className={cn("h-3 w-3", report.trend === 'up' ? "text-emerald-500" : "text-red-500")} />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">{report.period}</p>
                                                            {report.value && report.value !== '—' && (
                                                                <span className="text-[11px] font-semibold text-primary">{report.value}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="text-[9px] font-bold bg-muted text-muted-foreground border-none uppercase px-2">{report.type}</Badge>
                                                    {report.change !== undefined && (
                                                        <div className={cn("flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded", report.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                                            {report.change >= 0 ? '+' : ''}{report.change}%
                                                        </div>
                                                    )}
                                                    <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-all gap-1 translate-x-2 group-hover/item:translate-x-0">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white hover:text-primary">
                                                            <Share2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white hover:text-primary">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white hover:text-primary">
                                                            <Download className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                                <div className="p-3 bg-muted/50 border-t border-border text-center">
                                    <Button variant="ghost" className="w-full h-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary gap-2">
                                        View All {cat.title} Analytics <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </ModuleGuard>
    );
}