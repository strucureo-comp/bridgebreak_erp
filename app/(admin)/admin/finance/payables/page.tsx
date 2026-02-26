'use client';

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader, FinanceTableHeader, FinanceEmptyState } from '@/components/finance/FinancePageHeader';
import { toast } from 'sonner';

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface Vendor {
    id: string; name: string; balance: number; overdue: number;
    paymentTerms: string; risk: 'low' | 'medium' | 'high';
}

interface Bill {
    id: string; vendor: string; amount: number; due: string;
    status: 'pending' | 'approved' | 'scheduled' | 'overdue' | 'paid';
    approval: string;
}

// ── INITIAL DATA ───────────────────────────────────────────────────────────────
const INITIAL_VENDORS: Vendor[] = [
    { id: 'V001', name: 'Al Ghurair Steel', balance: 78000, overdue: 0, paymentTerms: 'Net 30', risk: 'low' },
    { id: 'V002', name: 'XYZ Logistics', balance: 42500, overdue: 18500, paymentTerms: 'Net 15', risk: 'medium' },
    { id: 'V003', name: 'AWS Cloud Services', balance: 8200, overdue: 0, paymentTerms: 'Prepaid', risk: 'low' },
    { id: 'V004', name: 'Dubai Municipality', balance: 24000, overdue: 0, paymentTerms: 'COD', risk: 'low' },
    { id: 'V005', name: 'ABC Legal Consultants', balance: 65000, overdue: 12500, paymentTerms: 'Net 45', risk: 'medium' },
];

const INITIAL_BILLS: Bill[] = [
    { id: 'BILL-0082', vendor: 'Al Ghurair Steel', amount: 78000, due: '2026-03-10', status: 'approved', approval: '2/2' },
    { id: 'BILL-0081', vendor: 'XYZ Logistics', amount: 18500, due: '2026-02-15', status: 'overdue', approval: '2/2' },
    { id: 'BILL-0080', vendor: 'ABC Legal Consultants', amount: 12500, due: '2026-02-20', status: 'overdue', approval: '1/2' },
    { id: 'BILL-0079', vendor: 'AWS Cloud Services', amount: 8200, due: '2026-03-01', status: 'approved', approval: '2/2' },
    { id: 'BILL-0078', vendor: 'Dubai Municipality', amount: 24000, due: '2026-03-05', status: 'pending', approval: '0/2' },
    { id: 'BILL-0077', vendor: 'Al Ghurair Steel', amount: 45000, due: '2026-02-28', status: 'scheduled', approval: '2/2' },
];

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function AccountsPayablePage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('vendors');

    const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
    const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);

    // Payment Run Selection State
    const [selectedBills, setSelectedBills] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    // ── Derived ──
    const totalPayable = vendors.reduce((s, v) => s + v.balance, 0);
    const totalOverdue = vendors.reduce((s, v) => s + v.overdue, 0);
    const pendingApproval = bills.filter(b => b.status === 'pending').length;

    const payableBills = bills.filter(b => b.status === 'approved' || b.status === 'overdue');
    const runTotal = payableBills
        .filter(b => selectedBills.includes(b.id))
        .reduce((s, b) => s + b.amount, 0);

    const toggleBill = (id: string, checked: boolean) => {
        if (checked) setSelectedBills(prev => [...prev, id]);
        else setSelectedBills(prev => prev.filter(x => x !== id));
    };
    const toggleAll = (checked: boolean) => {
        if (checked) setSelectedBills(payableBills.map(b => b.id));
        else setSelectedBills([]);
    };

    // ── Payment Run Action ──
    const executePaymentRun = async () => {
        if (selectedBills.length === 0) return;
        setProcessing(true);

        // Simulate API processing delay
        await new Promise(r => setTimeout(r, 1500));

        // Update local state: mark bills as paid
        setBills(prev =>
            prev.map(b => selectedBills.includes(b.id) ? { ...b, status: 'paid' } : b)
        );

        // Deduct vendor balances (hacky simulation for demo)
        setVendors(prev => prev.map(v => {
            const vendorPaid = bills
                .filter(b => selectedBills.includes(b.id) && b.vendor === v.name)
                .reduce((s, b) => s + b.amount, 0);
            return {
                ...v,
                balance: Math.max(0, v.balance - vendorPaid),
                overdue: v.overdue > 0 ? Math.max(0, v.overdue - vendorPaid) : 0,
            };
        }));

        toast.success('Payment Run Executed Successfully', {
            description: `Settled ${selectedBills.length} bill(s) for ${fmt(runTotal)}.`
        });

        setSelectedBills([]);
        setProcessing(false);
    };

    // ── Aging Data ──
    // Re-calculate dynamically based on current bills
    const aging = useMemo(() => {
        let cur = 0, d30 = 0, d60 = 0, d90 = 0, d120 = 0;
        bills.filter(b => b.status !== 'paid').forEach(b => {
            // Mock aging logic (since we don't have real invoice dates here)
            if (b.status === 'overdue') {
                if (b.vendor === 'XYZ Logistics') d30 += b.amount;
                else if (b.vendor === 'ABC Legal Consultants') d60 += b.amount;
                else d90 += b.amount;
            } else {
                cur += b.amount;
            }
        });
        return { current: cur, d30, d60, d90, d120 };
    }, [bills]);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">

                <FinancePageHeader
                    title="Accounts Payable"
                    subtitle="Vendor Ledger · Bills · Approvals · Payment Runs"
                    icon={ShoppingCart}
                    badges={
                        pendingApproval > 0 && (
                            <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px] uppercase">
                                {pendingApproval} Pending Approval
                            </Badge>
                        )
                    }
                />

                {/* KPI Strip */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                    <KpiCard label="Total Payable" value={fmt(totalPayable)} />
                    <KpiCard label="Overdue" value={fmt(totalOverdue)} alert={totalOverdue > 0} />
                    <KpiCard label="Current" value={fmt(aging.current)} />
                    <KpiCard label="1-30 Days Due" value={fmt(aging.d30)} />
                    <KpiCard
                        label="Pending Approval"
                        value={String(pendingApproval)}
                        warn={pendingApproval > 0}
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="vendors" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Vendor Ledger</TabsTrigger>
                        <TabsTrigger value="bills" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Bills & Approvals</TabsTrigger>
                        <TabsTrigger value="aging" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Aging Report</TabsTrigger>
                        <TabsTrigger value="payments" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm border-amber-200">Payment Runs</TabsTrigger>
                    </TabsList>

                    {/* ── VENDORS ── */}
                    <TabsContent value="vendors" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-1">ID</span>
                                        <span className="col-span-3">Vendor</span>
                                        <span className="col-span-2">Terms</span>
                                        <span className="col-span-2 text-right">Balance</span>
                                        <span className="col-span-2 text-right">Overdue</span>
                                        <span className="col-span-2 text-right">Risk</span>
                                    </FinanceTableHeader>
                                    {vendors.map(v => (
                                        <div key={v.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{v.id}</span>
                                            <span className="col-span-3 font-medium">{v.name}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{v.paymentTerms}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(v.balance)}</span>
                                            <span className={cn("col-span-2 text-right text-xs font-bold", v.overdue > 0 && "text-red-600")}>
                                                {v.overdue > 0 ? fmt(v.overdue) : '—'}
                                            </span>
                                            <span className="col-span-2 text-right">
                                                <span className={cn(
                                                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                    v.risk === 'low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                )}>
                                                    {v.risk}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── BILLS ── */}
                    <TabsContent value="bills" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <FinanceTableHeader>
                                        <span className="col-span-2">Bill #</span>
                                        <span className="col-span-3">Vendor</span>
                                        <span className="col-span-2 text-right">Amount</span>
                                        <span className="col-span-2">Due</span>
                                        <span className="col-span-1">Approval</span>
                                        <span className="col-span-2 text-right">Status</span>
                                    </FinanceTableHeader>
                                    {bills.map(b => (
                                        <div key={b.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{b.id}</span>
                                            <span className="col-span-3 text-xs truncate font-medium">{b.vendor}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(b.amount)}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" /> {b.due}
                                            </span>
                                            <span className="col-span-1">
                                                <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded",
                                                    b.approval === '2/2' ? 'bg-emerald-50 text-emerald-700'
                                                        : b.approval === '1/2' ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-red-50 text-red-700')}>
                                                    {b.approval}
                                                </span>
                                            </span>
                                            <span className="col-span-2 text-right">
                                                <Badge
                                                    variant={b.status === 'approved' ? 'default' : b.status === 'overdue' ? 'destructive' : b.status === 'paid' ? 'secondary' : 'outline'}
                                                    className="text-[8px] h-4 px-1 uppercase tracking-wider"
                                                >
                                                    {b.status}
                                                </Badge>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── AGING ── */}
                    <TabsContent value="aging" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-8">
                                <div className="grid grid-cols-5 gap-6 text-center">
                                    {[
                                        { label: 'Current', val: aging.current, color: 'bg-emerald-500' },
                                        { label: '1-30 Days', val: aging.d30, color: 'bg-amber-500' },
                                        { label: '31-60 Days', val: aging.d60, color: 'bg-orange-500' },
                                        { label: '61-90 Days', val: aging.d90, color: 'bg-red-500' },
                                        { label: '90+', val: aging.d120, color: 'bg-red-800' }
                                    ].map(b => (
                                        <div key={b.label} className="space-y-3">
                                            <div className="h-32 rounded-lg bg-muted/30 flex flex-col items-center justify-end pb-3 relative overflow-hidden border">
                                                <div
                                                    className={cn("absolute bottom-0 left-0 right-0 transition-all duration-700", b.color)}
                                                    style={{ height: `${Math.max((b.val / Math.max(totalPayable, 1)) * 100, 4)}%`, opacity: 0.8 }}
                                                />
                                                <span className="relative z-10 text-sm font-bold bg-white/80 px-1.5 rounded">{fmt(b.val, { compact: true })}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{b.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── PAYMENT RUNS ── */}
                    <TabsContent value="payments" className="mt-6">
                        <Card className="border-border shadow-sm overflow-hidden">
                            <div className="bg-muted/30 border-b p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Payment Selection
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Select approved bills to batch-process payment.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Run Total</p>
                                        <p className="text-lg font-bold text-red-600 tracking-tight">{fmt(runTotal)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 ml-4 font-bold disabled:opacity-50 transition-all"
                                        disabled={selectedBills.length === 0 || processing}
                                        onClick={executePaymentRun}
                                    >
                                        {processing ? "Processing..." : `Execute Run (${selectedBills.length})`}
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                {payableBills.length === 0 ? (
                                    <FinanceEmptyState
                                        icon={DollarSign}
                                        title="No bills pending payment"
                                        description="All approved bills have been settled."
                                    />
                                ) : (
                                    <div className="divide-y border-t">
                                        <FinanceTableHeader>
                                            <span className="col-span-1 flex items-center">
                                                <Checkbox
                                                    checked={selectedBills.length === payableBills.length && payableBills.length > 0}
                                                    onCheckedChange={toggleAll}
                                                />
                                            </span>
                                            <span className="col-span-2">Bill #</span>
                                            <span className="col-span-4">Vendor</span>
                                            <span className="col-span-2 text-right">Amount</span>
                                            <span className="col-span-2">Due</span>
                                            <span className="col-span-1 text-right">Status</span>
                                        </FinanceTableHeader>

                                        {payableBills.map(b => (
                                            <div key={b.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                                <span className="col-span-1 flex items-center">
                                                    <Checkbox
                                                        checked={selectedBills.includes(b.id)}
                                                        onCheckedChange={(c) => toggleBill(b.id, !!c)}
                                                    />
                                                </span>
                                                <span className="col-span-2 font-mono text-xs text-red-600">{b.id}</span>
                                                <span className="col-span-4 text-xs font-medium">{b.vendor}</span>
                                                <span className="col-span-2 text-right text-xs font-bold">{fmt(b.amount)}</span>
                                                <span className="col-span-2 text-xs text-muted-foreground">{b.due}</span>
                                                <span className="col-span-1 text-right">
                                                    <Badge variant={b.status === 'overdue' ? 'destructive' : 'outline'} className="text-[8px] h-4 px-1 uppercase">{b.status}</Badge>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}
