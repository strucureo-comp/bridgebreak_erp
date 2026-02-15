'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getOpportunities, getLeads, getActivities, getInvoices, getSalesOrders } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SalesContent } from '@/components/sales/sales-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import {
    LayoutGrid, TrendingUp, Users, Briefcase, Activity,
    DollarSign, Target, Zap, ShoppingCart, ArrowRight,
    FileText, CreditCard, ChevronRight, UserPlus,
    Clock, CheckCircle2, AlertCircle, Plus, Receipt,
    ArrowUpRight, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity, Lead, Activity as ActivityType, Invoice } from '@/lib/db/types';
import { ModuleGuard } from '@/components/layout/module-guard';

export default function SalesDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [oppsData, leadsData, activityData, invData, ordersData] = await Promise.all([
                getOpportunities().catch(() => []),
                getLeads().catch(() => []),
                getActivities().catch(() => []),
                getInvoices().catch(() => []),
                getSalesOrders().catch(() => []),
            ]);
            setOpportunities(oppsData || []);
            setLeads(leadsData || []);
            setActivities(activityData || []);
            setInvoices(invData || []);
            setSalesOrders(ordersData || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => {
        const wonOpps = opportunities.filter(o => o.stage === 'closed_won');
        const pipelineOpps = opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost');
        const revenue = wonOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const pipelineValue = pipelineOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const winRate = opportunities.length > 0 ? (wonOpps.length / opportunities.length) * 100 : 0;
        const pendingInvoiceAmount = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
        return { revenue, pipelineValue, winRate, activeLeads: leads.length, pendingInvoiceAmount, invoiceCount: invoices.length };
    }, [opportunities, leads, invoices]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val.toFixed(0)}`;
    };

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-8 pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Sales Hub</h1>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Lead-to-Cash Lifecycle: Leads, Quotes, Orders & Invoicing
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl font-semibold gap-2 text-xs" onClick={() => router.push('/admin/sales/leads/new')}>
                                <UserPlus className="h-3.5 w-3.5" /> New Lead
                            </Button>
                            <Button variant="outline" className="rounded-xl font-semibold gap-2 text-xs" onClick={() => router.push('/admin/quotations/new')}>
                                <Plus className="h-3.5 w-3.5" /> New Quotation
                            </Button>
                            <Button className="rounded-xl font-semibold gap-2 text-xs" onClick={() => router.push('/admin/invoices/new')}>
                                <Plus className="h-3.5 w-3.5" /> New Invoice
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SalesKPI title="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="emerald" />
                        <SalesKPI title="Pipeline Value" value={formatCurrency(stats.pipelineValue)} icon={TrendingUp} color="blue" />
                        <SalesKPI title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target} color="violet" />
                        <SalesKPI title="Active Leads" value={stats.activeLeads.toString()} icon={Zap} color="orange" />
                    </div>

                    {/* Main Tabs */}
                    <Tabs defaultValue="leads" className="space-y-6">
                        <TabsList className="rounded-2xl bg-background border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="overview" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <LayoutGrid className="h-3.5 w-3.5" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="leads" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <Users className="h-3.5 w-3.5" /> CRM: Leads
                            </TabsTrigger>
                            <TabsTrigger value="pipeline" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <Target className="h-3.5 w-3.5" /> CRM: Pipeline
                            </TabsTrigger>
                            <TabsTrigger value="quotations" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <FileText className="h-3.5 w-3.5" /> Quotations
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <Package className="h-3.5 w-3.5" /> Sales Orders
                            </TabsTrigger>
                            <TabsTrigger value="invoices" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                                <Receipt className="h-3.5 w-3.5" /> Invoices
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Activity Feed */}
                                <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {activities.slice(0, 5).map(activity => (
                                            <div key={activity.id} className="flex gap-3 items-start group p-2 rounded-xl hover:bg-muted/30 transition-colors">
                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 mt-0.5">
                                                    <Activity className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold truncate">{activity.subject}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                                                    <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{new Date(activity.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {activities.length === 0 && (
                                            <p className="text-muted-foreground text-sm text-center py-8">No recent activity recorded.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Top Deal + Quick Links */}
                                <div className="space-y-4">
                                    {/* Top Deal */}
                                    <Card className="rounded-3xl border-none bg-primary text-primary-foreground overflow-hidden relative">
                                        <Target className="absolute -right-4 -bottom-4 h-28 w-28 text-white/10" />
                                        <CardContent className="p-6 relative z-10 space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">Top Deal</p>
                                            <h3 className="text-xl font-bold">
                                                {opportunities.sort((a, b) => Number(b.amount) - Number(a.amount))[0]?.name || 'No Deals'}
                                            </h3>
                                            <p className="text-2xl font-bold text-emerald-300">
                                                {formatCurrency(Number(opportunities.sort((a, b) => Number(b.amount) - Number(a.amount))[0]?.amount || 0))}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Quick Links */}
                                    <Card className="rounded-3xl border-border/50">
                                        <CardContent className="p-4 space-y-1.5">
                                            {[
                                                { label: 'Leads', href: '/admin/sales/leads', icon: UserPlus, count: leads.length },
                                                { label: 'Customers', href: '/admin/sales/customers', icon: Users, count: null },
                                                { label: 'Quotations', href: '/admin/quotations', icon: FileText, count: null },
                                                { label: 'All Invoices', href: '/admin/invoices', icon: Receipt, count: invoices.length },
                                            ].map(link => (
                                                <Link key={link.label} href={link.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        <link.icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-medium flex-1">{link.label}</span>
                                                    {link.count !== null && (
                                                        <Badge variant="outline" className="rounded-full text-[9px] font-semibold">{link.count}</Badge>
                                                    )}
                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                </Link>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* CRM: Leads Tab */}
                        <TabsContent value="leads">
                            <LeadsTabContent leads={leads} />
                        </TabsContent>

                        {/* CRM: Pipeline Tab */}
                        <TabsContent value="pipeline" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-3 rounded-3xl border-border/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                Active Pipeline
                                            </CardTitle>
                                            <Link href="/admin/sales/opportunities" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                                                View All <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Pipeline stages */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                            {[
                                                { stage: 'Prospecting', key: 'prospecting', color: 'bg-blue-500' },
                                                { stage: 'Qualification', key: 'qualification', color: 'bg-indigo-500' },
                                                { stage: 'Proposal', key: 'proposal', color: 'bg-violet-500' },
                                                { stage: 'Negotiation', key: 'negotiation', color: 'bg-amber-500' },
                                                { stage: 'Closed Won', key: 'closed_won', color: 'bg-emerald-500' },
                                            ].map(s => {
                                                const stageOpps = opportunities.filter(o => o.stage === s.key);
                                                const stageValue = stageOpps.reduce((sum, o) => sum + Number(o.amount), 0);
                                                return (
                                                    <div key={s.key} className="p-4 rounded-2xl bg-muted/30 text-center space-y-1">
                                                        <div className={cn("h-2.5 w-2.5 rounded-full mx-auto mb-2", s.color)} />
                                                        <p className="text-lg font-bold">{stageOpps.length}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground">{s.stage}</p>
                                                        <p className="text-xs font-semibold text-muted-foreground/70">{formatCurrency(stageValue)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Opportunity list */}
                                        <div className="space-y-2">
                                            {opportunities.slice(0, 6).map(opp => (
                                                <div key={opp.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                                                            <Briefcase className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">{opp.name}</p>
                                                            <p className="text-[10px] text-muted-foreground capitalize">{opp.stage?.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold shrink-0">{formatCurrency(Number(opp.amount))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Quotations Tab */}
                        <TabsContent value="quotations" className="space-y-6">
                            <SalesContent />
                        </TabsContent>

                        {/* Sales Orders Tab */}
                        <TabsContent value="orders">
                            <SalesOrdersTabContent orders={salesOrders} />
                        </TabsContent>

                        {/* Invoices Tab Content remains same */}
                        <TabsContent value="invoices" className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <MiniKPI label="Total Billed" value={formatCurrency(invoices.reduce((s, i) => s + Number(i.amount), 0))} icon={FileText} />
                                <MiniKPI label="Paid" value={formatCurrency(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0))} icon={CheckCircle2} />
                                <MiniKPI label="Outstanding" value={formatCurrency(stats.pendingInvoiceAmount)} icon={Clock} />
                                <MiniKPI label="Overdue" value={invoices.filter(i => i.status === 'overdue').length.toString()} icon={AlertCircle} />
                            </div>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-bold">Recent Invoices</CardTitle>
                                        <Link href="/admin/invoices" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                                            View All <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {invoices.slice(0, 8).map(inv => (
                                            <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 hover:border-primary/30 transition-all group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "h-2.5 w-2.5 rounded-full shrink-0",
                                                        inv.status === 'paid' ? 'bg-emerald-500' : inv.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                                                    )} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate">{inv.invoice_number}</p>
                                                        <p className="text-[10px] text-muted-foreground">{inv.project?.title || 'General'} • Due {new Date(inv.due_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge className={cn(
                                                        "rounded-full text-[9px] font-semibold border-none",
                                                        inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                            inv.status === 'overdue' ? "bg-red-50 text-red-600" :
                                                                "bg-amber-50 text-amber-600"
                                                    )}>{inv.status}</Badge>
                                                    <span className="text-sm font-bold">${Number(inv.amount).toLocaleString()}</span>
                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function LeadsTabContent({ leads }: { leads: Lead[] }) {
    const router = useRouter();
    return (
        <Card className="rounded-3xl border-border/50 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold">Leads Management</CardTitle>
                        <CardDescription className="font-medium text-xs">Track potential customers and initial engagement</CardDescription>
                    </div>
                    <Button size="sm" className="rounded-xl font-bold gap-2" onClick={() => router.push('/admin/sales/leads/new')}>
                        <Plus className="h-3.5 w-3.5" /> Add Lead
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/20">
                        <TableRow>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Name</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Company</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Source</TableHead>
                            <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-wider">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="px-6 font-semibold">{lead.first_name} {lead.last_name}</TableCell>
                                <TableCell className="px-6 text-sm">{lead.company || '-'}</TableCell>
                                <TableCell className="px-6">
                                    <Badge variant="outline" className={cn(
                                        "capitalize text-[10px] font-bold rounded-lg border-none",
                                        lead.status === 'new' ? 'bg-blue-50 text-blue-600' : 
                                        lead.status === 'qualified' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100'
                                    )}>{lead.status}</Badge>
                                </TableCell>
                                <TableCell className="px-6 text-xs text-muted-foreground">{lead.source}</TableCell>
                                <TableCell className="px-6 text-right">
                                    <Button variant="outline" size="sm" className="rounded-lg text-[10px] font-bold h-7" onClick={() => router.push(`/admin/sales/opportunities/new?lead_id=${lead.id}`)}>
                                        Qualify <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {leads.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No leads found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SalesOrdersTabContent({ orders }: { orders: any[] }) {
    const router = useRouter();
    return (
        <Card className="rounded-3xl border-border/50 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold">Sales Orders</CardTitle>
                        <CardDescription className="font-medium text-xs">Confirmed orders ready for execution and billing</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/20">
                        <TableRow>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Order #</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Customer</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Amount</TableHead>
                            <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-wider">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length > 0 ? orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="px-6 font-bold text-primary">{order.number}</TableCell>
                                <TableCell className="px-6 font-semibold">{order.account?.name}</TableCell>
                                <TableCell className="px-6 font-bold">${Number(order.total_amount).toLocaleString()}</TableCell>
                                <TableCell className="px-6">
                                    <Badge variant="outline" className={cn(
                                        "capitalize text-[10px] font-bold rounded-lg border-none",
                                        order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                    )}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    <Button size="sm" variant="secondary" className="rounded-xl h-8 px-3 text-[10px] font-bold" onClick={() => router.push(`/admin/invoices/new?order_id=${order.id}`)}>
                                        Generate Invoice
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No sales orders found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SalesKPI({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        orange: "bg-orange-50 text-orange-600",
    };
    return (
        <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", variants[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            </CardContent>
        </Card>
    );
}

function MiniKPI({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card className="rounded-2xl border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}