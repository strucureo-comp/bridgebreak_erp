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
    ShoppingCart, ShieldCheck, Zap, Clock,
    FileText, Calculator, Truck, Scale, Lock,
    ArrowDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface APConfigData {
    defaultPaymentTerms: string;
    procurementMatching: '3-way' | '2-way' | 'none';
    agingBuckets: { label: string; days: number }[];
    autoPostBills: boolean;
    paymentThresholds: {
        requireApprovalAbove: number;
        highPriorityDays: number;
    };
    automations: {
        autoSchedulePayments: boolean;
        documentCapture: boolean;
        vatReconciliation: boolean;
    };
    glMapping: {
        payableAccount: string;
        expenseAccount: string;
        taxAccount: string;
        discountAccount: string;
    };
}

interface AccountsPayableConfigProps {
    value?: APConfigData;
    onChange: (value: APConfigData) => void;
}

const DEFAULT_AP_CONFIG: APConfigData = {
    defaultPaymentTerms: 'Net 30',
    procurementMatching: '3-way',
    agingBuckets: [
        { label: 'Current', days: 0 },
        { label: '1-30 Days', days: 30 },
        { label: '31-60 Days', days: 60 },
        { label: '61-90 Days', days: 90 },
        { label: '90+ Days', days: 91 },
    ],
    autoPostBills: false,
    paymentThresholds: {
        requireApprovalAbove: 10000,
        highPriorityDays: 5,
    },
    automations: {
        autoSchedulePayments: true,
        documentCapture: true,
        vatReconciliation: true,
    },
    glMapping: {
        payableAccount: '2000',
        expenseAccount: '5000',
        taxAccount: '2100',
        discountAccount: '4200',
    }
};

export function AccountsPayableConfig({ value, onChange }: AccountsPayableConfigProps) {
    const [config, setConfig] = useState<APConfigData>(value || DEFAULT_AP_CONFIG);

    const emit = (patch: Partial<APConfigData>) => {
        const full: APConfigData = { ...config, ...patch };
        setConfig(full);
        onChange(full);
    };

    return (
        <Tabs defaultValue="procurement" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="procurement" className="text-[10px] font-black uppercase tracking-widest">Procurement & Terms</TabsTrigger>
                <TabsTrigger value="workflow" className="text-[10px] font-black uppercase tracking-widest">Payment Workflow</TabsTrigger>
                <TabsTrigger value="automation" className="text-[10px] font-black uppercase tracking-widest">Intelligence</TabsTrigger>
                <TabsTrigger value="gl" className="text-[10px] font-black uppercase tracking-widest">GL Mapping</TabsTrigger>
            </TabsList>
            {/* ── PROCUREMENT & TERMS ── */}
            <TabsContent value="procurement" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                </div>
                                Settlement Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Default Purchase Terms</Label>
                                <Select
                                    value={config.defaultPaymentTerms}
                                    onValueChange={v => emit({ defaultPaymentTerms: v })}
                                >
                                    <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CIA">Cash in Advance</SelectItem>
                                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                                        <SelectItem value="Net 60">Net 60 Days</SelectItem>
                                        <SelectItem value="EOM">End of Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Bill Matching Protocol</Label>
                                <Select
                                    value={config.procurementMatching}
                                    onValueChange={v => emit({ procurementMatching: v as any })}
                                >
                                    <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3-way">3-Way Match (Bill vs PO vs GRN)</SelectItem>
                                        <SelectItem value="2-way">2-Way Match (Bill vs PO)</SelectItem>
                                        <SelectItem value="none">No Forced Matching</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-red-50/30 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                Disbursement Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Auto-Post Approved Bills</Label>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Immediate liability recognition</p>
                                    </div>
                                    <Switch
                                        checked={config.autoPostBills}
                                        onCheckedChange={v => emit({ autoPostBills: v })}
                                    />
                                </div>
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Threshold Approval Limit (AED)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="h-11 pl-4 font-mono text-xs font-black rounded-lg border-slate-100 bg-slate-50/50"
                                            value={config.paymentThresholds.requireApprovalAbove}
                                            onChange={e => emit({ paymentThresholds: { ...config.paymentThresholds, requireApprovalAbove: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1">Senior finance mandate required above threshold</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── WORKFLOW ── */}
            <TabsContent value="workflow" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
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
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white">
                                    <ArrowDownLeft className="h-4 w-4" />
                                </div>
                                Disbursement Prioritization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Target Settlement Horizon</Label>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <Input
                                            type="number"
                                            className="h-11 w-24 text-center font-black text-xs rounded-lg border-slate-200"
                                            value={config.paymentThresholds.highPriorityDays}
                                            onChange={e => emit({ paymentThresholds: { ...config.paymentThresholds, highPriorityDays: Number(e.target.value) } })}
                                        />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-700">Days Pre-Maturity</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Flag bills for priority payment run</p>
                                        </div>
                                    </div>
                                </div>
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
                            Autonomous Procurement Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <APAutomationToggle
                                label="Document Intelligence (OCR)"
                                desc="Extract bill details automatically from PDF uploads and emails with High-Confidence AI."
                                active={config.automations.documentCapture}
                                onToggle={(v: boolean) => emit({ automations: { ...config.automations, documentCapture: v } })}
                                icon={<FileText className="h-4 w-4" />}
                            />
                            <APAutomationToggle
                                label="Predictive Payment Scheduling"
                                desc="Queue approved bills for payment runs based on due date and optimal treasury liquidity."
                                active={config.automations.autoSchedulePayments}
                                onToggle={(v: boolean) => emit({ automations: { ...config.automations, autoSchedulePayments: v } })}
                                icon={<Calculator className="h-4 w-4" />}
                            />
                            <APAutomationToggle
                                label="VAT Input Reconciliation"
                                desc="Cross-reference input tax claims with government portal exports for statutory compliance."
                                active={config.automations.vatReconciliation}
                                onToggle={(v: boolean) => emit({ automations: { ...config.automations, vatReconciliation: v } })}
                                icon={<Scale className="h-4 w-4" />}
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
                            Payables Financial Matrix
                        </CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Default ledger accounts for supply chain and procurement</p>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <GLInput
                                label="Accounts Payable Control"
                                value={config.glMapping.payableAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, payableAccount: v } })}
                            />
                            <GLInput
                                label="Standard Expense Accord"
                                value={config.glMapping.expenseAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, expenseAccount: v } })}
                            />
                            <GLInput
                                label="Input VAT (Asset/Recoverable)"
                                value={config.glMapping.taxAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, taxAccount: v } })}
                            />
                            <GLInput
                                label="Early Settlement Discounts"
                                value={config.glMapping.discountAccount}
                                onChange={(v: string) => emit({ glMapping: { ...config.glMapping, discountAccount: v } })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs >
    );
}

function APAutomationToggle({ label, desc, active, onToggle, icon }: { label: string; desc: string; active: boolean; onToggle: (v: boolean) => void; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-6 transition-all hover:bg-slate-50 relative group">
            <div className="flex gap-4">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors shadow-sm">
                    {icon}
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-tight text-slate-700">{label}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-relaxed max-w-[480px]">{desc}</p>
                </div>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} />
        </div>
    );
}

function GLInput({ label, value, onChange }: any) {
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
