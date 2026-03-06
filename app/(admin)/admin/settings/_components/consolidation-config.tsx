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
    Network, Globe, Link2,
    ShieldCheck, BarChart4, Scaling,
    ArrowLeftRight, Landmark, FileJson,
    GitBranch, Database, LayoutGrid,
    Loader2, CheckCircle2, Lock, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ConsolidationConfigData {
    entities: Array<{
        id: string;
        code: string;
        name: string;
        currency: string;
        functionalCurrency: string;
        country: string;
        taxJurisdiction: string;
        ownershipPercentage: number;
        method: 'full' | 'equity' | 'proportionate';
    }>;
    eliminationRules: {
        autoEliminateIC: boolean;
        profitElimination: boolean;
        threshold: number;
    };
    glMapping: {
        icClearingAccount: string;
        fxTranslationGain: string;
        fxTranslationLoss: string;
        minorityInterest: string;
    };
    consolidationFrequency: 'monthly' | 'quarterly' | 'annual';
}

interface ConsolidationConfigProps {
    value: ConsolidationConfigData;
    onChange: (value: ConsolidationConfigData) => void;
}

export function ConsolidationConfig({ value, onChange }: ConsolidationConfigProps) {
    const [activeSubTab, setActiveSubTab] = useState('entities');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStep, setSimStep] = useState(0);
    const [simStatus, setSimStatus] = useState<any>({});

    const steps = [
        { id: 'aggregation', title: 'Data Aggregation', desc: 'Syncing sub-ledgers from all 3 entities' },
        { id: 'fx', title: 'FX Translation', desc: 'Applying spot & average rates (AED/GBP/USD)' },
        { id: 'elimination', title: 'IC Elimination', desc: 'Executing Source-Mirror matching logic' },
        { id: 'final', title: 'Group Close', desc: 'Locking period for consolidated reporting' }
    ];

    const runSimulation = async () => {
        setIsSimulating(true);
        setSimStep(0);
        setSimStatus({});

        for (let i = 0; i < steps.length; i++) {
            setSimStep(i);
            const stepId = steps[i].id;
            setSimStatus((prev: any) => ({ ...prev, [stepId]: 'running' }));

            // Artificial delay to simulate heavy processing
            await new Promise(r => setTimeout(r, 1500));

            setSimStatus((prev: any) => ({ ...prev, [stepId]: 'done' }));
        }

        toast.success('Simulation Complete: Group Ledger Synchronized');
        setTimeout(() => setIsSimulating(false), 2000);
    };

    const toggleEntityMethod = (id: string, method: ConsolidationConfigData['entities'][0]['method']) => {
        const newEntities = value.entities.map(e => e.id === id ? { ...e, method } : e);
        onChange({ ...value, entities: newEntities });
    };

    const updateMapping = (key: keyof ConsolidationConfigData['glMapping'], val: string) => {
        onChange({
            ...value,
            glMapping: { ...value.glMapping, [key]: val }
        });
    };

    const handleAddEntity = () => {
        const newId = Date.now().toString();
        onChange({
            ...value,
            entities: [
                ...value.entities,
                { id: newId, code: 'NEW', name: 'New Entity', currency: 'AED', functionalCurrency: 'AED', country: 'UAE', taxJurisdiction: 'DUBAI', ownershipPercentage: 100, method: 'full' }
            ]
        });
        toast.success('New entity row added');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-full">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                    <TabsList className="bg-slate-100/50 border p-1 rounded-xl h-12 w-max inline-flex">
                        <TabsTrigger value="entities" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                            Entity Hierarchy
                        </TabsTrigger>
                        <TabsTrigger value="elimination" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                            Elimination Engine
                        </TabsTrigger>
                        <TabsTrigger value="fx" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                            FX Translation
                        </TabsTrigger>
                        <TabsTrigger value="reporting" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                            Consolidation Master
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- 1. ENTITY HIERARCHY --- */}
                <TabsContent value="entities" className="space-y-6 mt-0">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5 px-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center text-white">
                                    <Network className="h-4 w-4" />
                                </div>
                                Multi-Entity Corporate Backbone
                            </CardTitle>
                            <Button onClick={handleAddEntity} size="sm" className="h-8 bg-slate-900 hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                Register New Entity
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b">
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Code</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Legal Entity</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Jurisdiction</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-center">Ownership</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Basis</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-left">Consolidation Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {value.entities.map((entity) => (
                                            <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6 text-[10px] font-black text-indigo-600">{entity.code}</td>
                                                <td className="py-4 px-6">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-800">{entity.name}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{entity.functionalCurrency} / {entity.currency}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entity.country} - {entity.taxJurisdiction}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] font-black text-slate-800">{entity.ownershipPercentage}%</span>
                                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-red-600" style={{ width: `${entity.ownershipPercentage}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 bg-slate-50 text-slate-500 h-5">
                                                        GAAP
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Select value={entity.method} onValueChange={(v: any) => toggleEntityMethod(entity.id, v)}>
                                                        <SelectTrigger className="h-8 w-40 font-black text-[9px] uppercase border-slate-100 bg-slate-50/50 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full" className="text-[9px] font-black uppercase">Full Consolidation</SelectItem>
                                                            <SelectItem value="equity" className="text-[9px] font-black uppercase">Equity Method</SelectItem>
                                                            <SelectItem value="proportionate" className="text-[9px] font-black uppercase text-indigo-600">Proportionate</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 2. ELIMINATION ENGINE --- */}
                <TabsContent value="elimination" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-muted/10 border-b py-5 px-8">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                        <ArrowLeftRight className="h-4 w-4" />
                                    </div>
                                    Intercompany Elimination Protocol
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <ConsolidationToggle
                                    label="Autonomous IC Elimination"
                                    desc="Auto-purge matching IC balances on close"
                                    active={value.eliminationRules.autoEliminateIC}
                                    onToggle={(v: boolean) => onChange({ ...value, eliminationRules: { ...value.eliminationRules, autoEliminateIC: v } })}
                                />
                                <ConsolidationToggle
                                    label="Unrealized Profit Purge"
                                    desc="Eliminate stock profit on IC transfers"
                                    active={value.eliminationRules.profitElimination}
                                    onToggle={(v: boolean) => onChange({ ...value, eliminationRules: { ...value.eliminationRules, profitElimination: v } })}
                                />

                                <div className="pt-4 space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Tolerance Threshold (Elimination Variance)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={value.eliminationRules.threshold}
                                            onChange={(e) => onChange({ ...value, eliminationRules: { ...value.eliminationRules, threshold: parseFloat(e.target.value) } })}
                                            className="h-11 w-24 rounded-lg border-slate-100 font-black text-xs bg-slate-50 shadow-inner"
                                        />
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px]">Maximum allowed IC mismatch before manual audit trigger</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-md rounded-xl overflow-hidden bg-slate-900 text-white relative">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <GitBranch size={100} />
                            </div>
                            <CardContent className="p-8 space-y-8 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">IC Transaction Flow</p>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Source-Mirror Synchronization</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                        <div className="flex items-center gap-3 text-emerald-400">
                                            <div className="h-5 w-5 rounded bg-emerald-400/20 flex items-center justify-center">
                                                <Link2 className="h-3 w-3" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest">Active Links</p>
                                        </div>
                                        <p className="text-xl font-black uppercase tracking-tight">24 Channels</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                        <div className="flex items-center gap-3 text-red-400">
                                            <div className="h-5 w-5 rounded bg-red-400/20 flex items-center justify-center">
                                                <Scaling className="h-3 w-3" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest">Mismatch</p>
                                        </div>
                                        <p className="text-xl font-black uppercase tracking-tight">AED 0.00</p>
                                    </div>
                                </div>

                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Source Entity Transactions (Source) automatically spawn "Mirror/Shadow" entries in the Target Entity ledger with IC Clearing accounts mapped.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- 3. FX TRANSLATION --- */}
                <TabsContent value="fx" className="space-y-6 mt-0">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5 px-8">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
                                    <Globe className="h-4 w-4" />
                                </div>
                                Currency Translation & CTA Calibration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <LedgerInput label="IC Clearing Account" value={value.glMapping.icClearingAccount} onChange={v => updateMapping('icClearingAccount', v)} />
                                <LedgerInput label="FX Translation Gain" value={value.glMapping.fxTranslationGain} onChange={v => updateMapping('fxTranslationGain', v)} />
                                <LedgerInput label="FX Translation Loss" value={value.glMapping.fxTranslationLoss} onChange={v => updateMapping('fxTranslationLoss', v)} />
                                <LedgerInput label="Non-Controlling Interest" value={value.glMapping.minorityInterest} onChange={v => updateMapping('minorityInterest', v)} />
                            </div>


                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 4. CONSOLIDATION MASTER --- */}
                <TabsContent value="reporting" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border shadow-md rounded-xl overflow-hidden bg-white p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Period Consolidation Run</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Execute multi-entity financial translation</p>
                                </div>
                                <Select value={value.consolidationFrequency} onValueChange={(v: any) => onChange({ ...value, consolidationFrequency: v })}>
                                    <SelectTrigger className="h-10 w-44 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly" className="text-[10px] font-black uppercase">Monthly Alignment</SelectItem>
                                        <SelectItem value="quarterly" className="text-[10px] font-black uppercase">Quarterly Close</SelectItem>
                                        <SelectItem value="annual" className="text-[10px] font-black uppercase">Annual Audit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Translation Layer</p>
                                    <div className="h-24 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-4">
                                        <BarChart4 className="h-6 w-6 text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black text-slate-800 uppercase">F/S Mapping</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Currency Bridge</p>
                                    <div className="h-24 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center p-4">
                                        <Globe className="h-6 w-6 text-indigo-400 mb-2" />
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Spot/Avg Lock</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Security Verification</p>
                                    <div className="h-24 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center p-4">
                                        <ShieldCheck className="h-6 w-6 text-emerald-400 mb-2" />
                                        <p className="text-[10px] font-black text-emerald-600 uppercase">Audit Ready</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-border shadow-md rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-center p-8 space-y-6 relative">
                            {isSimulating && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                                    <div className="w-full max-w-xs space-y-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 mt-2">Simulation In Progress</p>
                                        </div>

                                        <div className="space-y-4">
                                            {steps.map((s, idx) => (
                                                <div key={idx} className={cn(
                                                    "flex items-center gap-4 transition-all duration-500",
                                                    simStep >= idx ? "opacity-100" : "opacity-30 translate-x-4"
                                                )}>
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                        simStatus[s.id] === 'done' ? "bg-emerald-500 text-white" :
                                                            simStatus[s.id] === 'running' ? "bg-red-600 text-white animate-pulse" : "bg-slate-200 text-slate-500"
                                                    )}>
                                                        {simStatus[s.id] === 'done' ? <CheckCircle2 size={12} /> : idx + 1}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-800">{s.title}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400">
                                    {simStatus.final === 'done' ? <Lock className="h-8 w-8 text-emerald-500" /> : <LayoutGrid className="h-8 w-8" />}
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {simStatus.final === 'done' ? 'PERIOD SECURED' : 'Ready for Consolidation'}
                                </p>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Group Reporting Hub</h4>
                            </div>
                            <Button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-slate-200"
                            >
                                {isSimulating ? 'Processing...' : 'Launch Consolidation Workflow'}
                            </Button>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: 'Consolidated P&L', desc: 'Group-wide revenue & expense translation', status: 'READY', icon: BarChart4, color: 'emerald' },
                            { title: 'Group Balance Sheet', desc: 'Eliminated assets & liabilities view', status: 'READY', icon: Landmark, color: 'indigo' },
                            { title: 'Intercompany Matrix', desc: 'Entity-to-entity transaction matching', status: 'AUDIT', icon: Network, color: 'red' },
                            { title: 'CTA Movement', desc: 'FX translation adjustment log', status: 'READY', icon: Globe, color: 'slate' }
                        ].map((template, idx) => (
                            <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-red-600/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                    template.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                        template.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                            template.color === 'red' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
                                )}>
                                    <template.icon size={20} />
                                </div>
                                <div className="space-y-1 mb-4">
                                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 leading-none">{template.title}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{template.desc}</p>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-black tracking-[0.2em] h-5 px-3",
                                    template.status === 'READY' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-amber-100 text-amber-600 bg-amber-50"
                                )}>
                                    {template.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ConsolidationToggle({ label, desc, active, onToggle }: any) {
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
