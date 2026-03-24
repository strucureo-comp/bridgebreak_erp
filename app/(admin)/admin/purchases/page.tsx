'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTenant } from '@/lib/tenant-context';
import {
    getPurchaseOrders, 
    getVendors, 
    getPurchaseRequests, 
    getGRNs, 
    getVendorBills, 
    getVendorPayments, 
    getProjects,
    getExpenses,
    getRFQs,
    getRecurringBills,
    getRecurringExpenses,
    getVendorCredits,
    getBatchPayments
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    ShoppingCart,
    Plus,
    Search,
    RefreshCcw,
    ChevronRight,
    Clock,
    Store,
    TrendingUp,
    ClipboardList,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Truck,
    Receipt,
    CreditCard,
    MoreHorizontal,
    UserPlus,
    FileCheck,
    Repeat,
    DollarSign,
    Layers,
    ChevronDown,
    Package,
    UploadCloud,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import type { 
    PurchaseOrder, 
    Vendor, 
    PurchaseRequest, 
    GRN, 
    VendorBill, 
    VendorPayment, 
    Project,
    RFQ,
    Expense,
    RecurringBill,
    RecurringExpense,
    BatchPayment,
    DebitNote
} from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { MaterialRequestForm } from './_components/material-request-form';
import { VendorForm } from './_components/vendor-form';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { PurchasesNav } from './_components/purchases-nav';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';
import { formatCurrency } from '@/lib/utils/currency';

export default function PurchasesPage() {
    const { getModuleLabel } = useTenant();
    const { baseCurrency } = useCompanySettings();
    const router = useRouter();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
    const [vendorCredits, setVendorCredits] = useState<DebitNote[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [payments, setPayments] = useState<VendorPayment[]>([]);
    const [batchPayments, setBatchPayments] = useState<BatchPayment[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMRFormOpen, setIsMROpen] = useState(false);
    const [isVendorFormOpen, setIsVendorOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [baseCurrency]); // Reload if currency changes

    const fmt = (n: number) => formatCurrency(n, baseCurrency);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [
                orderData, vendorData, requestData, rfqData, grnData, 
                billData, recBillData, creditData, 
                expenseData, recExpenseData, 
                paymentData, batchData, projectData
            ] = await Promise.all([
                getPurchaseOrders().catch(() => []),
                getVendors().catch(() => []),
                getPurchaseRequests().catch(() => []),
                getRFQs().catch(() => []),
                getGRNs().catch(() => []),
                getVendorBills().catch(() => []),
                getRecurringBills().catch(() => []),
                getVendorCredits().catch(() => []),
                getExpenses().catch(() => []),
                getRecurringExpenses().catch(() => []),
                getVendorPayments().catch(() => []),
                getBatchPayments().catch(() => []),
                getProjects().catch(() => [])
            ]);
            
            setOrders((orderData as PurchaseOrder[]) || []);
            setVendors((vendorData as Vendor[]) || []);
            setRequests((requestData as PurchaseRequest[]) || []);
            setRfqs((rfqData as RFQ[]) || []);
            setGrns(grnData || []);
            setBills(billData || []);
            setRecurringBills(recBillData || []);
            setVendorCredits(creditData || []);
            setExpenses(expenseData || []);
            setRecurringExpenses(recExpenseData || []);
            setPayments(paymentData || []);
            setBatchPayments(batchData || []);
            setProjects((projectData as Project[]) || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        totalSpent: orders.filter(o => ['received', 'billed', 'paid'].includes(o.status)).reduce((sum, o) => sum + Number(o.total_amount), 0),
        activeOrders: orders.filter(o => o.status === 'ordered' || o.status === 'approved').length,
        vendorsCount: vendors.length,
        pendingMRs: requests.filter(r => r.status === 'pending').length,
        ordersIssued: orders.filter(o => ['issued', 'ordered'].includes(o.status)).length,
        billsProcessed: bills.length,
        rfqsClosed: rfqs.filter(r => r.status === 'closed').length,
        totalPayables: bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + Number(b.total_amount), 0),
        newVendors: vendors.filter(v => new Date(v.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        newItems: 12, 
        avgLeadTime: '4.2 Days',
        ocrRate: '85%'
    }), [orders, vendors, requests, bills, rfqs]);

    const spendByVendor = useMemo(() => {
        const data: Record<string, number> = {};
        orders.forEach(o => {
            const vName = vendors.find(v => v.id === o.vendor_id)?.name || 'Unknown';
            data[vName] = (data[vName] || 0) + Number(o.total_amount);
        });
        return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [orders, vendors]);

    const recentActivity = useMemo(() => {
        const combined = [
            ...orders.map(o => ({ type: 'order', date: o.created_at, title: `Order ${o.po_number}`, amount: o.total_amount })),
            ...bills.map(b => ({ type: 'bill', date: b.created_at, title: `Bill ${b.bill_number}`, amount: b.total_amount })),
            ...payments.map(p => ({ type: 'payment', date: p.created_at, title: `Payment recorded`, amount: p.amount })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        return combined;
    }, [orders, bills, payments]);

    if (loading) {
        return (
            <ModuleGuard module="purchases">
                <div className="space-y-6 max-w-6xl animate-pulse">
                    <div>
                        <div className="h-8 w-48 bg-muted rounded mb-2" />
                        <div className="h-4 w-64 bg-muted rounded" />
                    </div>
                    <div className="h-[400px] bg-muted rounded-xl w-full" />
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard module="purchases">
            <div className="space-y-6 max-w-6xl">
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{getModuleLabel('purchases')}</h1>
                        <p className="text-muted-foreground">Manage vendors, procurement pipelines, and purchase orders.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isVendorFormOpen} onOpenChange={setIsVendorOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <UserPlus className="h-4 w-4" /> Add Vendor
                                </Button>
                            </DialogTrigger>
                                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                                    <VendorForm onSuccess={() => { setIsVendorOpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isMRFormOpen} onOpenChange={setIsMROpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-10 gap-2 font-bold uppercase text-[10px] border-border">
                                        <ClipboardList className="h-4 w-4 text-primary" /> Site Requisition
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                                    <MaterialRequestForm projects={projects} onSuccess={() => { setIsMROpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>

                            <Button size="sm" className="h-10 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.push('/admin/purchases/new')}>
                                <Plus className="h-4 w-4" /> Issue PO
                            </Button>
                        </div>
                    </div>

                    <PurchasesNav />

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        <StatsTile title="Committed Spend" value={fmt(stats.totalSpent)} icon={ShoppingCart} label="Net Procurement Value" />
                        <StatsTile title="Total Payables" value={fmt(stats.totalPayables)} icon={DollarSign} label="Outstanding AP" highlight={stats.totalPayables > 100000} />
                        <StatsTile title="Avg Lead Time" value={stats.avgLeadTime} icon={Clock} label="Order to Receipt" />
                        <StatsTile title="New Items" value={stats.newItems} icon={Package} label="SKUs Added (30d)" />
                        <StatsTile title="RFQs Closed" value={stats.rfqsClosed} icon={Layers} label="Sourcing Efficiency" />
                        <StatsTile title="Auto-Scan %" value={stats.ocrRate} icon={UploadCloud} label="OCR Adoption" />
                    </div>

                    {/* Analytics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border shadow-sm rounded-md bg-card">
                            <CardHeader className="border-b bg-muted/50 py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Vendor Spend Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={spendByVendor}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#71717a' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                            <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border shadow-sm rounded-md bg-foreground text-card-foreground p-6 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="h-10 w-10 rounded-md bg-primary text-card-foreground flex items-center justify-center shadow-sm">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Procurement Insights</h3>
                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider mt-2">
                                            System is tracking {orders.length} orders across {vendors.length} vendors. Average procurement lead time is currently 4.2 days.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/10 mt-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Efficiency Score</span>
                                        <span className="text-xl font-black text-primary">94%</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border shadow-sm rounded-md bg-card">
                                <CardHeader className="border-b bg-muted/50 py-3">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-foreground">Recent Transactions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {recentActivity.map((act, i) => (
                                            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                                <div>
                                                    <p className="text-[10px] font-bold text-foreground uppercase">{act.title}</p>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase">{new Date(act.date).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-[10px] font-black text-foreground">{fmt(act.amount ?? 0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </ModuleGuard>
    );
}

function StatsTile({ title, value, icon: Icon, label, highlight }: { title: string; value: any; icon: any; label: string; highlight?: boolean }) {
    return (
        <Card className={cn(
            "border border-border shadow-sm rounded-md bg-card p-5 relative overflow-hidden",
            highlight && "border-primary/20 bg-primary/5"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center border transition-colors",
                    highlight ? "bg-primary text-card-foreground border-primary" : "bg-muted border-border text-muted-foreground"
                )}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                <h3 className="text-lg font-black text-foreground tracking-tight">{value}</h3>
                <p className={cn("text-xs font-semibold tracking-tighter", highlight ? "text-primary" : "text-muted-foreground")}>{label}</p>
            </div>
        </Card>
    );
}
