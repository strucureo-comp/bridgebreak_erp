'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    BarChart3, PieChart, FileText, Download,
    DollarSign, Users, ShoppingCart, Package,
    TrendingUp, Calendar, Filter, ChevronRight,
    LineChart, ArrowRight, Sparkles, Activity,
    Search, Share2, Printer
} from 'lucide-react';
import { ModuleGuard } from '@/components/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';

export default function ReportsPage() {
    const { getModuleLabel } = useTenant();

    const reportCategories = [
        {
            title: getModuleLabel('finance'),
            icon: DollarSign,
            color: 'text-emerald-500',
            reports: [
                { name: 'Profit & Loss Statement', type: 'Fiscal', period: 'Quarterly Review' },
                { name: 'Balance Sheet', type: 'Fiscal', period: 'Real-time Sync' },
                { name: 'VAT / Tax Compliance', type: 'Statutory', period: '90 Day Window' },
                { name: 'Cash Flow Velocity', type: 'Analytics', period: 'Daily Pulse' },
            ]
        },
        {
            title: getModuleLabel('sales'),
            icon: ShoppingCart,
            color: 'text-rose-500',
            reports: [
                { name: 'Revenue Pipeline', type: 'Forecast', period: '12 Month Rolling' },
                { name: 'Customer Lifetime Value', type: 'Analytics', period: 'Annual' },
                { name: 'Sales Conversion Matrix', type: 'Performance', period: 'Weekly' },
            ]
        },
        {
            title: getModuleLabel('operations'),
            icon: Package,
            color: 'text-blue-500',
            reports: [
                { name: 'Project Resource Yield', type: 'Operational', period: 'Active Jobs' },
                { name: 'Supply Chain Efficiency', type: 'Logistics', period: 'Monthly' },
                { name: 'Inventory Valuation', type: 'Valuation', period: 'Live Stock' },
            ]
        },
        {
            title: getModuleLabel('hr'),
            icon: Users,
            color: 'text-orange-500',
            reports: [
                { name: 'Payroll Disbursement', type: 'Fiscal', period: 'Monthly' },
                { name: 'Workforce Attendance', type: 'Operational', period: 'Real-time' },
                { name: 'Performance Scoring', type: 'HRMS', period: 'Quarterly' },
            ]
        },
    ];

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="reports">
                <div className="space-y-6 pb-20">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">Intelligence Hub</h1>
                                <p className="text-[13px] text-muted-foreground font-medium">
                                    Strategic reporting and cross-module business analytics
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group mr-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input 
                                    placeholder="Search reports..." 
                                    className="h-9 w-56 pl-9 rounded-lg border border-border bg-card text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-[12px] font-semibold border-border">
                                <Filter className="h-3.5 w-3.5" /> Filters
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-[12px] font-semibold border-border">
                                <Calendar className="h-3.5 w-3.5" /> Schedule
                            </Button>
                        </div>
                    </div>

                    {/* Strategic Panel */}
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

                    {/* Report Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {reportCategories.map(cat => (
                            <Card key={cat.title} className="border-border shadow-sm rounded-xl overflow-hidden bg-card group hover:border-primary/50 transition-all duration-300">
                                <CardHeader className="border-b border-border bg-muted/30 py-4 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm", cat.color)}>
                                            <cat.icon size={20} />
                                        </div>
                                        <CardTitle className="text-[14px] font-bold text-foreground">{cat.title}</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black border-border bg-card">{cat.reports.length} VARIANTS</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {cat.reports.map(report => (
                                            <div
                                                key={report.name}
                                                className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all cursor-pointer group/item"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-muted-foreground/60 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-foreground group-hover/item:text-zinc-900">{report.name}</p>
                                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">{report.period}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="text-[9px] font-bold bg-muted text-muted-foreground border-none uppercase px-2">{report.type}</Badge>
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
                                            </div>
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
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}
