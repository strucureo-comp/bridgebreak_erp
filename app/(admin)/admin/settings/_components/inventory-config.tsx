'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Package, History, BarChart3,
    Settings2, Layers, AlertCircle,
    Calculator, ArrowRightLeft, Database,
    Boxes, HardDrive, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InventoryConfigData {
    valuationMethod: 'FIFO' | 'WAC' | 'Standard' | 'MovingAverage';
    negativeStockAllowed: boolean;
    backdatedTxnsLocked: boolean;
    periodEndLock: boolean;
    cogsTrigger: 'SalesInvoice' | 'DeliveryNote' | 'Both';
    multiWarehouseCogs: boolean;
    projectBasedAccounting: boolean;
    autoRecalculateWac: boolean;
    glMapping: {
        inventoryAsset: string;
        cogsAccount: string;
        inventoryAdjustment: string;
        revaluationSurplus: string;
    };
    standardCosts: Record<string, number>;
}

interface InventoryConfigProps {
    value: InventoryConfigData;
    onChange: (value: InventoryConfigData) => void;
}

export function InventoryConfig({ value, onChange }: InventoryConfigProps) {
    const [activeSubTab, setActiveSubTab] = useState('valuation');

    const updateMapping = (key: keyof InventoryConfigData['glMapping'], val: string) => {
        onChange({
            ...value,
            glMapping: { ...value.glMapping, [key]: val }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
                <TabsList className="bg-slate-100/50 border p-1 rounded-xl h-12">
                    <TabsTrigger value="valuation" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        Valuation Engine
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        COGS & Flow
                    </TabsTrigger>
                    <TabsTrigger value="mapping" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        GL Orchestration
                    </TabsTrigger>
                    <TabsTrigger value="layers" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        Cost Layers
                    </TabsTrigger>
                </TabsList>

                {/* --- 1. VALUATION ENGINE --- */}
                <TabsContent value="valuation" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border shadow-md rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-muted/10 border-b py-5 px-8">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center text-white">
                                        <Calculator className="h-4 w-4" />
                                    </div>
                                    Valuation Methodology Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Primary Algorithm</Label>
                                        <div className="space-y-3">
                                            {[
                                                { id: 'FIFO', label: 'First-In, First-Out (FIFO)', desc: 'IFRS compliant / Layered cost tracking' },
                                                { id: 'WAC', label: 'Weighted Average Cost (WAC)', desc: 'Moving average recalculation on receipt' },
                                                { id: 'Standard', label: 'Standard Costing', desc: 'Pre-defined fixed costs with variance tracking' },
                                                { id: 'MovingAverage', label: 'Moving Average', desc: 'Real-time perpetual average updating' },
                                            ].map((method) => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => onChange({ ...value, valuationMethod: method.id as any })}
                                                    className={cn(
                                                        "p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-4",
                                                        value.valuationMethod === method.id
                                                            ? "border-red-600 bg-red-50/10 shadow-sm"
                                                            : "border-slate-100 hover:border-slate-200"
                                                    )}
                                                >
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{method.label}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-60">{method.desc}</p>
                                                    </div>
                                                    {value.valuationMethod === method.id && <Badge className="bg-red-600 text-white border-none text-[8px] h-4">ACTIVE</Badge>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Integrity Constraints</p>
                                            <InventoryToggle
                                                label="Prevent Negative Stock"
                                                desc="Hard-block transactions below zero"
                                                active={!value.negativeStockAllowed}
                                                onToggle={(v: boolean) => onChange({ ...value, negativeStockAllowed: !v })}
                                            />
                                            <InventoryToggle
                                                label="Backdated Txn Lock"
                                                desc="Restrict entries to closed periods"
                                                active={value.backdatedTxnsLocked}
                                                onToggle={(v: boolean) => onChange({ ...value, backdatedTxnsLocked: v })}
                                            />

                                        </div>

                                        <div className="rounded-2xl border-2 border-dashed border-slate-100 p-6 flex flex-col items-center text-center space-y-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                <History className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation Change History</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-md rounded-xl overflow-hidden bg-slate-900 text-white relative">
                            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                                <HardDrive size={120} />
                            </div>
                            <CardHeader className="border-b border-white/5 py-5 px-8">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center text-white">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                    Valuation Snapshot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Operational Quotient</p>
                                    <h3 className="text-3xl font-black uppercase tracking-tight">Perpetual Hub</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total SKU Value</p>
                                            <p className="text-xl font-black uppercase tracking-tight text-white">AED 4.2M</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Layers</p>
                                            <p className="text-xl font-black uppercase tracking-tight text-white">1,204</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Inventory Health Score</span>
                                            <span className="text-emerald-400">98%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-red-600 to-emerald-500 w-[98%]" />
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- 2. AUTOMATION & FLOW --- */}
                <TabsContent value="automation" className="space-y-6 mt-0">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5 px-8">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white">
                                    <Zap className="h-4 w-4" />
                                </div>
                                COGS Automation Intelligence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Accounting Recognition Trigger</Label>
                                    <Select value={value.cogsTrigger} onValueChange={(v: any) => onChange({ ...value, cogsTrigger: v })}>
                                        <SelectTrigger className="h-12 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SalesInvoice" className="text-[10px] font-black uppercase">Sales Invoice Posting</SelectItem>
                                            <SelectItem value="DeliveryNote" className="text-[10px] font-black uppercase">Delivery Note Confirmation</SelectItem>
                                            <SelectItem value="Both" className="text-[10px] font-black uppercase text-red-600">Dual Recognition (Hybrid)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-loose">Determines the EXACT temporal node when Inventory is credited and COGS is debited.</p>
                                </div>

                                <div className="space-y-6 lg:border-x border-slate-50 lg:px-8">
                                    <InventoryToggle
                                        label="Project-Based COGS"
                                        desc="Trace costs to project codes"
                                        active={value.projectBasedAccounting}
                                        onToggle={(v: boolean) => onChange({ ...value, projectBasedAccounting: v })}
                                    />
                                    <InventoryToggle
                                        label="Multi-Warehouse COGS"
                                        desc="Track cost layers by location"
                                        active={value.multiWarehouseCogs}
                                        onToggle={(v: boolean) => onChange({ ...value, multiWarehouseCogs: v })}
                                    />
                                </div>

                                <div className="space-y-4 flex flex-col justify-end">
                                    <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-6 space-y-3">
                                        <div className="flex items-center gap-3 text-indigo-600">
                                            <Boxes className="h-5 w-5" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Write-off Protocol</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-indigo-900/60 uppercase tracking-widest leading-relaxed">
                                            System auto-triggers journal entry on disposal/write-off confirmation:
                                            <br /><br />
                                            <span className="text-indigo-600 font-black">Dr Inventory Adjustment</span>
                                            <br />
                                            <span className="text-slate-400 font-black pl-4">Cr Inventory Asset</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 3. GL ORCHESTRATION --- */}
                <TabsContent value="mapping" className="space-y-6 mt-0">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5 px-8">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
                                    <Settings2 className="h-4 w-4" />
                                </div>
                                Inventory Ledger Integration Mapping
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <LedgerInput label="Inventory Asset Node" value={value.glMapping.inventoryAsset} onChange={v => updateMapping('inventoryAsset', v)} />
                                <LedgerInput label="Cost of Goods Sold (COGS)" value={value.glMapping.cogsAccount} onChange={v => updateMapping('cogsAccount', v)} />
                                <LedgerInput label="Inventory Adjustment" value={value.glMapping.inventoryAdjustment} onChange={v => updateMapping('inventoryAdjustment', v)} />
                                <LedgerInput label="Revaluation Surplus" value={value.glMapping.revaluationSurplus} onChange={v => updateMapping('revaluationSurplus', v)} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 4. COST LAYERS (VISUALIZATION) --- */}
                <TabsContent value="layers" className="space-y-6 mt-0">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5 px-8">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <Layers className="h-4 w-4" />
                                </div>
                                Perpetual Cost Layer Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b">
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Layer ID</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">SKU Node</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Inward Date</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Qty Received</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Qty Remaining</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Unit Cost (Base)</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Layer Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6 text-[10px] font-bold font-mono tracking-tighter text-slate-400">#LYR-{202400 + i}</td>
                                                <td className="py-4 px-6 text-[10px] font-black uppercase text-slate-700">ST-NODE-00{i}</td>
                                                <td className="py-4 px-6 text-[10px] font-bold text-slate-500">2024-02-{14 + i}</td>
                                                <td className="py-4 px-6 text-[10px] font-black text-right text-slate-700">{100 * i}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-100 text-emerald-600 bg-emerald-50 h-5">
                                                        {10 * i} REMAINING
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-[10px] font-black text-right text-slate-700">AED {(45.5 * i).toFixed(2)}</td>
                                                <td className="py-4 px-6 text-[10px] font-black text-right text-indigo-600">AED {(455 * i).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InventoryToggle({ label, desc, active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between py-2 group">
            <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 leading-none group-hover:text-red-600 transition-colors">{label}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-60">{desc}</p>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} className="data-[state=checked]:bg-red-600 scale-75" />
        </div>
    );
}

function LedgerInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">{label}</Label>
            <div className="relative group">
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="h-12 pl-10 rounded-xl border-slate-100 font-black text-xs uppercase tracking-[0.1em] bg-slate-50/50 focus:bg-white transition-all shadow-inner focus:ring-2 focus:ring-red-600/20"
                />
                <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
            </div>
        </div>
    );
}
