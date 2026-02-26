'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Globe, RefreshCcw, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES, MOCK_FX_RATES } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader, FinanceTableHeader } from '@/components/finance/FinancePageHeader';

const TRACKED_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR'];

const INITIAL_EXPOSURE = [
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

    const [rates, setRates] = useState<Record<string, number>>(MOCK_FX_RATES);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const totalExposure = INITIAL_EXPOSURE.reduce((s, e) => s + Math.abs(e.net), 0);
    const netFxImpact = REVALUATION_LOG.reduce((s, r) => s + r.netImpact, 0);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate real rate fetching
        await new Promise(r => setTimeout(r, 1200));

        // Slightly jitter the rates to show a change happened
        const newRates = { ...rates };
        ['EUR', 'GBP', 'INR'].forEach(c => {
            if (newRates[c]) {
                const jitter = (Math.random() - 0.5) * 0.005; // +/- small amount
                newRates[c] = newRates[c] * (1 + jitter);
            }
        });

        setRates(newRates);
        setLastUpdated(new Date());
        setRefreshing(false);
        toast.success('FX Rates Refreshed');
    };

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">

                <FinancePageHeader
                    title="Multi-Currency Management"
                    subtitle={`FX Rates · Revaluation · Exposure · Translation — Base: ${baseCurrency}`}
                    icon={Globe}
                    actions={
                        <Button
                            size="sm"
                            className="gap-2 bg-red-600 hover:bg-red-700 text-[10px] h-8 transition-all"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCcw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                            {refreshing ? 'Fetching...' : 'Refresh Rates'}
                        </Button>
                    }
                />

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <KpiCard label="Base Currency" value={baseCurrency} />
                    <KpiCard label="Tracked Currencies" value={String(TRACKED_CURRENCIES.length)} />
                    <KpiCard label="Total Exposure" value={fmt(totalExposure)} />
                    <KpiCard
                        label="Net FX Impact YTD"
                        value={fmt(Math.abs(netFxImpact))}
                        alert={netFxImpact < 0}
                        footer={netFxImpact < 0 ? 'Unfavorable' : 'Favorable'}
                        positive={netFxImpact >= 0}
                        delta={netFxImpact >= 0 ? '+Impact' : '-Loss'}
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="rates" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Exchange Rates</TabsTrigger>
                        <TabsTrigger value="exposure" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Currency Exposure</TabsTrigger>
                        <TabsTrigger value="revaluation" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">FX Revaluation</TabsTrigger>
                    </TabsList>

                    {/* ── RATES ── */}
                    <TabsContent value="rates" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                                <p className="text-sm font-bold">Exchange Rates</p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                    <RefreshCcw className="h-3 w-3" /> Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            </div>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <FinanceTableHeader>
                                        <span className="col-span-2">Currency</span>
                                        <span className="col-span-2">Name</span>
                                        <span className="col-span-1 border-r pr-4 text-right">Symbol</span>
                                        <span className="col-span-2 pl-4 text-right">Rate vs USD</span>
                                        <span className="col-span-2 text-right">Rate vs {baseCurrency}</span>
                                        <span className="col-span-3 text-right">Status</span>
                                    </FinanceTableHeader>
                                    {TRACKED_CURRENCIES.map(c => {
                                        const rateVsUsd = rates[c] ?? 1;
                                        const baseRate = rates[baseCurrency] ?? 1;
                                        const rateVsBase = rateVsUsd / baseRate;
                                        return (
                                            <div key={c} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                                <span className="col-span-2 font-mono text-xs font-bold text-red-600">{c}</span>
                                                <span className="col-span-2 text-xs text-muted-foreground">{CURRENCY_NAMES[c] ?? c}</span>
                                                <span className="col-span-1 text-xs font-bold border-r pr-4 text-right">{CURRENCY_SYMBOLS[c] ?? c}</span>
                                                <span className="col-span-2 text-xs font-bold pl-4 text-right">{rateVsUsd.toFixed(4)}</span>
                                                <span className="col-span-2 text-xs font-bold text-right">{rateVsBase.toFixed(4)}</span>
                                                <span className="col-span-3 text-right">
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-300 text-emerald-600 bg-emerald-50">Live</Badge>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── EXPOSURE ── */}
                    <TabsContent value="exposure" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-2">Currency</span>
                                        <span className="col-span-3 text-right">Receivable</span>
                                        <span className="col-span-3 text-right">Payable</span>
                                        <span className="col-span-4 text-right">Net Exposure</span>
                                    </FinanceTableHeader>
                                    {INITIAL_EXPOSURE.map(e => (
                                        <div key={e.currency} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs font-bold text-red-600">{e.currency}</span>
                                            <span className="col-span-3 text-right text-xs font-medium">{fmt(e.receivable)}</span>
                                            <span className="col-span-3 text-right text-xs font-medium">{fmt(e.payable)}</span>
                                            <span className={cn("col-span-4 text-right text-xs font-bold flex items-center justify-end gap-1.5", e.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {e.net >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {fmt(Math.abs(e.net))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── REVALUATION ── */}
                    <TabsContent value="revaluation" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-1">ID</span>
                                        <span className="col-span-2">Date</span>
                                        <span className="col-span-1">CCY</span>
                                        <span className="col-span-2 text-right">Gain</span>
                                        <span className="col-span-2 text-right">Loss</span>
                                        <span className="col-span-2 text-right">Net Impact</span>
                                        <span className="col-span-2 text-right">Status</span>
                                    </FinanceTableHeader>
                                    {REVALUATION_LOG.map(r => (
                                        <div key={r.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{r.id}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{r.date}</span>
                                            <span className="col-span-1 text-xs font-bold">{r.currency}</span>
                                            <span className="col-span-2 text-right text-xs font-bold text-emerald-600">{r.unrealizedGain > 0 ? fmt(r.unrealizedGain) : '—'}</span>
                                            <span className="col-span-2 text-right text-xs font-bold text-red-600">{r.unrealizedLoss < 0 ? fmt(Math.abs(r.unrealizedLoss)) : '—'}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", r.netImpact >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {fmt(r.netImpact)}
                                            </span>
                                            <span className="col-span-2 text-right">
                                                <Badge variant="default" className="text-[8px] h-4 px-1 uppercase tracking-wider">{r.status}</Badge>
                                            </span>
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
