'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getOpportunities, getLeads, getActivities, getInvoices, getSalesOrders, getQuotes } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    TrendingUp, Users, Briefcase, Activity, Target, DollarSign,
    Zap, ShoppingCart, ArrowRight, FileText, CreditCard, UserPlus,
    Clock, CheckCircle2, AlertCircle, Plus, Receipt, ArrowUpRight,
    Package, ChevronRight, BarChart3, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity, Lead, Activity as ActivityType, Invoice } from '@/lib/db/types';
import { ModuleGuard } from '@/components/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LeadForm } from '@/components/sales/lead-form';
import { QuoteForm } from '@/components/sales/quote-form';

export default function SalesDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { getModuleLabel, companyProfile } = useTenant();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLeadOpen, setIsLeadOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);

    // Dynamic Currency Formatter
    const fmt = useCallback((n: number) => {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: companyProfile?.baseCurrency || 'AED',
            maximumFractionDigits: 0
        }).format(n);
    }, [companyProfile]);

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [oppsData, leadsData, activityData, invData, ordersData, quotesData] = await Promise.all([
                getOpportunities().catch(() => []),
                getLeads().catch(() => []),
                getActivities().catch(() => []),
                getInvoices().catch(() => []),
                getSalesOrders().catch(() => []),
                getQuotes().catch(() => []),
            ]);
            setOpportunities(oppsData || []);
            setLeads(leadsData || []);
            setActivities(activityData || []);
            setInvoices(invData || []);
            setSalesOrders(ordersData || []);
            setQuotes(quotesData || []);
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
        const activeQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
        
        return { 
            revenue, 
            pipelineValue, 
            winRate, 
            activeLeads: leads.length, 
            pendingInvoiceAmount, 
            invoiceCount: invoices.length, 
            activeQuotes 
        };
    }, [opportunities, leads, invoices, quotes]);

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{getModuleLabel('sales')}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Lead-to-Cash lifecycle management
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isLeadOpen} onOpenChange={setIsLeadOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-2">
                                        <UserPlus className="h-3.5 w-3.5" /> Lead
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                                    <LeadForm onSuccess={() => { setIsLeadOpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>
                            
                            <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-2">
                                        <FileText className="h-3.5 w-3.5" /> Quote
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                                    <QuoteForm onSuccess={() => { setIsQuoteOpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>

                            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push('/admin/invoices/new')}>
                                <Plus className="h-3.5 w-3.5" /> Invoice
                            </Button>
                        </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard 
                            title="Pipeline Value" 
                            value={fmt(stats.pipelineValue)} 
                            icon={TrendingUp} 
                            trend={stats.pipelineValue > 0 ? "Active" : "Inactive"} 
                            trendUp={stats.pipelineValue > 0} 
                        />
                        <MetricCard 
                            title="Total Revenue" 
                            value={fmt(stats.revenue)} 
                            icon={DollarSign} 
                            trend="YTD" 
                            trendUp={stats.revenue > 0} 
                        />
                        <MetricCard 
                            title="Win Rate" 
                            value={`${stats.winRate.toFixed(0)}%`} 
                            icon={Target} 
                            trend="Stable" 
                        />
                        <MetricCard 
                            title="Outstanding" 
                            value={fmt(stats.pendingInvoiceAmount)} 
                            icon={Clock} 
                            trend="Receivables" 
                            trendUp={false} 
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Pipeline Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border shadow-sm rounded-md overflow-hidden">
                                <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-sm font-bold">Pipeline Distribution</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary" asChild>
                                        <Link href="/admin/sales/opportunities">Full Pipeline <ChevronRight className="h-3 w-3 ml-1" /></Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border border-b">
                                        {[
                                            { stage: 'Prospecting', key: 'prospecting', color: 'bg-zinc-400' },
                                            { stage: 'Qualification', key: 'qualification', color: 'bg-zinc-600' },
                                            { stage: 'Proposal', key: 'proposal', color: 'bg-foreground' },
                                            { stage: 'Negotiation', key: 'negotiation', color: 'bg-primary' },
                                            { stage: 'Closed Won', key: 'closed_won', color: 'bg-emerald-500' },
                                        ].map(s => {
                                            const stageOpps = opportunities.filter(o => o.stage === s.key);
                                            const stageValue = stageOpps.reduce((sum, o) => sum + Number(o.amount), 0);
                                            return (
                                                <div key={s.key} className="p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <div className={cn("h-1 w-8 rounded-full mx-auto mb-3", s.color)} />
                                                    <p className="text-lg font-bold text-foreground leading-none">{stageOpps.length}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-2">{s.stage}</p>
                                                    <p className="text-[10px] font-black text-foreground mt-1">{fmt(stageValue)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="divide-y">
                                        {opportunities.length > 0 ? (
                                            opportunities.slice(0, 5).map(opp => (
                                                <div key={opp.id} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                                                            {opp.account?.name?.charAt(0) || 'O'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-foreground truncate">{opp.name}</p>
                                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{opp.account?.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-foreground">{fmt(Number(opp.amount))}</p>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest mt-1">{opp.stage.replace('_', ' ')}</Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Target className="h-6 w-6 text-muted-foreground/60" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground">No active opportunities</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Convert leads to build pipeline</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm rounded-md overflow-hidden">
                                <CardHeader className="border-b bg-muted/50 py-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Activity Log
                                    </CardTitle>
                                </CardHeader>
                                <div className="divide-y">
                                    {activities.length > 0 ? (
                                        activities.slice(0, 5).map(activity => (
                                            <div key={activity.id} className="flex gap-4 items-start p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-foreground truncate">{activity.subject}</p>
                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{activity.description}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="secondary" className="text-[8px] font-black px-1.5 h-4 bg-muted text-muted-foreground border-none">{activity.type}</Badge>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(activity.created_at).toLocaleDateString('en-AE')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No recent activities</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar Area */}
                        <div className="space-y-6">
                            <Card className="border-border shadow-sm bg-foreground text-card-foreground overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        Performance Note
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Quotations</p>
                                        <p className="text-2xl font-bold">{stats.activeQuotes}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conversion Rate</p>
                                        <p className="text-2xl font-bold text-emerald-400">{(stats.winRate * 0.8).toFixed(1)}%</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm rounded-md">
                                <CardHeader className="border-b bg-muted/50 py-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sales Terminal</CardTitle>
                                </CardHeader>
                                <div className="p-0 divide-y">
                                    {[
                                        { label: 'Leads Directory', href: '/admin/sales/leads', icon: UserPlus, count: leads.length },
                                        { label: 'Pipeline View', href: '/admin/sales/opportunities', icon: Target, count: opportunities.length },
                                        { label: 'Customer Base', href: '/admin/sales/customers', icon: Users },
                                        { label: 'Quotations Hub', href: '/admin/quotations', icon: FileText, count: quotes.length },
                                        { label: 'Revenue Invoices', href: '/admin/invoices', icon: Receipt, count: invoices.length },
                                    ].map((link, i) => (
                                        <Link 
                                            key={i} 
                                            href={link.href}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-foreground">{link.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {link.count !== undefined && (
                                                    <Badge variant="secondary" className="text-[8px] font-black h-4 px-1.5 min-w-4 flex items-center justify-center bg-muted text-muted-foreground border-none">{link.count}</Badge>
                                                )}
                                                <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: any) {
    return (
        <Card className="border shadow-sm rounded-md bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    trendUp ? "bg-emerald-50 text-emerald-600" : trendUp === false ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground"
                )}>
                    {trend}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="text-xl font-bold tracking-tight text-foreground">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
