'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    TrendingUp, ShieldAlert, Zap, Clock,
    Plus, Trash2, Edit2, Scale, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ARConfigData {
    defaultCreditTerms: string;
    creditLimitEnforcement: 'soft' | 'hard' | 'none';
    agingBuckets: { label: string; days: number }[];
    riskThresholds: {
        low: number;
        medium: number;
        high: number;
    };
    automations: {
        autoDunning: boolean;
        autoECLProvisioning: boolean;
        autoChargeLateFees: boolean;
    };
    glMapping: {
        receivableAccount: string;
        revenueAccount: string;
        badDebtAccount: string;
        taxAccount: string;
    };
}

interface AccountsReceivableConfigProps {
    value?: ARConfigData;
    onChange: (value: ARConfigData) => void;
}

const DEFAULT_AR_CONFIG: ARConfigData = {
    defaultCreditTerms: 'Net 30',
    creditLimitEnforcement: 'hard',
    agingBuckets: [
        { label: 'Current', days: 0 },
        { label: '1-30 Days', days: 30 },
        { label: '31-60 Days', days: 60 },
        { label: '61-90 Days', days: 90 },
        { label: '90+ Days', days: 91 },
    ],
    riskThresholds: {
        low: 5,
        medium: 15,
        high: 30,
    },
    automations: {
        autoDunning: true,
        autoECLProvisioning: true,
        autoChargeLateFees: false,
    },
    glMapping: {
        receivableAccount: '1200',
        revenueAccount: '4000',
        badDebtAccount: '6100',
        taxAccount: '2200',
    }
};

export function AccountsReceivableConfig({ value, onChange }: AccountsReceivableConfigProps) {
    const [config, setConfig] = useState<ARConfigData>(value || DEFAULT_AR_CONFIG);

    const emit = (patch: Partial<ARConfigData>) => {
        const full: ARConfigData = { ...config, ...patch };
        setConfig(full);
        onChange(full);
    };

    return (
        <Tabs defaultValue="policy" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="policy" className="text-[10px] font-black uppercase tracking-widest">Credit Policy</TabsTrigger>
                <TabsTrigger value="aging" className="text-[10px] font-black uppercase tracking-widest">Aging & Risk</TabsTrigger>
                <TabsTrigger value="automation" className="text-[10px] font-black uppercase tracking-widest">Automations</TabsTrigger>
                <TabsTrigger value="gl" className="text-[10px] font-black uppercase tracking-widest">GL Mapping</TabsTrigger>
            </TabsList>
            {/* ── CREDIT POLICY ── */}
            <TabsContent value="policy" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <Scale className="h-4 w-4" />
                                </div>
                                Credit Matrix Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Default Credit Terms</Label>
                                <Select
                                    value={config.defaultCreditTerms}
                                    onValueChange={v => emit({ defaultCreditTerms: v })}
                                >
                                    <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                                        <SelectItem value="Net 45">Net 45 Days</SelectItem>
                                        <SelectItem value="Net 60">Net 60 Days</SelectItem>
                                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Enforcement Protocol</Label>
                                <Select
                                    value={config.creditLimitEnforcement}
                                    onValueChange={v => emit({ creditLimitEnforcement: v as any })}
                                >
                                    <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hard">Hard Block (Prevent Posting)</SelectItem>
                                        <SelectItem value="soft">Soft Warning (Notify User)</SelectItem>
                                        <SelectItem value="none">No Enforcement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-red-50/30 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                Risk Safeguards
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Automatic Account Lock</Label>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Immediate cease on high risk</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Override Approval Flow</Label>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Senior mandate for limit breaches</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── AGING & RISK ── */}
            <TabsContent value="aging" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                Expected Credit Loss (ECL)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Statistical risk provisioning thresholds</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Low Risk (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                className="h-11 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 pr-8"
                                                value={config.riskThresholds.low}
                                                onChange={e => emit({ riskThresholds: { ...config.riskThresholds, low: Number(e.target.value) } })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">Medium Risk (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                className="h-11 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 pr-8"
                                                value={config.riskThresholds.medium}
                                                onChange={e => emit({ riskThresholds: { ...config.riskThresholds, medium: Number(e.target.value) } })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-red-600">High Risk (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                className="h-11 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 pr-8"
                                                value={config.riskThresholds.high}
                                                onChange={e => emit({ riskThresholds: { ...config.riskThresholds, high: Number(e.target.value) } })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-white">
                                    <Clock className="h-4 w-4" />
                                </div>
                                Aging Buckets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {config.agingBuckets.map((b, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-700">{b.label}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Maturation Zone</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-7 px-3 font-black uppercase tracking-widest bg-white border-slate-200">{b.days} Days+</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── AUTOMATION ── */}
            <TabsContent value="automation" className="space-y-6 animate-in fade-in duration-500">
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b py-5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="h-7 w-7 rounded bg-amber-500 flex items-center justify-center text-white">
                                <Zap className="h-4 w-4" />
                            </div>
                            Autonomous AR Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <ARAutomationToggle
                                label="Strategic Dunning Protocols"
                                desc="Automatically send omni-channel reminders before and after maturity dates."
                                active={config.automations.autoDunning}
                                onToggle={v => emit({ automations: { ...config.automations, autoDunning: v } })}
                            />
                            <ARAutomationToggle
                                label="Dynamic ECL Provisioning"
                                desc="Auto-calculate and post-provisioning journals based on real-time aging data."
                                active={config.automations.autoECLProvisioning}
                                onToggle={v => emit({ automations: { ...config.automations, autoECLProvisioning: v } })}
                            />
                            <ARAutomationToggle
                                label="Penalty & Interest Posting"
                                desc="Automatically audit late-paying accounts and post statutory interest fees."
                                active={config.automations.autoChargeLateFees}
                                onToggle={v => emit({ automations: { ...config.automations, autoChargeLateFees: v } })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── GL MAPPING ── */}
            <TabsContent value="gl" className="space-y-6 animate-in fade-in duration-500">
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b py-5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
                                <Lock className="h-4 w-4" />
                            </div>
                            Core Operational Ledger
                        </CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Default GL integration for autonomous posting</p>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <ARGLInput
                                label="Receivable Control Root"
                                value={config.glMapping.receivableAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, receivableAccount: v } })}
                            />
                            <ARGLInput
                                label="Standard Revenue Node"
                                value={config.glMapping.revenueAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, revenueAccount: v } })}
                            />
                            <ARGLInput
                                label="Allowance (Bad Debt) Account"
                                value={config.glMapping.badDebtAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, badDebtAccount: v } })}
                            />
                            <ARGLInput
                                label="Sales Output VAT (Liability)"
                                value={config.glMapping.taxAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, taxAccount: v } })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs >
    );
}

function ARAutomationToggle({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-6 transition-all hover:bg-slate-50 relative group">
            <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-tight text-slate-700">{label}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-relaxed max-w-[480px]">{desc}</p>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} />
        </div>
    );
}

function ARGLInput({ label, value, onChange }: any) {
    return (
        <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">{label}</Label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 font-mono text-[10px] font-black opacity-40 group-hover:opacity-100 transition-opacity">GL</div>
                <Input
                    className="h-12 pl-12 font-mono text-xs font-black rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-red-500/10 transition-all shadow-inner"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
