'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    TrendingUp, ChevronLeft, Search, Users, FileText,
    AlertTriangle, CheckCircle2, Clock, ArrowUpRight, DollarSign, ShieldAlert
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const CUSTOMERS = [
    { id: 'C001', name: 'Al Futtaim Group', creditLimit: 500000, balance: 127000, overdue: 0, currency: 'AED', risk: 'low' },
    { id: 'C002', name: 'Dubai Holdings', creditLimit: 1000000, balance: 48500, overdue: 0, currency: 'AED', risk: 'low' },
    { id: 'C003', name: 'Emaar Properties', creditLimit: 750000, balance: 233200, overdue: 33200, currency: 'AED', risk: 'medium' },
    { id: 'C004', name: 'ADNOC Distribution', creditLimit: 300000, balance: 91600, overdue: 0, currency: 'AED', risk: 'low' },
    { id: 'C005', name: 'Etisalat Corporation', creditLimit: 200000, balance: 42000, overdue: 42000, currency: 'AED', risk: 'high' },
];

const INVOICES = [
    { id: 'INV-1048', customer: 'Al Futtaim Group', amount: 127000, due: '2026-03-15', status: 'sent', daysOut: 0 },
    { id: 'INV-1047', customer: 'Emaar Properties', amount: 33200, due: '2026-01-31', status: 'overdue', daysOut: 23 },
    { id: 'INV-1046', customer: 'Dubai Holdings', amount: 48500, due: '2026-03-10', status: 'sent', daysOut: 0 },
    { id: 'INV-1045', customer: 'ADNOC Distribution', amount: 91600, due: '2026-03-20', status: 'draft', daysOut: 0 },
    { id: 'INV-1044', customer: 'Etisalat Corporation', amount: 42000, due: '2026-02-01', status: 'overdue', daysOut: 22 },
    { id: 'INV-1043', customer: 'Al Futtaim Group', amount: 64000, due: '2026-02-28', status: 'partial', daysOut: 0 },
    { id: 'INV-1042', customer: 'Dubai Holdings', amount: 210000, due: '2026-02-15', status: 'paid', daysOut: 0 },
];

const CREDIT_NOTES = [
    { id: 'CN-0012', customer: 'Emaar Properties', amount: 8200, date: '2026-02-10', reason: 'Pricing adjustment', status: 'applied' },
    { id: 'CN-0011', customer: 'Al Futtaim Group', amount: 3500, date: '2026-01-28', reason: 'Defective goods return', status: 'applied' },
];

const AGING = { current: 267100, d30: 112500, d60: 42000, d90: 33200, d120Plus: 0 };

export default function AccountsReceivablePage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('overview');
    const [search, setSearch] = useState('');

    const totalReceivable = CUSTOMERS.reduce((s, c) => s + c.balance, 0);
    const totalOverdue = CUSTOMERS.reduce((s, c) => s + c.overdue, 0);
    const overdueCount = INVOICES.filter(i => i.status === 'overdue').length;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Accounts Receivable</h1>
                            <p className="text-[11px] text-muted-foreground">Customer Ledger · Aging · Credit Notes · Revenue Recognition</p>
                        </div>
                    </div>
                    {overdueCount > 0 && <Badge variant="destructive" className="text-[9px]">{overdueCount} Overdue</Badge>}
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                    <SmallKpi label="Total Receivable" value={fmt(totalReceivable)} />
                    <SmallKpi label="Overdue" value={fmt(totalOverdue)} alert />
                    <SmallKpi label="Current (0-30)" value={fmt(AGING.current)} />
                    <SmallKpi label="31-60 Days" value={fmt(AGING.d30)} />
                    <SmallKpi label="61-90 Days" value={fmt(AGING.d60)} warn />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="overview" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Customer Ledger</TabsTrigger>
                        <TabsTrigger value="invoices" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Open Invoices</TabsTrigger>
                        <TabsTrigger value="creditnotes" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Credit Notes</TabsTrigger>
                        <TabsTrigger value="aging" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Aging Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">ID</span><span className="col-span-3">Customer</span>
                                        <span className="col-span-2 text-right">Credit Limit</span><span className="col-span-2 text-right">Balance</span>
                                        <span className="col-span-2 text-right">Overdue</span><span className="col-span-2 text-right">Risk</span>
                                    </div>
                                    {CUSTOMERS.map(c => (
                                        <div key={c.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{c.id}</span>
                                            <span className="col-span-3 font-medium">{c.name}</span>
                                            <span className="col-span-2 text-right text-xs text-muted-foreground">{fmt(c.creditLimit)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(c.balance)}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", c.overdue > 0 && "text-red-600")}>{c.overdue > 0 ? fmt(c.overdue) : '—'}</span>
                                            <span className="col-span-2 text-right"><RiskBadge risk={c.risk} /></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invoices" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Invoice</span><span className="col-span-3">Customer</span>
                                        <span className="col-span-2 text-right">Amount</span><span className="col-span-2">Due Date</span>
                                        <span className="col-span-1">Days Out</span><span className="col-span-2 text-right">Status</span>
                                    </div>
                                    {INVOICES.map(inv => (
                                        <div key={inv.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{inv.id}</span>
                                            <span className="col-span-3 text-xs truncate">{inv.customer}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(inv.amount)}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{inv.due}</span>
                                            <span className={cn("col-span-1 text-xs", inv.daysOut > 0 && "text-red-600 font-bold")}>{inv.daysOut > 0 ? `${inv.daysOut}d` : '—'}</span>
                                            <span className="col-span-2 text-right"><InvStatusBadge status={inv.status} /></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="creditnotes" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">CN#</span><span className="col-span-3">Customer</span>
                                        <span className="col-span-2 text-right">Amount</span><span className="col-span-2">Date</span>
                                        <span className="col-span-2">Reason</span><span className="col-span-1 text-right">Status</span>
                                    </div>
                                    {CREDIT_NOTES.map(cn_ => (
                                        <div key={cn_.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{cn_.id}</span>
                                            <span className="col-span-3 text-xs">{cn_.customer}</span>
                                            <span className="col-span-2 text-right text-xs font-bold text-red-600">-{fmt(cn_.amount)}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{cn_.date}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground truncate">{cn_.reason}</span>
                                            <span className="col-span-1 text-right"><Badge variant="secondary" className="text-[8px] h-4 px-1">{cn_.status}</Badge></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="aging" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-5 gap-4 text-center">
                                    {[{ label: 'Current', val: AGING.current, color: 'bg-emerald-500' },
                                    { label: '1-30 Days', val: AGING.d30, color: 'bg-amber-500' },
                                    { label: '31-60 Days', val: AGING.d60, color: 'bg-orange-500' },
                                    { label: '61-90 Days', val: AGING.d90, color: 'bg-red-500' },
                                    { label: '90+ Days', val: AGING.d120Plus, color: 'bg-red-800' }].map(b => (
                                        <div key={b.label} className="space-y-2">
                                            <div className="h-24 rounded-lg bg-muted/50 flex flex-col items-center justify-end pb-2 relative overflow-hidden">
                                                <div className={cn("absolute bottom-0 left-0 right-0 rounded-b-lg transition-all", b.color)}
                                                    style={{ height: `${Math.max((b.val / totalReceivable) * 100, 4)}%`, opacity: 0.8 }} />
                                                <span className="relative z-10 text-sm font-bold">{fmt(b.val, { compact: true })}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground">{b.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function SmallKpi({ label, value, alert, warn }: { label: string; value: string; alert?: boolean; warn?: boolean }) {
    return (
        <Card className={cn("border-border shadow-sm", alert && "border-red-200", warn && "border-amber-200")}>
            <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
                <p className={cn("text-lg font-bold tracking-tight", alert && "text-red-600")}>{value}</p>
            </CardContent>
        </Card>
    );
}

function RiskBadge({ risk }: { risk: string }) {
    const v = { low: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', high: 'bg-red-50 text-red-700' };
    return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", v[risk as keyof typeof v] ?? 'bg-muted')}>{risk}</span>;
}

function InvStatusBadge({ status }: { status: string }) {
    const m: Record<string, any> = { paid: 'default', sent: 'secondary', draft: 'outline', overdue: 'destructive', partial: 'secondary' };
    return <Badge variant={m[status] ?? 'outline'} className="text-[8px] h-4 px-1">{status}</Badge>;
}
