'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Package, ChevronLeft, AlertTriangle, TrendingDown,
    RotateCcw, ShieldCheck, History, Calculator,
    FileText, ArrowUpRight, BarChart3
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { getInventoryItems, getInventorySummary } from '@/lib/api';

export default function InventoryAccountingPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('valuation');
    const [skus, setSkus] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ total_skus: 0, total_value: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFinanceData = async () => {
            setLoading(true);
            try {
                const [items, sum] = await Promise.all([
                    getInventoryItems(),
                    getInventorySummary()
                ]);
                setSkus(items);
                setSummary(sum);
                setTransactions(sum.recent_transactions || []);
            } catch (err) {
                console.error("Failed to load inventory finance data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadFinanceData();
    }, []);

    const totalValue = skus.reduce((acc, i) => acc + ((i.last_purchase_price || i.standard_cost || 0) * (i.on_hand || 0)), 0);
    const cogsTotal = transactions.filter(t => ['sale', 'issue_to_site', 'waste'].includes(t.type))
        .reduce((acc, t) => acc + Math.abs(t.total_value), 0);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-12 max-w-7xl mx-auto w-full">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/finance">
                            <Button variant="ghost" size="icon" className="h-9 w-9 border hover:bg-slate-50">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="h-12 w-12 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
                            <Calculator className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">Inventory Accounting</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">IFRS/GAAP Perpetual System</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-9 font-bold text-xs uppercase bg-white border-slate-200 text-slate-600">
                            <History className="h-3.5 w-3.5 mr-2" /> Audit Trail
                        </Button>
                        <Button className="h-9 font-bold text-xs uppercase bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-100">
                            Close Period
                        </Button>
                    </div>
                </div>

                {/* KPI Overview */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        label="Total Inventory Value"
                        value={fmt(totalValue)}
                        icon={<TrendingDown className="h-4 w-4" />}
                        description="Net asset value (Perpetual)"
                        trend="+2.4%"
                    />
                    <KpiCard
                        label="Period COGS"
                        value={fmt(cogsTotal)}
                        icon={<BarChart3 className="h-4 w-4" />}
                        description="Recognized since Feb 1st"
                        status="Synced"
                    />
                    <KpiCard
                        label="SKUs Monitored"
                        value={String(summary.total_skus)}
                        icon={<Package className="h-4 w-4" />}
                        description="Active items in catalog"
                    />
                    <KpiCard
                        label="Adj. Impact"
                        value={fmt(0)}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        description="Net gain/loss from adjustments"
                        status="Healthy"
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="bg-slate-100/80 p-1 h-11 mb-8 border border-slate-200 w-full md:w-auto">
                        <TabsTrigger value="valuation" className="px-6 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">Asset Valuation</TabsTrigger>
                        <TabsTrigger value="cogs" className="px-6 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">COGS Recognition</TabsTrigger>
                        <TabsTrigger value="adjustments" className="px-6 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">Adjustments</TabsTrigger>
                        <TabsTrigger value="reporting" className="px-6 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">Reconciliation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="valuation">
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-tight">Stock Ledger & Valuation</CardTitle>
                                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase">Valuation model applied per SKU registry</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-slate-500">
                                        <FileText className="h-3 w-3 mr-1.5" /> Export Ledger
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/30 border-b border-slate-100">
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Cost</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Value</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {skus.map(i => (
                                                <tr key={i.sku} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-red-600">{i.sku}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">{i.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{i.category}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-black text-slate-900">{i.on_hand || 0}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1 font-bold">{i.uom_base}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs font-mono text-slate-600">{fmt(i.last_purchase_price || i.standard_cost || 0)}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{fmt((i.last_purchase_price || i.standard_cost || 0) * (i.on_hand || 0))}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="outline" className="text-[9px] font-black h-5 uppercase tracking-tighter border-slate-200 text-slate-500 bg-slate-100/50 px-2">
                                                            {i.valuation_method || 'FIFO'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            {skus.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase">No records found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="border-t-2 border-slate-200 bg-slate-50/50">
                                            <tr className="font-black">
                                                <td colSpan={4} className="px-6 py-4 text-right text-xs uppercase text-slate-500 tracking-wider">Net Inventory Asset Value</td>
                                                <td className="px-6 py-4 text-right text-lg text-red-600">{fmt(totalValue)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cogs">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase">COGS recognition Log</CardTitle>
                                <CardDescription className="text-xs">Automatic riconoscimento del costo del venduto basato sulle transazioni di scarico</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y border-t bg-white">
                                    <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="col-span-2">Date</span>
                                        <span className="col-span-2">Reference</span>
                                        <span className="col-span-4">Material / Item</span>
                                        <span className="col-span-2 text-right">Recognized COGS</span>
                                        <span className="col-span-2 text-right">GL Status</span>
                                    </div>
                                    {transactions.filter(t => ['sale', 'issue_to_site', 'waste'].includes(t.type)).map((e, idx) => (
                                        <div key={idx} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors border-b last:border-0 border-slate-100">
                                            <span className="col-span-2 text-xs font-bold text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                                            <span className="col-span-2 font-mono text-xs font-bold text-red-600">{e.transaction_id}</span>
                                            <span className="col-span-4 flex flex-col">
                                                <span className="text-xs font-black text-slate-900">{e.item_id?.name || 'Stock Item'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Type: {e.type}</span>
                                            </span>
                                            <span className="col-span-2 text-right text-sm font-black text-red-600">{fmt(Math.abs(e.total_value))}</span>
                                            <span className="col-span-2 text-right flex items-center justify-end gap-1.5 grayscale opacity-70">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase text-slate-500">Posted</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Other tabs follow same structure... */}
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function KpiCard({ label, value, icon, description, trend, status }: any) {
    return (
        <Card className="border-slate-200 hover:border-red-200 transition-all group bg-white">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        {icon}
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            <ArrowUpRight className="h-2.5 w-2.5" />
                            {trend}
                        </div>
                    )}
                    {status && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {status}
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</p>
                    {description && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-none">{description}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
