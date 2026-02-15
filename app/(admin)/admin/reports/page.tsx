'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    BarChart3, PieChart, FileText, Download,
    DollarSign, Users, ShoppingCart, Package,
    TrendingUp, Calendar, Filter, ChevronRight,
    LineChart, ArrowRight, Sparkles
} from 'lucide-react';
import { ModuleGuard } from '@/components/layout/module-guard';

const reportCategories = [
    {
        title: 'Financial Reports',
        icon: DollarSign,
        color: 'bg-emerald-50 text-emerald-600',
        reports: [
            { name: 'Profit & Loss Statement', type: 'Core', period: 'Monthly / Quarterly / Yearly' },
            { name: 'Balance Sheet', type: 'Core', period: 'End of Period' },
            { name: 'Cash Flow Statement', type: 'Core', period: 'Monthly' },
            { name: 'Trial Balance', type: 'Core', period: 'On Demand' },
            { name: 'General Ledger', type: 'Detail', period: 'On Demand' },
            { name: 'Aged Receivables', type: 'Operational', period: 'Weekly' },
            { name: 'Aged Payables', type: 'Operational', period: 'Weekly' },
            { name: 'VAT Return', type: 'Compliance', period: 'Monthly' },
            { name: 'Expense Analysis', type: 'Analytics', period: 'Monthly' },
        ]
    },
    {
        title: 'Sales Reports',
        icon: ShoppingCart,
        color: 'bg-violet-50 text-violet-600',
        reports: [
            { name: 'Sales Summary', type: 'Core', period: 'Monthly' },
            { name: 'Sales by Customer', type: 'Analytics', period: 'On Demand' },
            { name: 'Sales by Product', type: 'Analytics', period: 'On Demand' },
            { name: 'Pipeline Report', type: 'Operational', period: 'Weekly' },
            { name: 'Quotation Conversion', type: 'Analytics', period: 'Monthly' },
        ]
    },
    {
        title: 'Operations Reports',
        icon: Package,
        color: 'bg-blue-50 text-blue-600',
        reports: [
            { name: 'Project Progress', type: 'Operational', period: 'Weekly' },
            { name: 'Resource Utilization', type: 'Analytics', period: 'Monthly' },
            { name: 'Purchase Analysis', type: 'Operational', period: 'Monthly' },
            { name: 'Inventory Valuation', type: 'Core', period: 'Monthly' },
            { name: 'Stock Movement', type: 'Detail', period: 'On Demand' },
        ]
    },
    {
        title: 'HR Reports',
        icon: Users,
        color: 'bg-orange-50 text-orange-600',
        reports: [
            { name: 'Payroll Summary', type: 'Core', period: 'Monthly' },
            { name: 'Attendance Report', type: 'Operational', period: 'Daily / Monthly' },
            { name: 'Leave Balance', type: 'Operational', period: 'On Demand' },
            { name: 'Headcount Analysis', type: 'Analytics', period: 'Monthly' },
            { name: 'Cost per Employee', type: 'Analytics', period: 'Quarterly' },
        ]
    },
];

export default function ReportsPage() {
    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="reports">
                <div className="space-y-8 pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Analytics, insights, and compliance reports
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl font-semibold gap-2 text-xs">
                                <Filter className="h-3.5 w-3.5" />
                                Custom Report
                            </Button>
                            <Button variant="outline" className="rounded-xl font-semibold gap-2 text-xs">
                                <Calendar className="h-3.5 w-3.5" />
                                Schedule Reports
                            </Button>
                        </div>
                    </div>

                    {/* CEO Quick View */}
                    <Card className="rounded-3xl border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                            <div className="flex items-center gap-3 mb-3">
                                <Sparkles className="h-5 w-5" />
                                <h2 className="text-lg font-bold">CEO Dashboard Reports</h2>
                            </div>
                            <p className="text-sm text-primary-foreground/80 max-w-2xl">
                                Executive-level reports combining data from all modules. Get a holistic view of revenue, profitability, workforce, and operational efficiency.
                            </p>
                            <div className="flex gap-3 mt-4">
                                <Button size="sm" className="rounded-lg bg-white/20 hover:bg-white/30 text-white border-none font-semibold gap-1.5">
                                    <PieChart className="h-3.5 w-3.5" /> Business Overview
                                </Button>
                                <Button size="sm" className="rounded-lg bg-white/20 hover:bg-white/30 text-white border-none font-semibold gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" /> Growth Trends
                                </Button>
                                <Button size="sm" className="rounded-lg bg-white/20 hover:bg-white/30 text-white border-none font-semibold gap-1.5">
                                    <LineChart className="h-3.5 w-3.5" /> Cash Forecasting
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Report Categories */}
                    <div className="space-y-6">
                        {reportCategories.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <Card key={cat.title} className="rounded-3xl border-border/50">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", cat.color)}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                {cat.title}
                                            </CardTitle>
                                            <Badge variant="outline" className="rounded-full text-[10px] font-semibold">
                                                {cat.reports.length} reports
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {cat.reports.map(report => (
                                                <div
                                                    key={report.name}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">{report.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{report.period}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="outline" className={cn(
                                                            "rounded-full text-[9px] font-semibold hidden md:flex",
                                                            report.type === 'Core' ? "border-emerald-200 text-emerald-600" :
                                                                report.type === 'Analytics' ? "border-violet-200 text-violet-600" :
                                                                    report.type === 'Compliance' ? "border-amber-200 text-amber-600" :
                                                                        ""
                                                        )}>
                                                            {report.type}
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}