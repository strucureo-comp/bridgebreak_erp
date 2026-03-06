'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Cpu, Calendar, Landmark,
    RefreshCcw, ShieldCheck, Scale,
    Settings2, Globe, Lock, BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FinanceEngineConfig {
    accountingBasis: 'accrual' | 'cash';
    fiscalYearStart: string;
    reportingCurrency: string;
    multiCurrencyEnabled: boolean;
    autoJournalPosting: boolean;
    toleranceLevel: number;
    backdatingRestricted: boolean;
    periodLocking: {
        currentPeriod: string;
        isLocked: boolean;
    };
    integrationState: {
        inventoryCOGS: boolean;
        taxAutoProvision: boolean;
        amortizationAuto: boolean;
    };
}

interface FinanceEngineSettingsProps {
    value: FinanceEngineConfig;
    onChange: (value: FinanceEngineConfig) => void;
}

export function FinanceEngineSettings({ value, onChange }: FinanceEngineSettingsProps) {
    const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' },
        { value: '3', label: 'March' }, { value: '4', label: 'April' },
        { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' },
        { value: '9', label: 'September' }, { value: '10', label: 'October' },
        { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

    const toggleIntegration = (key: keyof FinanceEngineConfig['integrationState']) => {
        onChange({
            ...value,
            integrationState: {
                ...value.integrationState,
                [key]: !value.integrationState[key]
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. FISCAL ORCHESTRATION */}
                <Card className="lg:col-span-2 border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-5">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                Fiscal Orchestration
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-10">Temporal controls & accounting cycle state</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white border-slate-200">FY-2026 ACTIVE</Badge>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Accounting Methodology</Label>
                                <Select value={value.accountingBasis} onValueChange={(v: 'accrual' | 'cash') => onChange({ ...value, accountingBasis: v })}>
                                    <SelectTrigger className="h-12 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="accrual" className="text-[10px] font-black uppercase">Accrual (standard)</SelectItem>
                                        <SelectItem value="cash" className="text-[10px] font-black uppercase text-red-600">Cash Basis (Simplified)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Annual Cycle Commencement</Label>
                                <Select value={value.fiscalYearStart} onValueChange={(v: string) => onChange({ ...value, fiscalYearStart: v })}>
                                    <SelectTrigger className="h-12 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value} className="text-[10px] font-black uppercase">{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                    <Lock className="h-20 w-20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Temporal Guard</p>
                                    <h4 className="text-xl font-black uppercase tracking-tight">Period Integrity Lock</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Restrict all sub-ledger postings for closed periods</p>
                                </div>
                                <div className="flex items-center gap-6 z-10">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Current Active</p>
                                        <p className="text-xs font-black uppercase tracking-widest">{months.find(m => m.value === value.periodLocking.currentPeriod)?.label} 2026</p>
                                    </div>
                                    <Switch
                                        checked={value.periodLocking.isLocked}
                                        onCheckedChange={(v: boolean) => onChange({ ...value, periodLocking: { ...value.periodLocking, isLocked: v } })}
                                        className="data-[state=checked]:bg-red-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. ENGINE COGNITION */}
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b py-5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
                                <Cpu className="h-4 w-4" />
                            </div>
                            GL Integrity Node
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-6">
                            <FinanceEngineToggle
                                label="Autonomous posting"
                                desc="Auto-commit sub-ledger to GL"
                                active={value.autoJournalPosting}
                                onToggle={(v: boolean) => onChange({ ...value, autoJournalPosting: v })}
                                icon={RefreshCcw}
                            />
                            <FinanceEngineToggle
                                label="Temporal Hard-Fence"
                                desc="Restrict backdated entries"
                                active={value.backdatingRestricted}
                                onToggle={(v: boolean) => onChange({ ...value, backdatingRestricted: v })}
                                icon={ShieldCheck}
                            />
                            <FinanceEngineToggle
                                label="Multi-Currency Engine"
                                desc="Activate global FX revaluation"
                                active={value.multiCurrencyEnabled}
                                onToggle={(v: boolean) => onChange({ ...value, multiCurrencyEnabled: v })}
                                icon={Globe}
                            />

                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Operational Variance Tolerance</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-800">
                                    {value.toleranceLevel}%
                                </div>
                                <Input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    value={value.toleranceLevel}
                                    onChange={(e) => onChange({ ...value, toleranceLevel: parseFloat(e.target.value) })}
                                    className="h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. INTEGRATION COHESION */}
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b py-5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white">
                                <BrainCircuit className="h-4 w-4" />
                            </div>
                            Module Interconnectivity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <IntegrationCard
                            label="Inventory Accounting"
                            status={value.integrationState.inventoryCOGS}
                            onToggle={() => toggleIntegration('inventoryCOGS')}
                            desc="Auto-COGS on POS/Delivery"
                        />
                        <IntegrationCard
                            label="Tax Orchestration"
                            status={value.integrationState.taxAutoProvision}
                            onToggle={() => toggleIntegration('taxAutoProvision')}
                            desc="Live VAT/GST Provisioning"
                        />
                        <IntegrationCard
                            label="Asset Intelligence"
                            status={value.integrationState.amortizationAuto}
                            onToggle={() => toggleIntegration('amortizationAuto')}
                            desc="Automated Amortization"
                        />
                    </CardContent>
                </Card>

                {/* 4. STRATEGIC POSITION */}
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white p-8 group relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <Landmark className="h-32 w-32" />
                    </div>
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Consolidation Master</p>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Entity Reporting Standard</h3>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reporting Basis</p>
                                <p className="text-sm font-black text-slate-800 uppercase">IFRS-9 / GAAP</p>
                            </div>
                            <div className="h-10 w-px bg-slate-100" />
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Functional Hub</p>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{value.reportingCurrency}</p>
                            </div>
                        </div>

                    </div>
                </Card>
            </div>
        </div>
    );
}

function FinanceEngineToggle({ label, desc, active, onToggle, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm border",
                    active ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-400 border-slate-100"
                )}>
                    <Icon size={18} />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 leading-none">{label}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{desc}</p>
                </div>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} className="data-[state=checked]:bg-red-600 h-5 w-9 scale-90" />
        </div>
    );
}

function IntegrationCard({ label, status, onToggle, desc }: any) {
    return (
        <div
            onClick={onToggle}
            className={cn(
                "cursor-pointer p-5 rounded-2xl border transition-all flex flex-col items-center gap-4 text-center group",
                status ? "border-emerald-600 bg-emerald-50/10 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"
            )}
        >
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                status ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-300"
            )}>
                <ShieldCheck size={20} className={cn(status && "animate-pulse")} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 leading-none">{label}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 leading-none">{desc}</p>
            </div>
            <Badge variant="outline" className={cn(
                "text-[8px] font-black uppercase tracking-widest h-5 px-3",
                status ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-400 border-slate-200"
            )}>
                {status ? 'CONNECTED' : 'STANDBY'}
            </Badge>
        </div>
    );
}
