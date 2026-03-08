'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getOpportunities, getLeads, getInvoices, getQuotes } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    TrendingUp, Users, Target, DollarSign,
    ShoppingCart, FileText, UserPlus,
    Clock, Plus, Receipt,
    ArrowUpRight, BarChart3, Briefcase, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity, Lead, Invoice } from '@/lib/db/types';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';

function isOverdue(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d < today && d.toDateString() !== today.toDateString();
}

function isToday(dateStr: string) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

export default function SalesDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { getModuleLabel, companyProfile } = useTenant();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Check if B2B/B2C based on company profile settings
    const isRetail = companyProfile?.businessType === 'b2c_retail';

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
            const [oppsData, leadsData, invData, quotesData] = await Promise.all([
                getOpportunities().catch(() => []),
                getLeads().catch(() => []),
                getInvoices().catch(() => []),
                getQuotes().catch(() => []),
            ]);
            setOpportunities((oppsData as any) || []);
            setLeads(leadsData || []);
            setInvoices(invData || []);
            setQuotes(quotesData || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => {
        const wonOpps = opportunities.filter(o => o.stage === 'won');
        const pipelineOpps = opportunities.filter(o => o.stage !== 'won' && o.stage !== 'lost');
        const revenue = wonOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const pipelineValue = pipelineOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const winRate = opportunities.length > 0 ? (wonOpps.length / opportunities.length) * 100 : 0;
        const pendingInvoiceAmount = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
        const activeQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;

        const followUpsToday = opportunities.flatMap(o => o.followUps || []).filter(f => f.status === 'Pending' && isToday(f.scheduledAt)).length;
        const overdueFollowUps = opportunities.flatMap(o => o.followUps || []).filter(f => f.status === 'Missed' || (f.status === 'Pending' && isOverdue(f.scheduledAt))).length;

        return {
            revenue,
            pipelineValue,
            winRate,
            activeLeads: leads.length,
            pendingInvoiceAmount,
            invoiceCount: invoices.length,
            activeQuotes,
            followUpsToday,
            overdueFollowUps
        };
    }, [opportunities, leads, invoices, quotes]);

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-8 max-w-6xl mx-auto pb-12">

                    {/* Header: Simple & Clear */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">{getModuleLabel('sales')}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Commercial Pipeline</span>
                                <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                                    Revenue Stream
                                </Badge>
                            </div>
                        </div>

                        {/* Quick Actions — Lead button removed, only Quotation & Invoice */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={() => router.push('/admin/finance/quotations/new')} size="sm" variant="secondary" className="h-10 gap-2 font-bold shadow-sm">
                                <Plus className="h-4 w-4" /> New Quotation
                            </Button>

                            <Button size="sm" variant="outline" className="h-10 gap-2 font-bold shadow-sm" onClick={() => router.push('/admin/finance/invoices/new')}>
                                <Receipt className="h-4 w-4" /> New Invoice
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats: Clear KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MetricCard key="revenue" title="Total Revenue (Won)" value={fmt(stats.revenue)} trend="Confirmed" />
                        {!isRetail && (
                            <MetricCard key="pipeline" title="Pipeline Value" value={fmt(stats.pipelineValue)} trend="In Progress" />
                        )}
                        <MetricCard key="leads" title="Active Leads" value={stats.activeLeads.toString()} trend="To Contact" />
                        <MetricCard key="invoices" title="Pending Invoices" value={fmt(stats.pendingInvoiceAmount)} trend="Unpaid" />
                        <Card key="followups" className="border-border shadow-sm bg-orange-500/5">
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Follow-ups Today</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 pt-0"><div className="text-2xl font-black text-foreground">{stats.followUpsToday}</div></CardContent>
                        </Card>
                        <Card key="overdue" className="border-red-500/30 shadow-sm bg-red-500/5">
                            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Overdue Actions</CardTitle></CardHeader>
                            <CardContent className="px-4 pb-4 pt-0"><div className="text-2xl font-black text-foreground">{stats.overdueFollowUps}</div></CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* LEFT COLUMN */}
                        <div className="space-y-8">

                            {!isRetail && (
                                <Card className="border-border shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
                                        <CardTitle className="text-base font-bold">Active Opportunities</CardTitle>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" asChild>
                                            <Link href="/admin/sales/opportunities">View All</Link>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {opportunities.length === 0 ? (
                                            <div className="p-8 text-center text-sm text-muted-foreground">No active opportunities.</div>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {opportunities.slice(0, 5).map((opp, idx) => (
                                                    <div key={opp.id || (opp as any)._id || `opp-${idx}`} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-sm">{opp.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{opp.account?.name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-sm">{fmt(Number(opp.amount))}</p>
                                                            <Badge variant="secondary" className="mt-1 text-[10px]">{opp.stage?.replace('_', ' ')}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent Leads Merged into Opportunities */}
                            {!isRetail && leads.length > 0 && (
                                <Card className="border-border shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
                                        <CardTitle className="text-base font-bold">Recent Leads</CardTitle>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" asChild>
                                            <Link href="/admin/sales/opportunities">View Pipeline</Link>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {leads.length === 0 ? (
                                            <div className="p-8 text-center text-sm text-muted-foreground">No recent leads.</div>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {leads.slice(0, 4).map((lead, idx) => (
                                                    <div key={lead.id || (lead as any)._id || `lead-${idx}`} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-sm">{lead.first_name} {lead.last_name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{lead.company}</p>
                                                        </div>
                                                        <Badge className="bg-primary/10 text-primary border-none text-[10px]">{lead.status?.replace('_', ' ')}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-8">

                            <Card className="border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
                                    <CardTitle className="text-base font-bold">Recent Quotes</CardTitle>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" asChild>
                                        <Link href="/admin/finance/quotations">View All</Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {quotes.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-muted-foreground">No recent quotes.</div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {quotes.slice(0, 5).map((q, idx) => (
                                                <div key={q.id || q._id || `quote-${idx}`} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-sm">{q.quote_number}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{q.account?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">{fmt(Number(q.total_amount))}</p>
                                                        <Badge variant="outline" className="mt-1 text-[10px]">{q.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
                                    <CardTitle className="text-base font-bold">Quick Navigation</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 divide-y divide-border">
                                    <Link href="/admin/sales/opportunities" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Target className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Opportunities & Leads Pipeline</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                    <Link href="/admin/sales/customers" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Users className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Customer Details</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                    <Link href="/admin/finance/invoices" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Receipt className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">All Invoices</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                </CardContent>
                            </Card>

                        </div>

                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function MetricCard({ title, value, trend }: { title: string, value: string, trend: string }) {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground bg-muted inline-block px-2 py-0.5 rounded-md">
                    {trend}
                </div>
            </CardContent>
        </Card>
    );
}
