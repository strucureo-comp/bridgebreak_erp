'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getProjects, getInvoices, getTransactions, getEmployees } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import type { Project, Invoice, Transaction, Employee } from '@/lib/db/types';
import Link from 'next/link';
import {
    TrendingUp, TrendingDown, DollarSign, Users, FolderKanban,
    BarChart3, ArrowUpRight, ArrowDownRight, ChevronRight,
    RefreshCcw, Calendar, Banknote, Receipt, ShoppingCart,
    Package, Clock, AlertCircle, CheckCircle2, Zap,
    Building2, Target, PieChart, Activity, CreditCard,
    Loader2, Settings, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [proj, inv, tx, emps] = await Promise.all([
                getProjects().catch(() => []),
                getInvoices().catch(() => []),
                getTransactions().catch(() => []),
                getEmployees().catch(() => []),
            ]);
            setProjects(proj || []);
            setInvoices(inv || []);
            setTransactions(tx || []);
            setEmployees(emps || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const profit = revenue - expenses;
        const pendingInvoices = invoices.filter(i => i.status === 'pending');
        const outstandingReceivables = pendingInvoices.reduce((s, i) => s + Number(i.amount), 0);
        const activeProjects = projects.filter(p => ['accepted', 'in_progress'].includes(p.status));
        const activeEmployees = employees.filter(e => e.status === 'active');

        return {
            revenue,
            expenses,
            profit,
            profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
            outstandingReceivables,
            pendingInvoiceCount: pendingInvoices.length,
            activeProjectCount: activeProjects.length,
            totalProjectCount: projects.length,
            completedProjectCount: projects.filter(p => p.status === 'completed').length,
            employeeCount: activeEmployees.length,
            totalPayroll: activeEmployees.reduce((s, e) => s + Number(e.basic_salary || 0), 0),
        };
    }, [projects, invoices, transactions, employees]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold text-muted-foreground">Loading Dashboard...</p>
                </div>
            </DashboardShell>
        );
    }

    const greeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val.toFixed(0)}`;
    };

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {greeting()}, {user?.full_name?.split(' ')[0]}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1.5 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> All systems normal
                        </Badge>
                        <Button variant="outline" size="sm" onClick={fetchData} className="rounded-lg gap-1.5 text-xs font-semibold">
                            <RefreshCcw className="h-3 w-3" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* CEO KPIs - Top Level */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <CEOMetricCard
                        title="Revenue"
                        value={formatCurrency(stats.revenue)}
                        icon={DollarSign}
                        trend="+12.5%"
                        trendUp={true}
                        subtitle="Total paid invoices"
                        color="emerald"
                    />
                    <CEOMetricCard
                        title="Profit"
                        value={formatCurrency(stats.profit)}
                        icon={TrendingUp}
                        trend={`${stats.profitMargin}% margin`}
                        trendUp={stats.profit > 0}
                        subtitle="Revenue - Expenses"
                        color="blue"
                    />
                    <CEOMetricCard
                        title="Expenses"
                        value={formatCurrency(stats.expenses)}
                        icon={Receipt}
                        trend="-3.2%"
                        trendUp={false}
                        subtitle="Total expenditure"
                        color="amber"
                    />
                    <CEOMetricCard
                        title="Cash Position"
                        value={formatCurrency(stats.revenue - stats.expenses)}
                        icon={Banknote}
                        trend="Net position"
                        trendUp={stats.profit > 0}
                        subtitle="Available funds"
                        color="violet"
                    />
                </div>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SecondaryKPI icon={CreditCard} label="Outstanding Receivables" value={formatCurrency(stats.outstandingReceivables)} badge={`${stats.pendingInvoiceCount} pending`} />
                    <SecondaryKPI icon={FolderKanban} label="Active Projects" value={stats.activeProjectCount.toString()} badge={`${stats.totalProjectCount} total`} />
                    <SecondaryKPI icon={Users} label="Headcount" value={stats.employeeCount.toString()} badge="Active staff" />
                    <SecondaryKPI icon={DollarSign} label="Payroll Cost" value={formatCurrency(stats.totalPayroll)} badge="Monthly" />
                </div>

                {/* Department Dashboards */}
                <Tabs defaultValue="finance" className="space-y-6">
                    <TabsList className="rounded-2xl bg-background border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                        <TabsTrigger value="finance" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                            <DollarSign className="h-3.5 w-3.5" /> Finance
                        </TabsTrigger>
                        <TabsTrigger value="sales" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                            <ShoppingCart className="h-3.5 w-3.5" /> Sales
                        </TabsTrigger>
                        <TabsTrigger value="operations" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                            <Package className="h-3.5 w-3.5" /> Operations
                        </TabsTrigger>
                        <TabsTrigger value="hr" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                            <Users className="h-3.5 w-3.5" /> HR
                        </TabsTrigger>
                    </TabsList>

                    {/* Finance Department */}
                    <TabsContent value="finance" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Financial Health
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <HealthBar label="Revenue Target" percent={75} color="bg-emerald-500" />
                                        <HealthBar label="Expense Control" percent={82} color="bg-blue-500" />
                                        <HealthBar label="Cash Flow" percent={68} color="bg-violet-500" />
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-bold mb-3">Compliance Status</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { name: 'GST/VAT', status: 'compliant' },
                                                { name: 'TDS', status: 'compliant' },
                                                { name: 'PF/ESI', status: 'pending' },
                                                { name: 'Returns', status: 'upcoming' },
                                            ].map(item => (
                                                <div key={item.name} className={cn(
                                                    "flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold",
                                                    item.status === 'compliant' ? "bg-emerald-50 text-emerald-700" :
                                                        item.status === 'pending' ? "bg-amber-50 text-amber-700" :
                                                            "bg-blue-50 text-blue-700"
                                                )}>
                                                    {item.status === 'compliant' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                                        item.status === 'pending' ? <AlertCircle className="h-3.5 w-3.5" /> :
                                                            <Clock className="h-3.5 w-3.5" />}
                                                    {item.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-primary" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'View Finance Hub', href: '/admin/finance', icon: DollarSign },
                                        { label: 'P&L Statement', href: '/admin/finance', icon: BarChart3 },
                                        { label: 'Balance Sheet', href: '/admin/finance', icon: Building2 },
                                        { label: 'Outstanding Invoices', href: '/admin/invoices', icon: Receipt },
                                    ].map(action => (
                                        <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <action.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium flex-1">{action.label}</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Sales Department */}
                    <TabsContent value="sales" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        Sales Pipeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { stage: 'Leads', count: 0, color: 'bg-blue-500' },
                                            { stage: 'Quotes', count: 0, color: 'bg-violet-500' },
                                            { stage: 'Orders', count: 0, color: 'bg-amber-500' },
                                            { stage: 'Revenue', count: formatCurrency(stats.revenue), color: 'bg-emerald-500' },
                                        ].map(item => (
                                            <div key={item.stage} className="text-center p-4 rounded-2xl bg-muted/30">
                                                <div className={cn("h-3 w-3 rounded-full mx-auto mb-2", item.color)} />
                                                <p className="text-lg font-bold">{item.count}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{item.stage}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-bold mb-3">Conversion Metrics</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <HealthBar label="Lead → Quote" percent={40} color="bg-blue-500" />
                                            <HealthBar label="Quote → Order" percent={65} color="bg-violet-500" />
                                            <HealthBar label="Order → Revenue" percent={85} color="bg-emerald-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold">Recent Invoices</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {invoices.slice(0, 4).map(inv => (
                                        <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full shrink-0",
                                                inv.status === 'paid' ? 'bg-emerald-500' :
                                                    inv.status === 'pending' ? 'bg-amber-500' :
                                                        'bg-red-500'
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{inv.invoice_number}</p>
                                                <p className="text-[10px] text-muted-foreground capitalize">{inv.status}</p>
                                            </div>
                                            <span className="text-xs font-bold">${Number(inv.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {invoices.length === 0 && (
                                        <p className="text-center text-xs text-muted-foreground py-4">No invoices yet</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Operations Department */}
                    <TabsContent value="operations" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-primary" />
                                        Project Health Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'In Progress', count: projects.filter(p => p.status === 'in_progress').length, color: 'bg-blue-500' },
                                            { label: 'Pending', count: projects.filter(p => p.status === 'pending').length, color: 'bg-amber-500' },
                                            { label: 'Completed', count: stats.completedProjectCount, color: 'bg-emerald-500' },
                                            { label: 'Total', count: stats.totalProjectCount, color: 'bg-slate-500' },
                                        ].map(item => (
                                            <div key={item.label} className="p-4 rounded-2xl bg-muted/30 text-center">
                                                <div className={cn("h-3 w-3 rounded-full mx-auto mb-2", item.color)} />
                                                <p className="text-xl font-bold">{item.count}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {projects.length > 0 && (
                                        <div className="border-t pt-4 space-y-2">
                                            <h4 className="text-sm font-bold">Active Projects</h4>
                                            {projects.filter(p => ['in_progress', 'accepted'].includes(p.status)).slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <FolderKanban className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-semibold">{p.title}</span>
                                                    </div>
                                                    <Badge className="bg-blue-50 text-blue-600 border-none rounded-full text-[10px] font-semibold">
                                                        {p.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Package className="h-4 w-4 text-primary" />
                                        Inventory Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        { label: 'Products', value: '—', icon: Package },
                                        { label: 'Low Stock', value: '—', icon: AlertCircle },
                                        { label: 'Pending POs', value: '—', icon: ShoppingCart },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                                            <item.icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm flex-1">{item.label}</span>
                                            <span className="text-sm font-bold">{item.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* HR Department */}
                    <TabsContent value="hr" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        Workforce Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 text-center">
                                            <p className="text-xl font-bold">{stats.employeeCount}</p>
                                            <p className="text-xs text-muted-foreground font-medium">Active Staff</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/30 text-center">
                                            <p className="text-xl font-bold">—</p>
                                            <p className="text-xs text-muted-foreground font-medium">Departments</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/30 text-center">
                                            <p className="text-xl font-bold">—</p>
                                            <p className="text-xs text-muted-foreground font-medium">On Leave</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/30 text-center">
                                            <p className="text-xl font-bold">{formatCurrency(stats.totalPayroll)}</p>
                                            <p className="text-xs text-muted-foreground font-medium">Payroll Cost</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-bold mb-3">Department-wise Headcount</h4>
                                        <div className="space-y-2">
                                            {[
                                                { dept: 'Engineering', count: Math.floor(stats.employeeCount * 0.5), pct: 50 },
                                                { dept: 'Operations', count: Math.floor(stats.employeeCount * 0.25), pct: 25 },
                                                { dept: 'Sales', count: Math.floor(stats.employeeCount * 0.15), pct: 15 },
                                                { dept: 'Administration', count: Math.floor(stats.employeeCount * 0.1), pct: 10 },
                                            ].map(dept => (
                                                <div key={dept.dept} className="flex items-center gap-3">
                                                    <span className="text-xs font-semibold w-28">{dept.dept}</span>
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${dept.pct}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold w-8 text-right">{dept.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold">HR Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'View HR Module', href: '/admin/hr', icon: Users },
                                        { label: 'Run Payroll', href: '/admin/hr', icon: DollarSign },
                                        { label: 'Attendance Today', href: '/admin/hr', icon: Clock },
                                        { label: 'Pending Leaves', href: '/admin/hr', icon: Calendar },
                                    ].map(action => (
                                        <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <action.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium flex-1">{action.label}</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Module Quick Access */}
                <Card className="rounded-3xl border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Quick Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {[
                                { label: 'System Hub', icon: Settings, href: '/admin/settings', color: 'bg-slate-100 text-slate-600' },
                                { label: 'Finance', icon: DollarSign, href: '/admin/finance', color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Sales', icon: ShoppingCart, href: '/admin/sales', color: 'bg-violet-50 text-violet-600' },
                                { label: 'Operations', icon: Package, href: '/admin/operations', color: 'bg-blue-50 text-blue-600' },
                                { label: 'HR', icon: Users, href: '/admin/hr', color: 'bg-orange-50 text-orange-600' },
                                { label: 'Masters', icon: Database, href: '/admin/masters', color: 'bg-cyan-50 text-cyan-600' },
                            ].map(item => (
                                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2.5 p-4 rounded-2xl hover:shadow-md transition-all duration-200 group cursor-pointer border border-border/30 hover:border-primary/30">
                                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}

function CEOMetricCard({ title, value, icon: Icon, trend, trendUp, subtitle, color }: {
    title: string; value: string; icon: React.ComponentType<{ className?: string }>;
    trend: string; trendUp: boolean; subtitle: string; color: string
}) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
    };
    return (
        <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", colors[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                        "flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5",
                        trendUp ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                    )}>
                        {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trend}
                    </span>
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    <p className="text-[10px] text-muted-foreground">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function SecondaryKPI({ icon: Icon, label, value, badge }: {
    icon: React.ComponentType<{ className?: string }>; label: string; value: string; badge: string
}) {
    return (
        <Card className="rounded-2xl border-border/50">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">{label}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[9px] font-semibold shrink-0">{badge}</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function HealthBar({ label, percent, color }: { label: string; percent: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs font-bold">{percent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}