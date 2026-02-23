'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, ChevronLeft, AlertTriangle, TrendingDown, RotateCcw } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

const STOCK_ITEMS = [
    { sku: 'STL-001', name: 'Carbon Steel Plate (6mm)', qty: 420, unitCost: 185, totalValue: 77700, method: 'FIFO', category: 'Raw Material' },
    { sku: 'STL-002', name: 'Galvanized Pipe (4")', qty: 280, unitCost: 320, totalValue: 89600, method: 'FIFO', category: 'Raw Material' },
    { sku: 'STL-003', name: 'Stainless Flange DN50', qty: 150, unitCost: 95, totalValue: 14250, method: 'WAC', category: 'Components' },
    { sku: 'STL-004', name: 'Welding Electrode E6013', qty: 2000, unitCost: 12, totalValue: 24000, method: 'FIFO', category: 'Consumables' },
    { sku: 'STL-005', name: 'H-Beam 200x200', qty: 85, unitCost: 1400, totalValue: 119000, method: 'FIFO', category: 'Raw Material' },
    { sku: 'FIN-001', name: 'Prefab Wall Panel A', qty: 34, unitCost: 2200, totalValue: 74800, method: 'Standard', category: 'Finished Goods' },
];

const COGS_ENTRIES = [
    { date: '2026-02-20', ref: 'SO-1042', item: 'Carbon Steel Plate', qty: 50, unitCost: 185, total: 9250 },
    { date: '2026-02-18', ref: 'SO-1041', item: 'H-Beam 200x200', qty: 10, unitCost: 1400, total: 14000 },
    { date: '2026-02-15', ref: 'SO-1040', item: 'Prefab Wall Panel A', qty: 5, unitCost: 2200, total: 11000 },
    { date: '2026-02-12', ref: 'SO-1039', item: 'Galvanized Pipe (4")', qty: 40, unitCost: 320, total: 12800 },
];

const ADJUSTMENTS = [
    { id: 'ADJ-018', date: '2026-02-22', type: 'Damage', item: 'Welding Electrode E6013', qty: -100, value: -1200, status: 'posted' },
    { id: 'ADJ-017', date: '2026-02-19', type: 'Count', item: 'Stainless Flange DN50', qty: -5, value: -475, status: 'posted' },
    { id: 'ADJ-016', date: '2026-02-15', type: 'Transfer', item: 'Carbon Steel Plate', qty: 0, value: 0, status: 'posted' },
];

export default function InventoryAccountingPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('valuation');
    const totalValue = STOCK_ITEMS.reduce((s, i) => s + i.totalValue, 0);
    const totalSKU = STOCK_ITEMS.length;
    const cogsTotal = COGS_ENTRIES.reduce((s, e) => s + e.total, 0);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Package className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Inventory Accounting</h1>
                            <p className="text-[11px] text-muted-foreground">Valuation · COGS · Adjustments · Write-offs</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Kpi label="Inventory Value" value={fmt(totalValue)} /><Kpi label="SKUs Tracked" value={String(totalSKU)} />
                    <Kpi label="Period COGS" value={fmt(cogsTotal)} /><Kpi label="Adjustments" value={String(ADJUSTMENTS.length)} />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="valuation" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Valuation</TabsTrigger>
                        <TabsTrigger value="cogs" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">COGS</TabsTrigger>
                        <TabsTrigger value="adjustments" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Adjustments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="valuation" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">SKU</span><span className="col-span-3">Item</span>
                                        <span className="col-span-2">Category</span><span className="col-span-1 text-right">Qty</span>
                                        <span className="col-span-2 text-right">Unit Cost</span><span className="col-span-2 text-right">Total Value</span>
                                        <span className="col-span-1 text-right">Method</span>
                                    </div>
                                    {STOCK_ITEMS.map(i => (
                                        <div key={i.sku} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{i.sku}</span>
                                            <span className="col-span-3 text-xs font-medium truncate">{i.name}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{i.category}</span>
                                            <span className="col-span-1 text-right text-xs font-bold">{i.qty}</span>
                                            <span className="col-span-2 text-right text-xs">{fmt(i.unitCost)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(i.totalValue)}</span>
                                            <span className="col-span-1 text-right"><Badge variant="outline" className="text-[8px] h-4 px-1">{i.method}</Badge></span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 font-bold text-sm border-t-2">
                                        <span className="col-span-10 text-right">Total Inventory Value</span>
                                        <span className="col-span-2 text-right">{fmt(totalValue)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cogs" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Date</span><span className="col-span-2">Reference</span>
                                        <span className="col-span-3">Item</span><span className="col-span-1 text-right">Qty</span>
                                        <span className="col-span-2 text-right">Unit Cost</span><span className="col-span-2 text-right">COGS</span>
                                    </div>
                                    {COGS_ENTRIES.map((e, i) => (
                                        <div key={i} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 text-xs text-muted-foreground">{e.date}</span>
                                            <span className="col-span-2 font-mono text-xs text-red-600">{e.ref}</span>
                                            <span className="col-span-3 text-xs">{e.item}</span>
                                            <span className="col-span-1 text-right text-xs">{e.qty}</span>
                                            <span className="col-span-2 text-right text-xs">{fmt(e.unitCost)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(e.total)}</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 font-bold text-sm border-t-2">
                                        <span className="col-span-10 text-right">Total COGS (Period)</span>
                                        <span className="col-span-2 text-right">{fmt(cogsTotal)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="adjustments" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Ref</span><span className="col-span-2">Date</span>
                                        <span className="col-span-1">Type</span><span className="col-span-3">Item</span>
                                        <span className="col-span-1 text-right">Qty</span><span className="col-span-2 text-right">Value</span>
                                        <span className="col-span-1 text-right">Status</span>
                                    </div>
                                    {ADJUSTMENTS.map(a => (
                                        <div key={a.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{a.id}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{a.date}</span>
                                            <span className="col-span-1"><Badge variant="outline" className="text-[8px] h-4 px-1">{a.type}</Badge></span>
                                            <span className="col-span-3 text-xs">{a.item}</span>
                                            <span className={cn("col-span-1 text-right text-xs font-bold", a.qty < 0 && "text-red-600")}>{a.qty}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", a.value < 0 && "text-red-600")}>{fmt(a.value)}</span>
                                            <span className="col-span-1 text-right"><Badge variant="default" className="text-[8px] h-4 px-1">{a.status}</Badge></span>
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

function Kpi({ label, value }: { label: string; value: string }) {
    return (<Card className="border-border shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p><p className="text-lg font-bold tracking-tight">{value}</p></CardContent></Card>);
}
