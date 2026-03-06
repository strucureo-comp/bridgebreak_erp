'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ShoppingCart,
    CheckCircle2,
    DollarSign,
    Calendar,
    Plus,
    Receipt,
    UserPlus,
    FileText,
    ArrowUpRight,
    ShieldAlert,
    Ban,
    Loader2,
    Search,
    Filter,
    ArrowDownLeft,
    ChevronRight,
    Building2,
    Scale
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import {
    FinancePageHeader,
    FinanceTableHeader,
    FinanceEmptyState
} from '@/components/finance/FinancePageHeader';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    getAPVendors,
    createAPVendor,
    getAPBills,
    createAPBill,
    postAPBill,
    createAPPayment,
    getAPAgingReport
} from '@/lib/api';

// ── TYPES ──────────────────────────────────────────────────────────────────

interface Vendor {
    _id: string;
    vendor_id: string;
    legal_name: string;
    trade_license_no: string;
    tax_registration_no: string;
    payment_terms: string;
    credit_limit: number;
    balance: number;
    status: string;
    risk_rating?: string;
}

interface Bill {
    _id: string;
    bill_number: string;
    vendor_id: string;
    vendor_name: string;
    vendor_bill_reference: string;
    bill_date: string;
    due_date: string;
    total_amount: number;
    subtotal?: number;
    tax_amount?: number;
    balance_due: number;
    status: string;
    lines: any[];
}

export default function AccountsPayablePage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [aging, setAging] = useState<any>(null);
    const [stats, setStats] = useState({
        totalPayable: 0,
        overdue: 0,
        pendingApproval: 0,
        paidThisMonth: 0
    });

    const [modal, setModal] = useState<{ open: boolean, type: 'vendor' | 'bill' | 'payment' | null }>({
        open: false,
        type: null
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [vData, bData, aData] = await Promise.all([
                getAPVendors(),
                getAPBills(),
                getAPAgingReport()
            ]);
            setVendors(vData);
            setBills(bData);
            setAging(aData);

            // Calculate local stats
            const total = vData.reduce((s: number, v: Vendor) => s + (v.balance || 0), 0);
            const pending = bData.filter((b: Bill) => b.status === 'pending_approval').length;
            setStats({
                totalPayable: aData?.total || 0,
                overdue: (aData?.d30 || 0) + (aData?.d60 || 0) + (aData?.d90 || 0) + (aData?.d90Plus || 0),
                pendingApproval: pending,
                paidThisMonth: 0 // Fetch from payments in future
            });
        } catch (err) {
            toast.error('Failed to synchronize AP Ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <FinancePageHeader
                    title="Accounts Payable"
                    subtitle="Strategic Supply Chain Finance · Vendor Obligations · Disbursements"
                    icon={ShoppingCart}
                    badges={
                        <Badge variant="outline" className="border-red-600/20 bg-red-50/50 text-red-600 font-bold px-3">
                            ENTERPRISE AP
                        </Badge>
                    }
                    actions={
                        <DropdownAction onAction={(type: 'vendor' | 'bill' | 'payment') => setModal({ open: true, type })} />
                    }
                />

                {/* KPI STRIP */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <KPICard
                        label="Total AP Balance"
                        value={fmt(stats.totalPayable)}
                        sub="Accounts Payable Control Account"
                        icon={<Scale className="h-5 w-5" />}
                    />
                    <KPICard
                        label="Overdue Liabilities"
                        value={fmt(stats.overdue)}
                        alert={stats.overdue > 0}
                        sub="Outstanding beyond credit terms"
                        icon={<ShieldAlert className="h-5 w-5" />}
                    />
                    <KPICard
                        label="Approved for Payment"
                        value={String(bills.filter(b => b.status === 'approved').length)}
                        sub="Bills ready for disbursement"
                        icon={<CheckCircle2 className="h-5 w-5" />}
                    />
                    <KPICard
                        label="Pending Approval"
                        value={String(stats.pendingApproval)}
                        warn={stats.pendingApproval > 0}
                        sub="Bills awaiting finance review"
                        icon={<FileText className="h-5 w-5" />}
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="bg-slate-100/50 border border-slate-200 h-10 p-0.5 rounded-xl">
                        <TabsTrigger value="overview" className="text-[11px] font-bold h-full data-[state=active]:bg-white data-[state=active]:text-red-600 rounded-lg">Overview</TabsTrigger>
                        <TabsTrigger value="vendors" className="text-[11px] font-bold h-full data-[state=active]:bg-white data-[state=active]:text-red-600 rounded-lg">Vendor Registry</TabsTrigger>
                        <TabsTrigger value="bills" className="text-[11px] font-bold h-full data-[state=active]:bg-white data-[state=active]:text-red-600 rounded-lg">Bill Manager</TabsTrigger>
                        <TabsTrigger value="aging" className="text-[11px] font-bold h-full data-[state=active]:bg-white data-[state=active]:text-red-600 rounded-lg">Aging Summary</TabsTrigger>
                        <TabsTrigger value="payments" className="text-[11px] font-bold h-full data-[state=active]:bg-white data-[state=active]:text-red-600 rounded-lg">Payment History</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4 text-red-600" /> Recent Bill Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 border-t">
                                        {bills.slice(0, 5).map((bill: Bill) => (
                                            <div key={bill._id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-black text-red-600 font-mono tracking-tighter">{bill.bill_number}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(bill.bill_date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-span-4">
                                                    <p className="text-xs font-bold text-slate-800">{bill.vendor_name}</p>
                                                    <p className="text-[9px] text-slate-400 truncate">{bill.vendor_bill_reference || 'REF-NA'}</p>
                                                </div>
                                                <div className="col-span-3 text-right">
                                                    <p className="text-xs font-black text-slate-900">{fmt(bill.total_amount)}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-span-3 text-right">
                                                    <StatusBadge status={bill.status} />
                                                </div>
                                            </div>
                                        ))}
                                        {bills.length === 0 && <FinanceEmptyState icon={FileText} title="No Bills Recorded" />}
                                    </div>
                                </CardContent>
                                <CardFooter className="py-3 bg-slate-50/50 justify-center">
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-600" onClick={() => setTab('bills')}>
                                        View All Payables <ChevronRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </CardFooter>
                            </Card>

                            <div className="space-y-6">
                                <Card className="shadow-sm border-slate-200 bg-slate-900 text-white overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier Risk Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <RiskItem label="Critical Supply Dependency" value={12} color="bg-red-500" />
                                        <RiskItem label="Overdue Concentration" value={45} color="bg-amber-500" />
                                        <RiskItem label="FX Exposure (Non-AED)" value={8} color="bg-blue-500" />
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Outlook</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center text-xs border-b pb-3 border-dashed">
                                            <span className="text-slate-500 font-medium">Coming 7 Days</span>
                                            <span className="font-bold text-slate-900">{fmt(aging?.current * 0.4 || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs border-b pb-3 border-dashed">
                                            <span className="text-slate-500 font-medium">Coming 14 Days</span>
                                            <span className="font-bold text-slate-900">{fmt(aging?.current * 0.7 || 0)}</span>
                                        </div>
                                        <Button className="w-full bg-red-600 text-[10px] font-bold h-9">
                                            GENERATE CASH FLOW PLAN
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* VENDOR REGISTRY TAB */}
                    <TabsContent value="vendors" className="mt-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-bold">Approved Vendor Master</CardTitle>
                                    <CardDescription className="text-[10px]">Supply chain partners, contract terms, and historical exposure.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input placeholder="Filter vendors..." className="h-9 pl-9 text-xs w-[200px]" />
                                    </div>
                                    <Button variant="outline" size="sm" className="h-9 border-slate-200 font-bold text-[11px]"><Filter className="h-3.5 w-3.5 mr-2" /> Filters</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b">
                                            <tr>
                                                <th className="px-6 py-3">Vendor Account</th>
                                                <th className="px-6 py-3">Legal Entity</th>
                                                <th className="px-6 py-3">Payment Terms</th>
                                                <th className="px-6 py-3 text-right">Outstanding</th>
                                                <th className="px-6 py-3">Risk Rating</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vendors.map((v: Vendor) => (
                                                <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 font-bold text-red-600 text-xs font-mono">{v.vendor_id}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-800">{v.legal_name}</div>
                                                        <div className="text-[10px] text-slate-400">TRN: {v.tax_registration_no || 'Pending'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="text-[9px] font-bold border-slate-200">{v.payment_terms}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black font-mono text-xs">{fmt(v.balance || 0)}</td>
                                                    <td className="px-6 py-4">
                                                        <RiskRating rating={v.risk_rating || 'Low'} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"><ChevronRight className="h-4 w-4" /></Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {vendors.length === 0 && (
                                                <tr>
                                                    <td colSpan={6}><FinanceEmptyState icon={Building2} title="No Vendors Onboarded" description="Add your first supplier to start managing payables." /></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BILL MANAGER */}
                    <TabsContent value="bills" className="mt-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-sm font-bold">Purchase Ledger Control</CardTitle>
                                    <CardDescription className="text-[10px]">Verification, Approval, and JE Entry for Vendor Bills.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-emerald-600 text-emerald-600 font-bold bg-emerald-50">OPEN ACCRUALS</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b">
                                            <tr>
                                                <th className="px-6 py-3">Bill #</th>
                                                <th className="px-6 py-3">Supplier</th>
                                                <th className="px-6 py-3">Due Date</th>
                                                <th className="px-6 py-3 text-right">Net Amount</th>
                                                <th className="px-6 py-3 text-right">Total (Inc VAT)</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bills.map((bill: Bill) => (
                                                <tr key={bill._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-red-600 text-xs">{bill.bill_number}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold">{bill.vendor_name}</div>
                                                        <div className="text-[10px] text-slate-500">Ref: {bill.vendor_bill_reference || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{new Date(bill.due_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-xs">{fmt(bill.subtotal || 0)}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(bill.total_amount)}</td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={bill.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {bill.status === 'draft' ? (
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-[10px] bg-red-600 hover:bg-red-700"
                                                                onClick={async () => {
                                                                    try {
                                                                        await postAPBill(bill._id);
                                                                        toast.success('Bill posted to General Ledger');
                                                                        loadData();
                                                                    } catch {
                                                                        toast.error('Posting failed');
                                                                    }
                                                                }}
                                                            >
                                                                POST JE
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {bills.length === 0 && (
                                                <tr>
                                                    <td colSpan={7}><FinanceEmptyState icon={Receipt} title="No Bills Found" description="Recorded bills will appear here for approval and posting." /></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AGING TAB */}
                    <TabsContent value="aging" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="md:col-span-2 shadow-sm border-slate-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-bold">Payables Aging Analysis</CardTitle>
                                            <CardDescription className="text-[10px]">Strategic Working Capital & Cash Flow Exposure.</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-red-600 hover:bg-red-50">RECALCULATE</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-5 gap-3 text-center mb-10">
                                        <AgingBucket label="Current" value={aging?.current || 0} total={aging?.total || 1} color="bg-emerald-500" />
                                        <AgingBucket label="1-30 Days" value={aging?.d30 || 0} total={aging?.total || 1} color="bg-blue-500" />
                                        <AgingBucket label="31-60 Days" value={aging?.d60 || 0} total={aging?.total || 1} color="bg-amber-500" />
                                        <AgingBucket label="61-90 Days" value={aging?.d90 || 0} total={aging?.total || 1} color="bg-orange-500" />
                                        <AgingBucket label="90+ Overdue" value={aging?.d90Plus || 0} total={aging?.total || 1} color="bg-red-600" />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 border-b pb-2">
                                            <span className="col-span-6">Aging Bucket</span>
                                            <span className="col-span-3 text-right">Amount</span>
                                            <span className="col-span-3 text-right">Provision</span>
                                        </div>
                                        <AgingRow label="Current (0 - 30 Days)" amount={aging?.current || 0} rate={0} />
                                        <AgingRow label="31 - 60 Days" amount={aging?.d30 || 0} rate={0.05} />
                                        <AgingRow label="61 - 90 Days" amount={aging?.d60 || 0} rate={0.15} />
                                        <AgingRow label="91 - 120 Days" amount={aging?.d90 || 0} rate={0.30} />
                                        <AgingRow label="120+ Days Overdue" amount={aging?.d90Plus || 0} rate={0.50} highlight />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Disbursement Liquidity</CardTitle>
                                    <CardDescription className="text-[10px]">Next 30 Days Settlement Outlook</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Required Cash</span>
                                        <span className="text-3xl font-black font-mono tracking-tighter">
                                            {fmt(aging?.total || 0)}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <Button className="w-full bg-red-600 hover:bg-red-700 text-xs h-10 font-bold">
                                            <DollarSign className="mr-2 h-4 w-4" /> Start Payment Run
                                        </Button>
                                        <Button variant="outline" className="w-full text-xs h-10 font-bold border-slate-200">
                                            <ArrowDownLeft className="mr-2 h-4 w-4" /> Schedule Outflow
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODALS */}
            <Dialog open={modal.open} onOpenChange={(o) => setModal({ open: o, type: o ? modal.type : null })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-slate-900 border-b pb-4">
                            {modal.type === 'vendor' && 'Onboard New Supplier'}
                            {modal.type === 'bill' && 'Record Purchase Bill'}
                            {modal.type === 'payment' && 'Execute Outgoing Payment'}
                        </DialogTitle>
                    </DialogHeader>
                    {modal.type === 'vendor' && <VendorForm onSuccess={() => { setModal({ open: false, type: null }); loadData(); }} />}
                    {modal.type === 'bill' && <BillForm vendors={vendors} onSuccess={() => { setModal({ open: false, type: null }); loadData(); }} />}
                    {modal.type === 'payment' && <PaymentForm vendors={vendors} bills={bills} onSuccess={() => { setModal({ open: false, type: null }); loadData(); }} />}
                </DialogContent>
            </Dialog>

        </DashboardShell>
    );
}

// ── SUBCOMPONENTS ──────────────────────────────────────────────────────────

function KPICard({ label, value, sub, alert, warn, icon }: { label: string; value: string; sub?: string; alert?: boolean; warn?: boolean; icon: React.ReactNode }) {
    return (
        <Card className={cn(
            "shadow-sm border-slate-200 relative overflow-hidden transition-all group hover:border-red-500/50",
            alert && "bg-red-50/20 border-red-200",
            warn && "border-amber-200"
        )}>
            <div className={cn("absolute top-0 right-0 p-3 text-slate-100 group-hover:text-red-500/10 transition-colors", alert && "text-red-200")}>{icon}</div>
            <CardContent className="p-5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className={cn("text-2xl font-black tracking-tight font-mono", alert && "text-red-600", warn && "text-amber-600")}>{value}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5">{sub}</p>
            </CardContent>
        </Card>
    );
}

function DropdownAction({ onAction }: { onAction: (type: 'vendor' | 'bill' | 'payment') => void }) {
    return (
        <div className="flex gap-2">
            <Button onClick={() => onAction('bill')} className="h-9 text-[11px] font-bold bg-red-600 hover:bg-red-700 shadow-sm transition-all border-b-2 border-red-800 active:border-b-0 active:translate-y-0.5">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Book Bill
            </Button>
            <Button variant="outline" onClick={() => onAction('payment')} className="h-9 text-[11px] font-bold border-slate-200 hover:border-red-600 hover:text-red-600">
                <ArrowDownLeft className="mr-1.5 h-3.5 w-3.5" /> Outgoing Payment
            </Button>
            <Button variant="outline" onClick={() => onAction('vendor')} className="h-9 text-[11px] font-bold border-slate-200 hover:bg-slate-50">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> New Vendor
            </Button>
        </div>
    );
}

function RiskItem({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function RiskRating({ rating }: { rating: string }) {
    const s = {
        low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        medium: 'bg-amber-50 text-amber-700 border-amber-100',
        high: 'bg-red-50 text-red-700 border-red-100',
        critical: 'bg-red-600 text-white border-red-600'
    };
    return (
        <Badge variant="outline" className={cn("text-[9px] font-black uppercase h-5", s[rating as keyof typeof s])}>
            {rating}
        </Badge>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s: any = {
        draft: 'bg-slate-100 text-slate-500 border-slate-200',
        pending_approval: 'bg-blue-50 text-blue-600 border-blue-100',
        approved: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        partial: 'bg-amber-50 text-amber-600 border-amber-100',
        paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        overdue: 'bg-red-50 text-red-600 border-red-100'
    };
    return (
        <Badge variant="outline" className={cn("text-[9px] font-black uppercase h-5", s[status])}>
            {status?.replace('_', ' ')}
        </Badge>
    );
}

function AgingBucket({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = (value / total) * 100;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-full h-28 bg-slate-50 rounded-xl flex flex-col justify-end overflow-hidden relative border border-slate-100 shadow-inner">
                <div className={cn("absolute bottom-0 w-full transition-all duration-1000 opacity-80", color)} style={{ height: `${Math.max(pct, 4)}%` }} />
                <span className="relative z-10 text-[10px] font-black font-mono pb-2 drop-shadow-sm">{useCurrency().format(value, { compact: true })}</span>
            </div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">{label}</span>
        </div>
    );
}

function AgingRow({ label, amount, rate, highlight }: { label: string; amount: number; rate: number; highlight?: boolean }) {
    const { format: fmt } = useCurrency();
    return (
        <div className={cn("grid grid-cols-12 px-4 py-3 items-center rounded-xl text-xs transition-colors mb-1", highlight ? "bg-red-50 text-red-900 border border-red-100" : "hover:bg-slate-50/80 border border-transparent")}>
            <span className="col-span-8 font-bold flex items-center gap-2">
                {highlight && <ShieldAlert className="h-3.5 w-3.5 text-red-600" />}
                {label}
            </span>
            <span className="col-span-4 text-right font-mono font-black">{fmt(amount)}</span>
        </div>
    );
}

// ── FORMS ──────────────────────────────────────────────────────────────

function VendorForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        legal_name: '', trade_license_no: '', tax_registration_no: '',
        payment_terms: 'Net 30', credit_limit: 0
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAPVendor({ ...formData, risk_rating: 'low' });
            toast.success('Vendor Profile Created');
            onSuccess();
        } catch {
            toast.error('Onboarding failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Legal Entity Name*</Label>
                    <Input required placeholder="Ex: Al Ghurair Steel LLC" className="h-10 text-sm font-medium focus:ring-red-500 border-slate-200" value={formData.legal_name} onChange={e => setFormData({ ...formData, legal_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">License / Reg No</Label>
                    <Input placeholder="TL-XXXX" className="h-10 text-sm border-slate-200" value={formData.trade_license_no} onChange={e => setFormData({ ...formData, trade_license_no: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tax Registration (TRN)</Label>
                    <Input placeholder="100XXXXXXXXXXXX" className="h-10 text-sm border-slate-200" value={formData.tax_registration_no} onChange={e => setFormData({ ...formData, tax_registration_no: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Terms</Label>
                    <Select value={formData.payment_terms} onValueChange={(v: string) => setFormData({ ...formData, payment_terms: v })}>
                        <SelectTrigger className="h-10 text-sm border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CIA">Cash in Advance</SelectItem>
                            <SelectItem value="COD">Cash on Delivery</SelectItem>
                            <SelectItem value="Net 15">Net 15 Days</SelectItem>
                            <SelectItem value="Net 30">Net 30 Days</SelectItem>
                            <SelectItem value="Net 60">Net 60 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Credit Limit (AED)</Label>
                    <Input type="number" className="h-10 text-sm font-mono border-slate-200" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })} />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-red-600 h-11 font-black uppercase tracking-widest text-xs transition-all">
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Register Vendor Entity
            </Button>
        </form>
    );
}

function BillForm({ vendors, onSuccess }: { vendors: any[], onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [lines, setLines] = useState<any[]>([{ description: '', quantity: 1, unit_price: 0, tax_rate: 5, amount: 0, tax_amount: 0, total: 0 }]);
    const [vendorId, setVendorId] = useState('');
    const [billRef, setBillRef] = useState('');
    const [dueDate, setDueDate] = useState('');

    const calc = (q: number, p: number, t: number) => {
        const amt = q * p;
        const tax = amt * (t / 100);
        return { amt, tax, tot: amt + tax };
    };

    const updateLine = (idx: number, field: string, val: any) => {
        const newLines = [...lines];
        newLines[idx][field] = val;
        const { amt, tax, tot } = calc(newLines[idx].quantity, newLines[idx].unit_price, newLines[idx].tax_rate);
        newLines[idx].amount = amt;
        newLines[idx].tax_amount = tax;
        newLines[idx].total = tot;
        setLines(newLines);
    };

    const sub = lines.reduce((s, l) => s + l.amount, 0);
    const tax = lines.reduce((s, l) => s + l.tax_amount, 0);
    const total = sub + tax;

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!vendorId) return toast.error('Select supplier');
        setLoading(true);
        try {
            const vendor = vendors.find(v => v.vendor_id === vendorId);
            await createAPBill({
                vendor_id: vendorId,
                vendor_name: vendor?.legal_name,
                vendor_bill_reference: billRef,
                bill_date: new Date(),
                due_date: dueDate || new Date(Date.now() + 30 * 86400000),
                lines,
                status: 'draft'
            });
            toast.success('Bill Recognized in Purchase Ledger');
            onSuccess();
        } catch {
            toast.error('Failed to book bill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in duration-500">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Vendor Registry</Label>
                    <Select onValueChange={(v: string) => setVendorId(v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Search Account..." /></SelectTrigger>
                        <SelectContent>
                            {vendors.map(v => <SelectItem key={v.vendor_id} value={v.vendor_id}>{v.legal_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Vendor Bill Ref #</Label>
                    <Input placeholder="Invoice No..." className="h-9 text-xs" value={billRef} onChange={e => setBillRef(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Due Date</Label>
                    <Input type="date" className="h-9 text-xs" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 font-bold text-slate-400 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Expense Description</th>
                            <th className="px-4 py-3 text-center w-20">Qty</th>
                            <th className="px-4 py-3 text-right w-32">Unit Cost</th>
                            <th className="px-4 py-3 text-right w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {lines.map((l, i) => (
                            <tr key={i}>
                                <td className="p-2"><Input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} className="h-8 text-xs border-0 bg-transparent placeholder:italic" placeholder="Line item description..." /></td>
                                <td className="p-2 text-center"><Input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="h-8 text-xs text-center border-0 font-medium" /></td>
                                <td className="p-2 text-right"><Input type="number" value={l.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} className="h-8 text-xs text-right border-0 font-mono font-bold" /></td>
                                <td className="p-2 text-right font-black text-slate-900 px-4">{useCurrency().format(l.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-4">
                <div className="w-72 space-y-2.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between text-xs text-slate-500 font-medium"><span>Net Total</span><span className="font-mono text-slate-900">{useCurrency().format(sub)}</span></div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium"><span>Input VAT (5%)</span><span className="font-mono text-slate-900">{useCurrency().format(tax)}</span></div>
                    <div className="flex justify-between text-base font-black pt-3 border-t border-slate-200">
                        <span className="text-red-600 uppercase tracking-tighter">Gross Payable</span>
                        <span className="font-mono">{useCurrency().format(total)}</span>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg">
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
                Confirm Entry & Initiate Approval
            </Button>
        </form>
    );
}

function PaymentForm({ vendors, bills, onSuccess }: { vendors: any[], bills: any[], onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [vendorId, setVendorId] = useState('');
    const [amount, setAmount] = useState(0);
    const [ref, setRef] = useState('');

    const filteredBills = bills.filter(b => b.vendor_id === vendorId && b.balance_due > 0);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!vendorId || amount <= 0) return toast.error('Enter valid details');
        setLoading(true);
        try {
            let remaining = amount;
            const allocations = [];
            for (const bill of filteredBills) {
                if (remaining <= 0) break;
                const payAmt = Math.min(bill.balance_due, remaining);
                allocations.push({ bill_id: bill._id, amount_allocated: payAmt });
                remaining -= payAmt;
            }

            await createAPPayment({
                vendor_id: vendorId,
                amount_paid: amount,
                reference_no: ref,
                allocations,
                payment_date: new Date()
            });
            toast.success('Funds Disbursed & Settled');
            onSuccess();
        } catch {
            toast.error('Disbursement failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Select Vendor Beneficiary</Label>
                    <Select onValueChange={(v: string) => setVendorId(v)}>
                        <SelectTrigger className="h-11 text-sm font-medium border-slate-200"><SelectValue placeholder="Search Vendor Registry..." /></SelectTrigger>
                        <SelectContent>
                            {vendors.map(v => <SelectItem key={v.vendor_id} value={v.vendor_id}>{v.legal_name} (Due: {useCurrency().format(v.balance || 0)})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Amount to Remit (AED)</Label>
                    <Input type="number" required placeholder="0.00" className="h-11 text-xl font-black font-mono border-slate-200 focus:ring-emerald-500" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Payment Reference / UTR</Label>
                    <Input placeholder="E.g. Bank Ref #..." className="h-11 text-sm border-slate-200" value={ref} onChange={e => setRef(e.target.value)} />
                </div>
            </div>

            {filteredBills.length > 0 && (
                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4" /> Settlement Simulation
                    </h4>
                    <div className="space-y-2">
                        {filteredBills.slice(0, 3).map(bill => (
                            <div key={bill._id} className="flex justify-between items-center bg-white p-3 rounded-xl text-xs border border-slate-100 shadow-sm">
                                <div><span className="font-bold text-red-600 font-mono">{bill.bill_number}</span> · Due: {new Date(bill.due_date).toLocaleDateString()}</div>
                                <div className="font-black text-slate-900">{useCurrency().format(bill.balance_due)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all">
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowDownLeft className="mr-2 h-5 w-5" />}
                Authorize & Disburse Funds
            </Button>
        </form>
    );
}
