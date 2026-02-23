'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Cpu, ChevronLeft, TrendingDown, Trash2, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

const ASSETS = [
    { id: 'FA-001', name: 'CNC Laser Cutter', class: 'Machinery', acquired: '2024-06-15', cost: 480000, depMethod: 'Straight Line', usefulLife: 10, accDep: 96000, nbv: 384000, status: 'active' },
    { id: 'FA-002', name: 'Overhead Crane (20T)', class: 'Machinery', acquired: '2023-01-10', cost: 320000, depMethod: 'Straight Line', usefulLife: 15, accDep: 64000, nbv: 256000, status: 'active' },
    { id: 'FA-003', name: 'Warehouse Building', class: 'Building', acquired: '2022-03-01', cost: 1200000, depMethod: 'Straight Line', usefulLife: 30, accDep: 160000, nbv: 1040000, status: 'active' },
    { id: 'FA-004', name: 'Delivery Truck — Hino', class: 'Vehicle', acquired: '2024-01-20', cost: 180000, depMethod: 'Reducing Balance', usefulLife: 8, accDep: 45000, nbv: 135000, status: 'active' },
    { id: 'FA-005', name: 'Office Furniture Set', class: 'Furniture', acquired: '2023-07-01', cost: 45000, depMethod: 'Straight Line', usefulLife: 5, accDep: 18000, nbv: 27000, status: 'active' },
    { id: 'FA-006', name: 'IT Server Rack', class: 'Equipment', acquired: '2024-09-15', cost: 95000, depMethod: 'Reducing Balance', usefulLife: 5, accDep: 19000, nbv: 76000, status: 'active' },
    { id: 'FA-007', name: 'Old Welder (Disposed)', class: 'Machinery', acquired: '2019-04-01', cost: 28000, depMethod: 'Straight Line', usefulLife: 7, accDep: 28000, nbv: 0, status: 'disposed' },
];

const DEP_SCHEDULE = [
    { month: 'Jan 2026', machinery: 6667, building: 3333, vehicles: 1875, equipment: 1583, furniture: 750, total: 14208 },
    { month: 'Feb 2026', machinery: 6667, building: 3333, vehicles: 1875, equipment: 1583, furniture: 750, total: 14208 },
    { month: 'Mar 2026', machinery: 6667, building: 3333, vehicles: 1875, equipment: 1583, furniture: 750, total: 14208 },
];

export default function FixedAssetsPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('register');
    const totalCost = ASSETS.filter(a => a.status === 'active').reduce((s, a) => s + a.cost, 0);
    const totalNBV = ASSETS.filter(a => a.status === 'active').reduce((s, a) => s + a.nbv, 0);
    const totalDep = ASSETS.filter(a => a.status === 'active').reduce((s, a) => s + a.accDep, 0);
    const monthlyDep = DEP_SCHEDULE[0]?.total ?? 0;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Cpu className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Fixed Assets</h1>
                            <p className="text-[11px] text-muted-foreground">Asset Register · Depreciation · Disposal · Impairment</p>
                        </div>
                    </div>
                    <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700"><RotateCcw className="h-3.5 w-3.5" /> Run Depreciation</Button>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Kpi label="Gross Cost" value={fmt(totalCost)} /><Kpi label="Accum. Depreciation" value={fmt(totalDep)} />
                    <Kpi label="Net Book Value" value={fmt(totalNBV)} /><Kpi label="Monthly Dep." value={fmt(monthlyDep)} />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="register" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Asset Register</TabsTrigger>
                        <TabsTrigger value="depreciation" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Depreciation Schedule</TabsTrigger>
                        <TabsTrigger value="disposal" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Disposals</TabsTrigger>
                    </TabsList>

                    <TabsContent value="register" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">ID</span><span className="col-span-2">Asset</span><span className="col-span-1">Class</span>
                                        <span className="col-span-1">Acquired</span><span className="col-span-1">Method</span><span className="col-span-1 text-right">Life</span>
                                        <span className="col-span-2 text-right">Cost</span><span className="col-span-1 text-right">Acc.Dep</span>
                                        <span className="col-span-1 text-right">NBV</span><span className="col-span-1 text-right">Status</span>
                                    </div>
                                    {ASSETS.map(a => (
                                        <div key={a.id} className={cn("grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm", a.status === 'disposed' && 'opacity-50')}>
                                            <span className="col-span-1 font-mono text-xs text-red-600">{a.id}</span>
                                            <span className="col-span-2 text-xs font-medium truncate">{a.name}</span>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{a.class}</span>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{a.acquired.slice(0, 7)}</span>
                                            <span className="col-span-1"><Badge variant="outline" className="text-[7px] h-4 px-1">{a.depMethod === 'Straight Line' ? 'SL' : 'RB'}</Badge></span>
                                            <span className="col-span-1 text-right text-[10px]">{a.usefulLife}yr</span>
                                            <span className="col-span-2 text-right text-xs">{fmt(a.cost)}</span>
                                            <span className="col-span-1 text-right text-xs text-muted-foreground">{fmt(a.accDep)}</span>
                                            <span className="col-span-1 text-right text-xs font-bold">{fmt(a.nbv)}</span>
                                            <span className="col-span-1 text-right"><Badge variant={a.status === 'active' ? 'default' : 'destructive'} className="text-[7px] h-4 px-1">{a.status}</Badge></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="depreciation" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-8 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span>Month</span><span className="text-right">Machinery</span><span className="text-right">Building</span>
                                        <span className="text-right">Vehicles</span><span className="text-right">Equipment</span><span className="text-right">Furniture</span>
                                        <span className="col-span-2 text-right">Total</span>
                                    </div>
                                    {DEP_SCHEDULE.map(d => (
                                        <div key={d.month} className="grid grid-cols-8 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="text-xs font-medium">{d.month}</span>
                                            <span className="text-right text-xs">{fmt(d.machinery)}</span>
                                            <span className="text-right text-xs">{fmt(d.building)}</span>
                                            <span className="text-right text-xs">{fmt(d.vehicles)}</span>
                                            <span className="text-right text-xs">{fmt(d.equipment)}</span>
                                            <span className="text-right text-xs">{fmt(d.furniture)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(d.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="disposal" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    {ASSETS.filter(a => a.status === 'disposed').map(a => (
                                        <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Trash2 className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="text-sm font-medium">{a.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{a.id} · Fully depreciated · Acquired {a.acquired}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold">Cost: {fmt(a.cost)}</p>
                                                <p className="text-[10px] text-muted-foreground">Gain/Loss: {fmt(0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {ASSETS.filter(a => a.status === 'disposed').length === 0 && (
                                        <div className="py-12 text-center"><p className="text-sm text-muted-foreground">No disposals recorded</p></div>
                                    )}
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
