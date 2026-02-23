'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ShoppingCart, ChevronLeft, AlertTriangle, Clock, CheckCircle2, FileText, DollarSign
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

const VENDORS = [
    { id: 'V001', name: 'Al Ghurair Steel', balance: 78000, overdue: 0, paymentTerms: 'Net 30', risk: 'low' },
    { id: 'V002', name: 'XYZ Logistics', balance: 42500, overdue: 18500, paymentTerms: 'Net 15', risk: 'medium' },
    { id: 'V003', name: 'AWS Cloud Services', balance: 8200, overdue: 0, paymentTerms: 'Prepaid', risk: 'low' },
    { id: 'V004', name: 'Dubai Municipality', balance: 24000, overdue: 0, paymentTerms: 'COD', risk: 'low' },
    { id: 'V005', name: 'ABC Legal Consultants', balance: 65000, overdue: 12500, paymentTerms: 'Net 45', risk: 'medium' },
];

const BILLS = [
    { id: 'BILL-0082', vendor: 'Al Ghurair Steel', amount: 78000, due: '2026-03-10', status: 'approved', approval: '2/2' },
    { id: 'BILL-0081', vendor: 'XYZ Logistics', amount: 18500, due: '2026-02-15', status: 'overdue', approval: '2/2' },
    { id: 'BILL-0080', vendor: 'ABC Legal Consultants', amount: 12500, due: '2026-02-20', status: 'overdue', approval: '1/2' },
    { id: 'BILL-0079', vendor: 'AWS Cloud Services', amount: 8200, due: '2026-03-01', status: 'approved', approval: '2/2' },
    { id: 'BILL-0078', vendor: 'Dubai Municipality', amount: 24000, due: '2026-03-05', status: 'pending', approval: '0/2' },
    { id: 'BILL-0077', vendor: 'Al Ghurair Steel', amount: 45000, due: '2026-02-28', status: 'scheduled', approval: '2/2' },
];

const AGING = { current: 110200, d30: 63000, d60: 31000, d90: 12500, d120: 0 };

export default function AccountsPayablePage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('vendors');
    const totalPayable = VENDORS.reduce((s, v) => s + v.balance, 0);
    const totalOverdue = VENDORS.reduce((s, v) => s + v.overdue, 0);
    const pendingApproval = BILLS.filter(b => b.status === 'pending').length;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><ShoppingCart className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Accounts Payable</h1>
                            <p className="text-[11px] text-muted-foreground">Vendor Ledger · Bills · Approvals · Payment Runs</p>
                        </div>
                    </div>
                    {pendingApproval > 0 && <Badge variant="outline" className="border-amber-300 text-amber-600 text-[9px]">{pendingApproval} Pending Approval</Badge>}
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                    <Kpi label="Total Payable" value={fmt(totalPayable)} />
                    <Kpi label="Overdue" value={fmt(totalOverdue)} alert />
                    <Kpi label="Current" value={fmt(AGING.current)} />
                    <Kpi label="31-60 Days" value={fmt(AGING.d30)} />
                    <Kpi label="Pending Approval" value={String(pendingApproval)} warn={pendingApproval > 0} />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="vendors" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Vendor Ledger</TabsTrigger>
                        <TabsTrigger value="bills" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Bills & Approvals</TabsTrigger>
                        <TabsTrigger value="aging" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Aging Report</TabsTrigger>
                        <TabsTrigger value="payments" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Payment Runs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="vendors" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">ID</span><span className="col-span-3">Vendor</span>
                                        <span className="col-span-2">Terms</span><span className="col-span-2 text-right">Balance</span>
                                        <span className="col-span-2 text-right">Overdue</span><span className="col-span-2 text-right">Risk</span>
                                    </div>
                                    {VENDORS.map(v => (
                                        <div key={v.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{v.id}</span>
                                            <span className="col-span-3 font-medium">{v.name}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{v.paymentTerms}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(v.balance)}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", v.overdue > 0 && "text-red-600")}>{v.overdue > 0 ? fmt(v.overdue) : '—'}</span>
                                            <span className="col-span-2 text-right">
                                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", v.risk === 'low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{v.risk}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="bills" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Bill #</span><span className="col-span-3">Vendor</span>
                                        <span className="col-span-2 text-right">Amount</span><span className="col-span-2">Due</span>
                                        <span className="col-span-1">Approval</span><span className="col-span-2 text-right">Status</span>
                                    </div>
                                    {BILLS.map(b => (
                                        <div key={b.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{b.id}</span>
                                            <span className="col-span-3 text-xs truncate">{b.vendor}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(b.amount)}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{b.due}</span>
                                            <span className="col-span-1">
                                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                                                    b.approval === '2/2' ? 'bg-emerald-50 text-emerald-700' : b.approval === '1/2' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                                                    {b.approval}
                                                </span>
                                            </span>
                                            <span className="col-span-2 text-right"><Badge variant={b.status === 'approved' ? 'default' : b.status === 'overdue' ? 'destructive' : b.status === 'scheduled' ? 'secondary' : 'outline'} className="text-[8px] h-4 px-1">{b.status}</Badge></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="aging" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-5 gap-4 text-center">
                                    {[{ label: 'Current', val: AGING.current, color: 'bg-emerald-500' }, { label: '1-30 Days', val: AGING.d30, color: 'bg-amber-500' }, { label: '31-60 Days', val: AGING.d60, color: 'bg-orange-500' }, { label: '61-90 Days', val: AGING.d90, color: 'bg-red-500' }, { label: '90+', val: AGING.d120, color: 'bg-red-800' }].map(b => (
                                        <div key={b.label} className="space-y-2">
                                            <div className="h-24 rounded-lg bg-muted/50 flex flex-col items-center justify-end pb-2 relative overflow-hidden">
                                                <div className={cn("absolute bottom-0 left-0 right-0 rounded-b-lg", b.color)} style={{ height: `${Math.max((b.val / totalPayable) * 100, 4)}%`, opacity: 0.8 }} />
                                                <span className="relative z-10 text-sm font-bold">{fmt(b.val, { compact: true })}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground">{b.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-8 text-center space-y-3">
                                <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                                <p className="text-sm font-medium text-muted-foreground">Payment Run Engine</p>
                                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">Batch-process approved bills. Select payment date, bank account, and execute. Supports multi-currency settlements.</p>
                                <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Start Payment Run</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function Kpi({ label, value, alert, warn }: { label: string; value: string; alert?: boolean; warn?: boolean }) {
    return (
        <Card className={cn("border-border shadow-sm", alert && "border-red-200", warn && "border-amber-200")}>
            <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
                <p className={cn("text-lg font-bold tracking-tight", alert && "text-red-600")}>{value}</p>
            </CardContent>
        </Card>
    );
}
