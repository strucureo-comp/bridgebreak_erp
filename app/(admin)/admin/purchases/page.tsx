'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTenant } from '@/lib/tenant-context';
import {
    getPurchaseOrders, getVendors, getPurchaseRequests, getGRNs, getVendorBills, getVendorPayments, getProjects
} from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
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
    UserPlus
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
import type { PurchaseOrder, Vendor, PurchaseRequest, GRN, VendorBill, VendorPayment, Project } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { MaterialRequestForm } from './_components/material-request-form';
import { VendorForm } from './_components/vendor-form';
import { ModuleGuard } from '@/components/shared/layout/module-guard';

function fmt(n: number): string {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0
    }).format(n);
}

export default function PurchasesPage() {
    const { getModuleLabel } = useTenant();
    const router = useRouter();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [payments, setPayments] = useState<VendorPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMRFormOpen, setIsMROpen] = useState(false);
    const [isVendorFormOpen, setIsVendorOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orderData, vendorData, requestData, grnData, billData, paymentData, projectData] = await Promise.all([
                getPurchaseOrders().catch(() => []),
                getVendors().catch(() => []),
                getPurchaseRequests().catch(() => []),
                getGRNs().catch(() => []),
                getVendorBills().catch(() => []),
                getVendorPayments().catch(() => []),
                getProjects().catch(() => [])
            ]);
            setOrders((orderData as PurchaseOrder[]) || []);
            setVendors((vendorData as Vendor[]) || []);
            setRequests((requestData as PurchaseRequest[]) || []);
            setGrns(grnData || []);
            setBills(billData || []);
            setPayments(paymentData || []);
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
        vendors: vendors.length,
        pendingMRs: requests.filter(r => r.status === 'pending').length
    }), [orders, vendors, requests]);

    const spendByVendor = useMemo(() => {
        const data: Record<string, number> = {};
        orders.forEach(o => {
            const vName = vendors.find(v => v.id === o.vendor_id)?.name || 'Unknown';
            data[vName] = (data[vName] || 0) + Number(o.total_amount);
        });
        return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [orders, vendors]);

    if (loading) return (
        <DashboardShell requireAdmin>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Loading Procurement Ledger</p>
            </div>
        </DashboardShell>
    );

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="operations">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">{getModuleLabel('purchases')}</h1>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Supply Chain & Material Control</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isVendorFormOpen} onOpenChange={setIsVendorOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-10 gap-2 font-bold uppercase text-[10px] border-border">
                                        <UserPlus className="h-4 w-4 text-primary" /> Add Vendor
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

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsTile title="Committed Spend" value={fmt(stats.totalSpent)} icon={ShoppingCart} label="Net Procurement Value" />
                        <StatsTile title="Active POs" value={stats.activeOrders} icon={Clock} label="Orders in Pipeline" />
                        <StatsTile title="Requisitions" value={stats.pendingMRs} icon={ClipboardList} label="Pending HQ Approval" highlight={stats.pendingMRs > 0} />
                        <StatsTile title="Supply Chain" value={stats.vendors} icon={Store} label="Verified Vendors" />
                    </div>

                    {/* Analytics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border shadow-sm rounded-md bg-card">
                            <CardHeader className="border-b bg-muted/50 py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Vendor Spend Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[240px] w-full">
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
                    </div>

                    <Tabs defaultValue="requests" className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <TabsList className="bg-muted/50 border h-10 p-0.5 w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                                <TabsTrigger value="requests" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Material Requests</TabsTrigger>
                                <TabsTrigger value="orders" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Purchase Orders</TabsTrigger>
                                <TabsTrigger value="receipts" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Good Receipts</TabsTrigger>
                                <TabsTrigger value="bills" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Vendor Bills</TabsTrigger>
                                <TabsTrigger value="vendors" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Vendors</TabsTrigger>
                            </TabsList>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="SEARCH LEDGER..."
                                    className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-card text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <Card className="border shadow-sm rounded-md overflow-hidden bg-card">
                            <TabsContent value="requests" className="m-0">
                                <TableFrame>
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">MR No</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Material specification</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Project linkage</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground font-mono uppercase">MR-{req.id.slice(0, 4).toUpperCase()}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-foreground uppercase">{req.item_name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-black tracking-widest">{req.quantity} {req.unit}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-foreground uppercase">{req.project?.title || 'General Site'}</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Requested By: {req.requester?.full_name || 'Site Team'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none",
                                                        req.status === 'pending' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                                                    )}>{req.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary" onClick={() => router.push(`/admin/purchases/new?request_id=${req.id}`)}>
                                                        <ChevronRight size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {requests.length === 0 && <EmptyTable icon={ClipboardList} label="No Material Requests" />}
                                    </tbody>
                                </TableFrame>
                            </TabsContent>

                            <TabsContent value="orders" className="m-0">
                                <TableFrame>
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">PO Number</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Vendor Entity</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground text-right">Commitment</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-foreground uppercase font-mono">{order.po_number}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">{vendors.find(v => v.id === order.vendor_id)?.name || 'Unknown Vendor'}</td>
                                                <td className="px-6 py-4 text-xs font-black text-right text-foreground">{fmt(Number(order.total_amount))}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none bg-muted text-muted-foreground">{order.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary" onClick={() => router.push(`/admin/purchases/orders/${order.id}`)}>
                                                        <ChevronRight size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && <EmptyTable icon={ShoppingCart} label="No Purchase Orders" />}
                                    </tbody>
                                </TableFrame>
                            </TabsContent>

                            <TabsContent value="receipts" className="m-0">
                                <TableFrame>
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">GRN Number</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">PO Reference</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Received Date</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {grns.map((grn) => (
                                            <tr key={grn.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-foreground uppercase">{grn.grn_number}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase font-mono">{orders.find(o => o.id === grn.purchase_order_id)?.po_number || 'REF-PO'}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{new Date(grn.received_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary"><ChevronRight size={16} /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {grns.length === 0 && <EmptyTable icon={Truck} label="No Goods Receipts" />}
                                    </tbody>
                                </TableFrame>
                            </TabsContent>

                            <TabsContent value="bills" className="m-0">
                                <TableFrame>
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Bill Number</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Vendor</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Due Date</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {bills.map((bill) => (
                                            <tr key={bill.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-foreground uppercase">{bill.bill_number}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">{vendors.find(v => v.id === bill.vendor_id)?.name}</td>
                                                <td className="px-6 py-4 text-xs font-black text-right text-foreground">{fmt(Number(bill.total_amount))}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{new Date(bill.due_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary"><ChevronRight size={16} /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {bills.length === 0 && <EmptyTable icon={Receipt} label="No Vendor Bills" />}
                                    </tbody>
                                </TableFrame>
                            </TabsContent>

                            <TabsContent value="vendors" className="m-0">
                                <TableFrame>
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Vendor Name</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">TRN / Tax ID</th>
                                            <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Contact</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {vendors.map((v) => (
                                            <tr key={v.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-foreground uppercase">{v.name}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground font-mono">{v.tax_id || 'NOT REGISTERED'}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase">{v.contact_person}</p>
                                                    <p className="text-[9px] text-muted-foreground font-medium">{v.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary"><MoreHorizontal size={16} /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vendors.length === 0 && <EmptyTable icon={Store} label="No Vendors Registered" />}
                                    </tbody>
                                </TableFrame>
                            </TabsContent>
                        </Card>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function TableFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                {children}
            </table>
        </div>
    );
}

function EmptyTable({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <tr>
            <td colSpan={10} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                    <Icon className="h-10 w-10 text-zinc-100" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
                </div>
            </td>
        </tr>
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
                <h3 className="text-xl font-black text-foreground tracking-tight">{value}</h3>
                <p className={cn("text-[8px] font-black uppercase tracking-tighter", highlight ? "text-primary" : "text-muted-foreground")}>{label}</p>
            </div>
        </Card>
    );
}
