'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Globe, ChevronLeft, RefreshCcw, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES, MOCK_FX_RATES } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TRACKED_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR'];

const FX_HISTORY = [
    { date: '2026-02-22', pair: 'USD/AED', rate: 3.6725, change: 0.0000 },
    { date: '2026-02-22', pair: 'EUR/AED', rate: 3.9950, change: +0.0120 },
    { date: '2026-02-22', pair: 'GBP/AED', rate: 4.6490, change: -0.0080 },
    { date: '2026-02-22', pair: 'SAR/AED', rate: 0.9793, change: 0.0000 },
    { date: '2026-02-22', pair: 'INR/AED', rate: 0.0442, change: +0.0002 },
];

const EXPOSURE = [
    { currency: 'USD', receivable: 128000, payable: 42000, net: 86000 },
    { currency: 'EUR', receivable: 45000, payable: 18000, net: 27000 },
    { currency: 'GBP', receivable: 22000, payable: 8500, net: 13500 },
    { currency: 'SAR', receivable: 185000, payable: 28000, net: 157000 },
    { currency: 'INR', receivable: 0, payable: 42000, net: -42000 },
];

const REVALUATION_LOG = [
    { id: 'RV-006', date: '2026-02-22', currency: 'EUR', unrealizedGain: 4200, unrealizedLoss: 0, netImpact: 4200, status: 'posted' },
    { id: 'RV-005', date: '2026-02-22', currency: 'GBP', unrealizedGain: 0, unrealizedLoss: -1800, netImpact: -1800, status: 'posted' },
    { id: 'RV-004', date: '2026-01-31', currency: 'EUR', unrealizedGain: 2100, unrealizedLoss: 0, netImpact: 2100, status: 'posted' },
    { id: 'RV-003', date: '2026-01-31', currency: 'INR', unrealizedGain: 0, unrealizedLoss: -850, netImpact: -850, status: 'posted' },
];

export default function MultiCurrencyPage() {
    const { format: fmt, currencyCode: baseCurrency } = useCurrency();
    const [tab, setTab] = useState('rates');
    const totalExposure = EXPOSURE.reduce((s, e) => s + Math.abs(e.net), 0);
    const netFxImpact = REVALUATION_LOG.reduce((s, r) => s + r.netImpact, 0);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Globe className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Multi-Currency Management</h1>
                            <p className="text-[11px] text-muted-foreground">FX Rates · Revaluation · Exposure · Translation — Base: <span className="font-bold text-red-600">{baseCurrency}</span></p>
                        </div>
                    </div>
                    <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={() => toast.success('FX rates refreshed')}><RefreshCcw className="h-3.5 w-3.5" /> Refresh Rates</Button>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Kpi label="Base Currency" value={baseCurrency} /><Kpi label="Tracked Currencies" value={String(TRACKED_CURRENCIES.length)} />
                    <Kpi label="Total Exposure" value={fmt(totalExposure)} /><Kpi label="Net FX Impact YTD" value={fmt(netFxImpact)} alert={netFxImpact < 0} />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="rates" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Exchange Rates</TabsTrigger>
                        <TabsTrigger value="exposure" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Currency Exposure</TabsTrigger>
                        <TabsTrigger value="revaluation" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">FX Revaluation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rates" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Currency</span><span className="col-span-2">Name</span>
                                        <span className="col-span-1">Symbol</span><span className="col-span-2">Rate vs USD</span>
                                        <span className="col-span-2">Rate vs {baseCurrency}</span><span className="col-span-3 text-right">Status</span>
                                    </div>
                                    {TRACKED_CURRENCIES.map(c => {
                                        const rateVsUsd = MOCK_FX_RATES[c] ?? 1;
                                        const baseRate = MOCK_FX_RATES[baseCurrency] ?? 1;
                                        const rateVsBase = rateVsUsd / baseRate;
                                        return (
                                            <div key={c} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                                <span className="col-span-2 font-mono text-xs font-bold text-red-600">{c}</span>
                                                <span className="col-span-2 text-xs text-muted-foreground">{CURRENCY_NAMES[c] ?? c}</span>
                                                <span className="col-span-1 text-xs">{CURRENCY_SYMBOLS[c] ?? c}</span>
                                                <span className="col-span-2 text-xs font-bold">{rateVsUsd.toFixed(4)}</span>
                                                <span className="col-span-2 text-xs font-bold">{rateVsBase.toFixed(4)}</span>
                                                <span className="col-span-3 text-right"><Badge variant="outline" className="text-[8px] h-4 px-1">Live</Badge></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="exposure" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Currency</span><span className="col-span-3 text-right">Receivable</span>
                                        <span className="col-span-3 text-right">Payable</span><span className="col-span-4 text-right">Net Exposure</span>
                                    </div>
                                    {EXPOSURE.map(e => (
                                        <div key={e.currency} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs font-bold text-red-600">{e.currency}</span>
                                            <span className="col-span-3 text-right text-xs">{fmt(e.receivable)}</span>
                                            <span className="col-span-3 text-right text-xs">{fmt(e.payable)}</span>
                                            <span className={cn("col-span-4 text-right text-xs font-bold flex items-center justify-end gap-1", e.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {e.net >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {fmt(Math.abs(e.net))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="revaluation" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">ID</span><span className="col-span-2">Date</span>
                                        <span className="col-span-1">CCY</span><span className="col-span-2 text-right">Gain</span>
                                        <span className="col-span-2 text-right">Loss</span><span className="col-span-2 text-right">Net Impact</span>
                                        <span className="col-span-2 text-right">Status</span>
                                    </div>
                                    {REVALUATION_LOG.map(r => (
                                        <div key={r.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{r.id}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{r.date}</span>
                                            <span className="col-span-1 text-xs font-bold">{r.currency}</span>
                                            <span className="col-span-2 text-right text-xs text-emerald-600">{r.unrealizedGain > 0 ? fmt(r.unrealizedGain) : '—'}</span>
                                            <span className="col-span-2 text-right text-xs text-red-600">{r.unrealizedLoss < 0 ? fmt(Math.abs(r.unrealizedLoss)) : '—'}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", r.netImpact >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(r.netImpact)}</span>
                                            <span className="col-span-2 text-right"><Badge variant="default" className="text-[8px] h-4 px-1">{r.status}</Badge></span>
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

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
    return (<Card className={cn("border-border shadow-sm", alert && "border-red-200")}><CardContent className="p-3"><p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p><p className={cn("text-lg font-bold tracking-tight", alert && "text-red-600")}>{value}</p></CardContent></Card>);
}
