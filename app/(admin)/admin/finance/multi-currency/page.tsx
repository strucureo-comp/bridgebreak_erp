'use client';

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Globe, RefreshCcw, ArrowUpRight, ArrowDownRight, Loader2,
    Calculator, Scale, History, TrendingUp, ShieldCheck,
    ChevronLeft, Database, Zap, FileText
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES, MOCK_FX_RATES } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader, FinanceTableHeader } from '@/components/finance/FinancePageHeader';

// ── TYPES ──────────────────────────────────────────────────────────────────────
const TRACKED_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR'];

const INITIAL_EXPOSURE = [
    { currency: 'USD', receivable: 128000, payable: 42000, net: 86000, hedge: 0.8 },
    { currency: 'EUR', receivable: 45000, payable: 18000, net: 27000, hedge: 0.5 },
    { currency: 'GBP', receivable: 22000, payable: 8500, net: 13500, hedge: 0.0 },
    { currency: 'SAR', receivable: 185000, payable: 28000, net: 157000, hedge: 1.0 }, // SAR/AED Peg
    { currency: 'INR', receivable: 0, payable: 42000, net: -42000, hedge: 0.2 },
];

const TRANSLATION_RUNS = [
    { id: 'TR-2602', entity: 'SS KSA', method: 'Current Rate', status: 'Calculated', ctaAmount: 14200, period: 'Feb 2026' },
    { id: 'TR-2601', entity: 'SS India', method: 'Current Rate', status: 'Success', ctaAmount: -8500, period: 'Feb 2026' },
];

export default function MultiCurrencyPage() {
    const { format: fmt, currencyCode: baseCurrency } = useCurrency();
    const [tab, setTab] = useState('rates');
    const [rates, setRates] = useState<Record<string, number>>(MOCK_FX_RATES);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const totalExposure = INITIAL_EXPOSURE.reduce((s, e) => s + Math.abs(e.net), 0);
    const netHedgeRatio = INITIAL_EXPOSURE.reduce((s, e) => s + (e.hedge * Math.abs(e.net)), 0) / (totalExposure || 1);

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1200));
        const newRates = { ...rates };
        ['EUR', 'GBP', 'INR'].forEach(c => {
            if (newRates[c]) {
                const jitter = (Math.random() - 0.5) * 0.005;
                newRates[c] = newRates[c] * (1 + jitter);
            }
        });
        setRates(newRates);
        setLastUpdated(new Date());
        setRefreshing(false);
        toast.success('FX Rates Synchronized via Global Telemetry');
    };

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-20">

                <FinancePageHeader
                    title="FX & Translation Engine"
                    subtitle="IAS 21 · CTA Calculations · Multi-Entity Translation · Hedging Metrics"
                    icon={Globe}
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end mr-2 hidden sm:flex">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pricing Source</span>
                                <span className="text-[10px] font-bold text-foreground uppercase">Real-time Interbank</span>
                            </div>
                            <Button
                                size="sm"
                                className="gap-2 bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-red-200"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCcw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                                {refreshing ? 'Syncing...' : 'Sync Rates'}
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    <KpiCard label="Functional CCY" value={baseCurrency} />
                    <KpiCard label="Market Exposure" value={fmt(totalExposure)} alert={totalExposure > 200000} />
                    <KpiCard label="Global Hedging" value={`${(netHedgeRatio * 100).toFixed(1)}%`} footer="Protection Coverage" />
                    <KpiCard label="CTA Impact" value={fmt(5700)} positive delta="+Gain" footer="IAS 21 Reserves" />
                    <KpiCard label="Sync Health" value="OPTIMAL" footer={`Last: ${lastUpdated.toLocaleTimeString()}`} />
                </div>

                <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                    <TabsList className="bg-muted/50 border h-10 p-1">
                        <TabsTrigger value="rates" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Market Rates</TabsTrigger>
                        <TabsTrigger value="translation" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">IAS 21 Translation</TabsTrigger>
                        <TabsTrigger value="exposure" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Risk Exposure</TabsTrigger>
                        <TabsTrigger value="cta" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">CTA Reserves</TabsTrigger>
                    </TabsList>

                    {/* ── MARKET RATES ── */}
                    <TabsContent value="rates" className="animate-in fade-in duration-500">
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b py-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Global Spot Rates</CardTitle>
                                        <CardDescription className="text-[11px] font-medium text-muted-foreground">Comparative matrix vs Functional Currency</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-300 text-emerald-600 bg-emerald-50 h-5 px-2">Streaming Live</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <FinanceTableHeader className="bg-muted/10 border-b-0">
                                        <span className="col-span-2">ISO Code</span>
                                        <span className="col-span-3">Currency Name</span>
                                        <span className="col-span-2 text-right pr-6 border-r border-border/50">Rate vs USD</span>
                                        <span className="col-span-2 text-right pl-6">Rate vs {baseCurrency}</span>
                                        <span className="col-span-3 text-right">Translation Rule</span>
                                    </FinanceTableHeader>
                                    {TRACKED_CURRENCIES.map(c => {
                                        const rateVsUsd = rates[c] ?? 1;
                                        const baseRate = rates[baseCurrency] ?? 1;
                                        const rateVsBase = rateVsUsd / baseRate;
                                        return (
                                            <div key={c} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/20 transition-colors group">
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="font-black text-xs text-red-600 tracking-widest">{c}</span>
                                                </div>
                                                <span className="col-span-3 text-[11px] font-bold text-muted-foreground uppercase">{CURRENCY_NAMES[c] ?? c}</span>
                                                <div className="col-span-2 text-right pr-6 border-r border-border/50">
                                                    <span className="text-sm font-black text-foreground">{rateVsUsd.toFixed(4)}</span>
                                                    <p className="text-[9px] font-bold text-slate-400">USD Spot</p>
                                                </div>
                                                <div className="col-span-2 text-right pl-6">
                                                    <span className="text-sm font-black text-foreground">{rateVsBase.toFixed(4)}</span>
                                                    <p className="text-[9px] font-bold text-red-600">{baseCurrency} Parity</p>
                                                </div>
                                                <div className="col-span-3 text-right">
                                                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500">
                                                        {c === 'SAR' || c === 'AED' ? 'Pegged Rate' : 'Floating Market'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── IAS 21 TRANSLATION ── */}
                    <TabsContent value="translation" className="animate-in fade-in duration-500 space-y-6">
                        <div className="grid gap-6 md:grid-cols-12">
                            <div className="md:col-span-8">
                                <Card className="border-border shadow-sm">
                                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                                        <p className="text-xs font-black uppercase tracking-widest">Active Translation Batches</p>
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest bg-white">New Run</Button>
                                    </div>
                                    <div className="divide-y">
                                        <FinanceTableHeader className="bg-muted/10 border-b-0">
                                            <span className="col-span-2">Batch ID</span>
                                            <span className="col-span-3">Entity</span>
                                            <span className="col-span-2">Standard</span>
                                            <span className="col-span-3 text-right">CTA Adjustment</span>
                                            <span className="col-span-2 text-right">Status</span>
                                        </FinanceTableHeader>
                                        {TRANSLATION_RUNS.map(run => (
                                            <div key={run.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                                                <span className="col-span-2 font-mono text-xs font-bold text-red-600">{run.id}</span>
                                                <div className="col-span-3">
                                                    <p className="text-xs font-black uppercase">{run.entity}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground">{run.period}</p>
                                                </div>
                                                <span className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{run.method}</span>
                                                <span className={cn("col-span-3 text-right text-sm font-black", run.ctaAmount >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                    {run.ctaAmount >= 0 ? '+' : ''}{fmt(run.ctaAmount)}
                                                </span>
                                                <div className="col-span-2 text-right">
                                                    <Badge variant={run.status === 'Success' ? 'default' : 'outline'} className={cn("text-[9px] font-black uppercase tracking-widest px-2 h-4", run.status === 'Calculated' && "border-amber-300 text-amber-600")}>
                                                        {run.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                            <div className="md:col-span-4 space-y-4">
                                <Card className="border-border shadow-sm bg-slate-900 text-white">
                                    <CardContent className="p-6">
                                        <Scale className="h-8 w-8 mb-4 text-red-500" />
                                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Translation Logic</h3>
                                        <p className="text-xs opacity-70 mb-6 leading-relaxed">
                                            Applying IAS 21 Current Rate Method.
                                            Assets/Liabilities: <span className="text-white font-bold italic">Closing Rate</span>.
                                            P&L: <span className="text-white font-bold italic">Average Rate</span>.
                                        </p>
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Avg AED/SAR</span>
                                                <span className="text-xs font-bold">1.0205</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Avg AED/INR</span>
                                                <span className="text-xs font-bold">22.8420</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── RISK EXPOSURE ── */}
                    <TabsContent value="exposure" className="animate-in fade-in duration-500">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest">Global Exposure Matrix</CardTitle>
                                <CardDescription className="text-[11px] font-medium">Net Position vs Hedge Coverage</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <FinanceTableHeader className="bg-muted/10 border-b-0">
                                        <span className="col-span-2">ISO Code</span>
                                        <span className="col-span-3 text-right pr-6">Net Receivable</span>
                                        <span className="col-span-3 text-right pr-6">Net Payable</span>
                                        <span className="col-span-2 text-right">Net Exposure</span>
                                        <span className="col-span-2 text-right">Protection</span>
                                    </FinanceTableHeader>
                                    {INITIAL_EXPOSURE.map(e => (
                                        <div key={e.currency} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                                            <span className="col-span-2 font-black text-xs text-red-600 tracking-widest">{e.currency}</span>
                                            <span className="col-span-3 text-right pr-6 text-xs font-bold">{fmt(e.receivable)}</span>
                                            <span className="col-span-3 text-right pr-6 text-xs font-bold">{fmt(e.payable)}</span>
                                            <div className="col-span-2 text-right">
                                                <span className={cn("text-sm font-black flex items-center justify-end gap-1", e.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                    {e.net >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {fmt(Math.abs(e.net))}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-right space-y-1">
                                                <Progress value={e.hedge * 100} className="h-1.5" />
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{(e.hedge * 100)}% Hedged</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── CTA RESERVES ── */}
                    <TabsContent value="cta" className="animate-in fade-in duration-500">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-border shadow-sm p-6 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Scale className="h-24 w-24" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">IAS 21 Reserves</h3>
                                <p className="text-2xl font-black text-emerald-600 mb-6">{fmt(5700)}</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="uppercase text-muted-foreground tracking-widest">KSA Translation Result</span>
                                        <span className="text-emerald-600">+ {fmt(14200)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="uppercase text-muted-foreground tracking-widest">IND Translation Result</span>
                                        <span className="text-red-600">- {fmt(8500)}</span>
                                    </div>
                                    <div className="h-px bg-border pt-2" />
                                    <p className="text-[9px] text-muted-foreground italic leading-relaxed">
                                        CTA represents the cumulative exchange differences arising from foreign entity translation, held in Equity until disposal.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}
