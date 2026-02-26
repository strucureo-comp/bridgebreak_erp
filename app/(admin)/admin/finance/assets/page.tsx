'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, Trash2, RotateCcw, Plus, Download, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader, FinanceTableHeader, FinanceEmptyState } from '@/components/finance/FinancePageHeader';
import { toast } from 'sonner';

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface Asset {
    id: string;
    name: string;
    class: string;
    acquired: string;
    cost: number;
    depMethod: 'Straight Line' | 'Reducing Balance';
    usefulLife: number; // in years
    accDep: number;
    nbv: number;
    status: 'active' | 'disposed' | 'impaired';

    // 1. Core Accounting Enhancements
    salvageValue: number;
    depRate?: number;
    depStartDate: string;
    capDate: string;
    glAsset: string;
    glAccDep: string;
    glDepExp: string;
    costCenter: string;
    project?: string;

    // 2. Operational Tracking
    location: string;
    custodian: string;
    serialNumber: string;
    tagId: string;
    warrantyExpiry?: string;
    vendor?: string;
    insurance?: string;
}

interface DepScheduleItem {
    id: string;
    period: string;
    openingNbv: number;
    depAmount: number;
    closingNbv: number;
    journalId: string;
    status: 'posted' | 'draft' | 'reversed';
    runBy: string;
    timestamp: string;
}

interface DisposalRecord {
    id: string;
    assetId: string;
    assetName: string;
    date: string;
    value: number;
    nbvAtDisposal: number;
    gainLoss: number;
    journalId: string;
    status: 'pending' | 'approved' | 'posted';
    approvedBy?: string;
}

interface ImpairmentRecord {
    id: string;
    assetId: string;
    date: string;
    amount: number;
    journalId: string;
    type: 'impairment' | 'revaluation';
    status: 'posted' | 'reversed';
}

// ── INITIAL DATA ───────────────────────────────────────────────────────────────
const INITIAL_ASSETS: Asset[] = [
    {
        id: 'FA-001', name: 'CNC Laser Cutter', class: 'Machinery', acquired: '2024-06-15', cost: 480000,
        depMethod: 'Straight Line', usefulLife: 10, accDep: 96000, nbv: 384000, status: 'active',
        salvageValue: 20000, depStartDate: '2024-07-01', capDate: '2024-06-30',
        glAsset: '1500-01', glAccDep: '1550-01', glDepExp: '6500-01', costCenter: 'Manufacturing',
        location: 'Warehouse A', custodian: 'Mike R.', serialNumber: 'CNC-8821-X', tagId: 'TAG-1001'
    },
    {
        id: 'FA-002', name: 'Overhead Crane (20T)', class: 'Machinery', acquired: '2023-01-10', cost: 320000,
        depMethod: 'Reducing Balance', depRate: 15, usefulLife: 15, accDep: 64000, nbv: 256000, status: 'active',
        salvageValue: 15000, depStartDate: '2023-02-01', capDate: '2023-01-31',
        glAsset: '1500-01', glAccDep: '1550-01', glDepExp: '6500-01', costCenter: 'Logistics',
        location: 'Loading Bay 2', custodian: 'Sarah T.', serialNumber: 'CRN-20T-001', tagId: 'TAG-1002'
    },
    {
        id: 'FA-003', name: 'Warehouse Building', class: 'Building', acquired: '2022-03-01', cost: 1200000,
        depMethod: 'Straight Line', usefulLife: 30, accDep: 160000, nbv: 1040000, status: 'active',
        salvageValue: 200000, depStartDate: '2022-04-01', capDate: '2022-03-31',
        glAsset: '1600-01', glAccDep: '1650-01', glDepExp: '6600-01', costCenter: 'Corporate',
        location: 'HQ Plot', custodian: 'Admin', serialNumber: 'N/A', tagId: 'TAG-1003'
    },
    {
        id: 'FA-007', name: 'Old Welder', class: 'Machinery', acquired: '2019-04-01', cost: 28000,
        depMethod: 'Straight Line', usefulLife: 7, accDep: 28000, nbv: 0, status: 'disposed',
        salvageValue: 1000, depStartDate: '2019-05-01', capDate: '2019-04-30',
        glAsset: '1500-01', glAccDep: '1550-01', glDepExp: '6500-01', costCenter: 'Maintenance',
        location: 'Scrap Yard', custodian: 'John D.', serialNumber: 'WLD-009', tagId: 'TAG-0922'
    },
];

const INITIAL_SCHEDULE: DepScheduleItem[] = [
    { id: 'DEP-101', period: 'Jan 2026', openingNbv: 1690000, depAmount: 14208, closingNbv: 1675792, journalId: 'JE-2026-0081', status: 'posted', runBy: 'Finance Admin', timestamp: '2026-01-31T23:55:00Z' },
    { id: 'DEP-102', period: 'Feb 2026', openingNbv: 1675792, depAmount: 14208, closingNbv: 1661584, journalId: 'JE-2026-0192', status: 'posted', runBy: 'Finance Admin', timestamp: '2026-02-28T23:50:00Z' },
];

const INITIAL_DISPOSALS: DisposalRecord[] = [
    { id: 'DSP-001', assetId: 'FA-007', assetName: 'Old Welder', date: '2026-02-15', value: 2500, nbvAtDisposal: 0, gainLoss: 2500, journalId: 'JE-2026-0145', status: 'posted', approvedBy: 'Finance Director' }
];

export default function FixedAssetsPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('register');

    const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
    const [schedule, setSchedule] = useState<DepScheduleItem[]>(INITIAL_SCHEDULE);
    const [disposals, setDisposals] = useState<DisposalRecord[]>(INITIAL_DISPOSALS);
    const [impairments, setImpairments] = useState<ImpairmentRecord[]>([]);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDisposeOpen, setIsDisposeOpen] = useState(false);
    const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState<string>('');

    // ── DERIVED METRICS ──
    const activeAssets = assets.filter(a => a.status === 'active');
    const totalCost = activeAssets.reduce((s, a) => s + a.cost, 0);
    const totalNBV = activeAssets.reduce((s, a) => s + a.nbv, 0);
    const totalDep = activeAssets.reduce((s, a) => s + a.accDep, 0);
    const monthlyDep = schedule.length > 0 ? schedule[schedule.length - 1].depAmount : 0;
    const fullyDepreciatedCount = activeAssets.filter(a => a.nbv <= a.salvageValue).length;

    // ── DEPRECIATION ENGINE (Automated) ──
    // The depreciation engine is designed to run automatically at the end of each period via a scheduled background job.
    // It will calculate per asset, deduct from NBV, add to AccDep, and post a summary journal entry.

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">

                <FinancePageHeader
                    title="Fixed Assets"
                    subtitle="Enterprise Asset Register · IFRS/GAAP Depreciation · Disposals · Audit Logs"
                    icon={Cpu}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-[10px] h-8"
                                onClick={() => toast.success('Report initializing...')}
                            >
                                <Download className="h-3.5 w-3.5" /> Export
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-[10px] h-8"
                                onClick={() => setIsAddOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Asset
                            </Button>
                            <Badge variant="outline" className="h-8 flex items-center gap-1.5 bg-blue-50/50 text-blue-700 hover:bg-blue-50/50 border-blue-200">
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">Auto-Depreciation: ON</span>
                            </Badge>
                        </div>
                    }
                />

                {/* Executive Dashboard KPI Strip */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                    <KpiCard label="Gross CAPEX" value={fmt(totalCost)} />
                    <KpiCard label="Accum. Depreciation" value={fmt(totalDep)} />
                    <KpiCard label="Net Book Value" value={fmt(totalNBV)} />
                    <KpiCard label="Last Period Dep." value={fmt(monthlyDep)} />
                    <KpiCard
                        label="Fully Depreciated"
                        value={String(fullyDepreciatedCount)}
                        warn={fullyDepreciatedCount > 0}
                        footer="Still active/in use"
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="register" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Asset Master</TabsTrigger>
                        <TabsTrigger value="depreciation" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Depreciation Engine</TabsTrigger>
                        <TabsTrigger value="disposal" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Disposals & Workflow</TabsTrigger>
                        <TabsTrigger value="audit" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-muted-foreground">Audit Log</TabsTrigger>
                    </TabsList>

                    {/* ── ASSET MASTER REGISTER ── */}
                    <TabsContent value="register" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <ScrollArea className="w-full">
                                    <div className="min-w-[1200px] divide-y border-t">
                                        <FinanceTableHeader>
                                            <span className="col-span-1">Tag ID</span>
                                            <span className="col-span-2">Asset Master</span>
                                            <span className="col-span-1 text-xs">Cost Center</span>
                                            <span className="col-span-1 text-xs">Cap. Date</span>
                                            <span className="col-span-1 text-center text-xs">Method</span>
                                            <span className="col-span-2 text-right text-xs">Gross Cost</span>
                                            <span className="col-span-1 text-right text-xs">Salvage Val.</span>
                                            <span className="col-span-1 text-right text-xs">NBV</span>
                                            <span className="col-span-1 text-right text-xs">GL (Asset)</span>
                                            <span className="col-span-1 text-right text-xs">Status</span>
                                        </FinanceTableHeader>

                                        {assets.map(a => (
                                            <div key={a.id} className={cn("grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm", a.status === 'disposed' && 'opacity-50')}>
                                                <span className="col-span-1 font-mono text-xs text-red-600">{a.tagId}</span>
                                                <span className="col-span-2 text-xs font-medium truncate flex flex-col">
                                                    <span>{a.name}</span>
                                                    <span className="text-[9px] text-muted-foreground font-mono">{a.id} • {a.class}</span>
                                                </span>
                                                <span className="col-span-1 text-[10px] text-muted-foreground">{a.costCenter}</span>
                                                <span className="col-span-1 text-[10px] text-muted-foreground">{a.capDate}</span>
                                                <span className="col-span-1 text-center">
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase tracking-wider bg-white">
                                                        {a.depMethod === 'Straight Line' ? 'SL' : 'RB'} {a.depRate ? `(${a.depRate}%)` : `(${a.usefulLife}y)`}
                                                    </Badge>
                                                </span>
                                                <span className="col-span-2 text-right text-xs font-bold">{fmt(a.cost)}</span>
                                                <span className="col-span-1 text-right text-[10px] text-muted-foreground">{fmt(a.salvageValue)}</span>
                                                <span className="col-span-1 text-right text-xs font-bold text-emerald-600">
                                                    {a.nbv <= a.salvageValue && a.status === 'active' && <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />}
                                                    {fmt(a.nbv)}
                                                </span>
                                                <span className="col-span-1 text-right text-[10px] font-mono text-muted-foreground">{a.glAsset}</span>
                                                <span className="col-span-1 text-right">
                                                    <Badge variant={a.status === 'active' ? 'default' : a.status === 'impaired' ? 'destructive' : 'secondary'} className="text-[8px] h-4 px-1.5 uppercase tracking-wider">
                                                        {a.status}
                                                    </Badge>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── DEPRECIATION SCHEDULE ── */}
                    <TabsContent value="depreciation" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-1">Run ID</span>
                                        <span className="col-span-2">Period</span>
                                        <span className="col-span-2 text-right">Opening NBV</span>
                                        <span className="col-span-2 text-right">Depreciation Exp.</span>
                                        <span className="col-span-2 text-right">Closing NBV</span>
                                        <span className="col-span-1 text-center">Journal ID</span>
                                        <span className="col-span-2 text-right">Status / Run By</span>
                                    </FinanceTableHeader>

                                    {[...schedule].reverse().map((d) => (
                                        <div key={d.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 text-[10px] font-mono text-muted-foreground">{d.id}</span>
                                            <span className="col-span-2 text-xs font-bold">{d.period}</span>
                                            <span className="col-span-2 text-right text-xs text-muted-foreground">{fmt(d.openingNbv)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold text-red-600">{fmt(d.depAmount)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(d.closingNbv)}</span>
                                            <span className="col-span-1 text-center font-mono text-[9px] text-blue-600 hover:underline cursor-pointer">{d.journalId}</span>
                                            <div className="col-span-2 flex flex-col items-end">
                                                <Badge variant={d.status === 'posted' ? 'outline' : 'secondary'} className={cn("text-[8px] h-4 px-1.5 uppercase", d.status === 'posted' && "border-emerald-300 text-emerald-600 bg-emerald-50")}>
                                                    {d.status}
                                                </Badge>
                                                <span className="text-[9px] text-muted-foreground mt-1">{d.runBy}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── DISPOSAL WORKFLOW ── */}
                    <TabsContent value="disposal" className="mt-6">
                        <div className="flex justify-end mb-4">
                            <Button size="sm" variant="outline" className="text-xs h-8 gap-2" onClick={() => setIsDisposeOpen(true)}>
                                <Trash2 className="h-3.5 w-3.5" /> Initialize Disposal
                            </Button>
                        </div>
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-1">ID</span>
                                        <span className="col-span-2">Asset</span>
                                        <span className="col-span-1">Date</span>
                                        <span className="col-span-2 text-right">NBV at Disposal</span>
                                        <span className="col-span-2 text-right">Disposal Value</span>
                                        <span className="col-span-1 text-right">Gain / Loss</span>
                                        <span className="col-span-1 text-center">Journal</span>
                                        <span className="col-span-2 text-right">Workflow Status</span>
                                    </FinanceTableHeader>

                                    {disposals.map((d) => (
                                        <div key={d.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-[10px] text-muted-foreground">{d.id}</span>
                                            <div className="col-span-2 flex flex-col">
                                                <span className="text-xs font-bold">{d.assetName}</span>
                                                <span className="text-[9px] text-muted-foreground font-mono">{d.assetId}</span>
                                            </div>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{d.date}</span>
                                            <span className="col-span-2 text-right text-xs">{fmt(d.nbvAtDisposal)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(d.value)}</span>
                                            <span className={cn("col-span-1 text-right text-xs font-bold", d.gainLoss >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {d.gainLoss > 0 ? "+" : ""}{fmt(d.gainLoss)}
                                            </span>
                                            <span className="col-span-1 text-center font-mono text-[9px] text-blue-600 hover:underline cursor-pointer">{d.journalId}</span>
                                            <div className="col-span-2 flex flex-col items-end">
                                                <Badge className="text-[8px] h-4 px-1.5 uppercase bg-slate-800 tracking-wider">
                                                    {d.status}
                                                </Badge>
                                                {d.approvedBy && <span className="text-[9px] text-muted-foreground mt-1">Appr: {d.approvedBy}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {disposals.length === 0 && (
                                        <FinanceEmptyState icon={FileText} title="No disposals" description="No asset disposal workflows initiated." />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── AUDIT LOG ── */}
                    <TabsContent value="audit" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm">Audit Trail</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    {schedule.map(s => (
                                        <div key={'audit-' + s.id} className="px-6 py-3 flex items-center justify-between text-xs hover:bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                <span className="font-mono text-[10px] text-muted-foreground">{new Date(s.timestamp).toLocaleString()}</span>
                                                <span>System posted depreciation run for <b>{s.period}</b></span>
                                            </div>
                                            <span className="text-muted-foreground">User: {s.runBy}</span>
                                        </div>
                                    ))}
                                    <div className="px-6 py-3 flex items-center justify-between text-xs hover:bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="font-mono text-[10px] text-muted-foreground">2026-02-15 10:30:00</span>
                                            <span>Asset <b>FA-007 (Old Welder)</b> was disposed. Workflow approved.</span>
                                        </div>
                                        <span className="text-muted-foreground">User: Finance Director</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modals for Add & Dispose would usually go here, simplified for structure limit */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Fixed Asset Master</DialogTitle>
                        <DialogDescription>Create a new asset record following IFRS guidelines.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-xs">Asset Name</Label><Input className="h-8 text-xs" placeholder="e.g. Forklift" /></div>
                            <div className="space-y-2"><Label className="text-xs">Class</Label><Input className="h-8 text-xs" placeholder="Machinery" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-xs">Gross Cost</Label><Input type="number" className="h-8 text-xs" placeholder="0.00" /></div>
                            <div className="space-y-2"><Label className="text-xs">Salvage Value</Label><Input type="number" className="h-8 text-xs" placeholder="0.00" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-xs">Depreciation Method</Label>
                                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="sl">Straight Line</SelectItem><SelectItem value="rb">Reducing Balance</SelectItem></SelectContent></Select>
                            </div>
                            <div className="space-y-2"><Label className="text-xs">Useful Life (Years)</Label><Input type="number" className="h-8 text-xs" /></div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Additional fields (GL codes, tracking info) are available in the expanded form.</p>
                    </div>
                    <DialogFooter><Button onClick={() => setIsAddOpen(false)}>Save Asset</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
