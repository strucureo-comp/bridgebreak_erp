'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getOpportunities, getLeads } from '@/lib/api';
import { getSalesInvoices, getSalesQuotations, getProformaInvoices, getDeliveryNotes } from '@/lib/services/business-documents-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    TrendingUp, Users, Target, DollarSign,
    ShoppingCart, FileText, UserPlus,
    Clock, Plus, Receipt,
    ArrowUpRight, BarChart3, Briefcase, ChevronRight, Truck, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity, Lead, Invoice } from '@/lib/db/types';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';
import { formatCurrency } from '@/lib/utils/currency';

const isToday = (date: string) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
};

const isOverdue = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
};

export default function SalesDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { getModuleLabel, companyProfile } = useTenant();
    const { baseCurrency } = useCompanySettings();
    
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [proformas, setProformas] = useState<any[]>([]);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Check if B2B/B2C based on company profile settings
    const isRetail = companyProfile?.businessType === 'b2c_retail';

    const fmt = useCallback((n: number) => {
        return formatCurrency(n, baseCurrency, { compact: true });
    }, [baseCurrency]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        fetchData();
    }, [authLoading, user, baseCurrency]); // Reload on currency change if needed

    const fetchData = async () => {
        try {
            setLoading(true);
            const [oppsData, leadsData, invData, quotesData, proformaData, deliveryData] = await Promise.all([
                getOpportunities().catch(() => []),
                getLeads().catch(() => []),
                getSalesInvoices().catch(() => []),
                getSalesQuotations().catch(() => []),
                getProformaInvoices().catch(() => []),
                getDeliveryNotes().catch(() => []),
            ]);
            setOpportunities((oppsData as any) || []);
            setLeads(leadsData || []);
            setInvoices(invData || []);
            setQuotes(quotesData || []);
            setProformas(proformaData || []);
            setDeliveries(deliveryData || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => {
        const wonOpps = opportunities.filter(o => o.stage === 'won');
        const pipelineOpps = opportunities.filter(o => o.stage !== 'won' && o.stage !== 'lost');
        const revenue = wonOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const pipelineValue = pipelineOpps.reduce((sum, o) => sum + Number(o.amount), 0);
        const winRate = opportunities.length > 0 ? (wonOpps.length / opportunities.length) * 100 : 0;
        
        // Count all non-completed and non-rejected invoices as "pending"
        const pendingInvoiceAmount = invoices
            .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== ('rejected' as any))
            .reduce((s, i) => s + Number(i.amount || 0), 0);
        
        const activeQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'pending_approval' || q.status === 'approved').length;
        const activeProformas = proformas.filter(p => p.status !== 'completed' && p.status !== 'rejected').length;
        const pendingDeliveries = deliveries.filter(d => d.status !== 'completed' && d.status !== 'rejected').length;

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
            activeProformas,
            pendingDeliveries,
            followUpsToday,
            overdueFollowUps
        };
    }, [opportunities, leads, invoices, quotes]);

    return (
        <ModuleGuard module="sales">
            {loading ? (
                <div className="space-y-6 max-w-6xl animate-pulse">
                    <div>
                        <div className="h-8 w-48 bg-muted rounded mb-2" />
                        <div className="h-4 w-64 bg-muted rounded" />
                    </div>
                </div>
            ) : (
                <div className="space-y-6 max-w-6xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">{getModuleLabel('sales')}</h1>
                            <p className="text-muted-foreground">Manage your commercial pipeline, leads, and revenue stream.</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3">
                            <Button onClick={() => router.push('/admin/sales/quotations')} size="sm" variant="secondary" className="gap-2">
                                <Plus className="h-4 w-4" /> New Quotation
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2" onClick={() => router.push('/admin/sales/invoices')}>
                                <Receipt className="h-4 w-4" /> New Invoice
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats: Clear KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        <MetricCard key="revenue" title="Total Revenue (Won)" value={fmt(stats.revenue)} trend="Confirmed" />
                        <MetricCard key="pipeline" title="Pipeline Value" value={fmt(stats.pipelineValue)} trend="In Progress" />
                        <MetricCard key="leads" title="Active Leads" value={stats.activeLeads.toString()} trend="To Contact" />
                        <MetricCard key="invoices" title="Pending Invoices" value={fmt(stats.pendingInvoiceAmount)} trend="Unpaid" />
                        <MetricCard key="proformas" title="Active Proformas" value={stats.activeProformas.toString()} trend="Open" />
                        <MetricCard key="deliveries" title="Pending Deliveries" value={stats.pendingDeliveries.toString()} trend="Pending" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                        <Link href="/admin/sales/quotations">View All</Link>
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
                                                        <p className="font-bold text-sm">{q.number || q.quote_number}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{q.customerName || q.account?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">{fmt(Number(q.total || q.total_amount))}</p>
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
                                    <Link href="/admin/sales/invoices" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Receipt className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Sales Invoices</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                    <Link href="/admin/sales/quotations" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><FileText className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Quotations</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                    <Link href="/admin/sales/proforma" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Receipt className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Proforma Invoices</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                    <Link href="/admin/sales/delivery-notes" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border border-border rounded-md bg-background shadow-sm"><Truck className="h-4 w-4" /></div>
                                            <span className="font-bold text-sm">Delivery Notes</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </div>
            )}
        </ModuleGuard>
    );
}

function MetricCard({ title, value, trend }: { title: string, value: string, trend: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}
