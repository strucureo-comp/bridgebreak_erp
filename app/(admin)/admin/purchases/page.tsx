'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { 
  getPurchaseOrders, getVendors, getPurchaseRequests, getGRNs, getVendorBills, getVendorPayments
} from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    ShoppingCart, 
    Plus, 
    Search, 
    RefreshCcw, 
    ChevronRight,
    Activity,
    CheckCircle2,
    Clock,
    Store,
    BarChart3,
    TrendingUp,
    Truck,
    Receipt,
    DollarSign
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
import type { PurchaseOrder, Vendor, PurchaseRequest, GRN, VendorBill, VendorPayment } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function PurchasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, vendorData, requestData, grnData, billData, paymentData] = await Promise.all([
        getPurchaseOrders(),
        getVendors(),
        getPurchaseRequests(),
        getGRNs(),
        getVendorBills(),
        getVendorPayments()
      ]);
      setOrders(orderData || []);
      setVendors(vendorData || []);
      setRequests(requestData || []);
      setGrns(grnData || []);
      setBills(billData || []);
      setPayments(paymentData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      r.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requester?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const filteredGrns = useMemo(() => {
    return grns.filter(g => 
      g.grn_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.purchase_order?.po_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [grns, searchQuery]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => 
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bills, searchQuery]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.reference_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor_bill?.bill_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payments, searchQuery]);

  const stats = useMemo(() => ({
    totalSpent: orders.filter(o => ['received', 'billed', 'paid'].includes(o.status)).reduce((sum, o) => sum + Number(o.total_amount), 0),
    activeOrders: orders.filter(o => o.status === 'ordered').length,
    vendors: vendors.length,
    growth: 12
  }), [orders, vendors]);

  const spendByVendor = useMemo(() => {
    const data: Record<string, number> = {};
    orders.forEach(o => {
      const vName = o.vendor?.name || 'Unknown';
      data[vName] = (data[vName] || 0) + Number(o.total_amount);
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [orders]);

  const orderTrends = useMemo(() => {
    return [
      { name: 'W1', value: 400 },
      { name: 'W2', value: 300 },
      { name: 'W3', value: 600 },
      { name: 'W4', value: 800 },
    ];
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Loading Procurement Data...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Buying & Vendors</h1>
            <p className="text-slate-500 font-medium">Manage your material supply chain and spend.</p>
          </div>
          <div className="flex gap-2">
            <Button 
                variant="outline"
                className="rounded-2xl h-12 px-6 font-bold border-2 hover:bg-slate-50"
                onClick={fetchData}
            >
                <RefreshCcw className="h-5 w-5" />
            </Button>
            <Button 
                variant="outline"
                className="rounded-2xl h-12 px-6 font-bold border-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                onClick={() => router.push('/admin/purchases/payments/new')}
            >
                <DollarSign className="h-5 w-5 mr-2" /> Record Payment
            </Button>
            <Button 
                className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                onClick={() => router.push('/admin/purchases/new')}
            >
                <Plus className="h-5 w-5 mr-2" /> New Purchase Order
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
            <PurchasesKPI title="Total Spend" value={`$${(stats.totalSpent/1000).toFixed(1)}k`} icon={ShoppingCart} color="emerald" />
            <PurchasesKPI title="Active Orders" value={stats.activeOrders} icon={Clock} color="blue" />
            <PurchasesKPI title="Suppliers" value={stats.vendors} icon={Store} color="amber" />
            <PurchasesKPI title="Monthly Growth" value={`${stats.growth}%`} icon={TrendingUp} color="indigo" />
        </div>

        {/* Visual Analysis */}
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Top Suppliers</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Spending distribution by vendor</CardDescription>
                    </div>
                    <BarChart3 className="text-primary opacity-20" size={32} />
                </CardHeader>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendByVendor}>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Order Volume</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Weekly procurement trends</CardDescription>
                    </div>
                    <TrendingUp className="text-primary opacity-20" size={32} />
                </CardHeader>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={orderTrends} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {orderTrends.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

                    <Tabs defaultValue="requests" className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto self-start">
                            <TabsTrigger value="requests" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Requests</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Orders</TabsTrigger>
                            <TabsTrigger value="receipts" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Receipts</TabsTrigger>
                            <TabsTrigger value="bills" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Bills</TabsTrigger>
                            <TabsTrigger value="payments" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
                            <TabsTrigger value="vendors" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Vendors</TabsTrigger>
                        </TabsList>
        
                        <div className="relative group max-w-sm w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search procurement..." 
                                className="w-full pl-12 pr-6 py-3 rounded-2xl border-2 border-slate-100 bg-white focus:border-primary outline-none font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
        
                    <TabsContent value="requests" className="m-0">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Item Detail</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Project</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Requested By</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-50">
                                        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <Activity size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900">{req.item_name}</p>
                                                            <p className="text-xs font-bold text-slate-400">{req.quantity} {req.unit}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{req.project?.title || 'General'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{req.requester?.full_name || 'System'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                        req.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" :
                                                        req.priority === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" :
                                                        "border-slate-200 text-slate-600 bg-slate-50"
                                                    )}>
                                                        {req.priority}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                        req.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                                        req.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                        "bg-slate-50 text-slate-600"
                                                    )}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {req.status === 'pending' && (
                                                        <Button 
                                                            size="sm" 
                                                            className="rounded-xl h-9 px-4 bg-primary text-white font-bold text-xs"
                                                            onClick={() => router.push(`/admin/purchases/new?request_id=${req.id}`)}
                                                        >
                                                            Create PO
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Activity className="h-12 w-12 text-slate-200" />
                                                        <p className="font-bold text-slate-400">No purchase requests found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
        
                    <TabsContent value="orders" className="m-0">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-50">
                                        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/admin/purchases/orders/${order.id}`)}>
                                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                            <ShoppingCart size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{order.po_number}</p>
                                                            <p className="text-xs font-bold text-slate-400">ID: {order.id.slice(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{order.vendor?.name || 'N/A'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900">${Number(order.total_amount).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                        order.status === 'received' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" :
                                                        order.status === 'ordered' ? "bg-blue-50 text-blue-600 hover:bg-blue-100" :
                                                        "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    )}>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-slate-500 font-bold text-sm">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {['received', 'ordered'].includes(order.status) && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="rounded-xl h-9 px-4 border-2 font-bold text-xs hover:bg-slate-50"
                                                            onClick={() => router.push(`/admin/purchases/bills/new?po_id=${order.id}`)}
                                                        >
                                                            Create Bill
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ShoppingCart className="h-12 w-12 text-slate-200" />
                                                        <p className="font-bold text-slate-400">No purchase orders found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
        
                    <TabsContent value="receipts" className="m-0">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">GRN Number</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">PO Number</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Received Date</th>
                                            <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-50">
                                        {filteredGrns.length > 0 ? filteredGrns.map((grn) => (
                                            <tr key={grn.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                                            <Truck size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900">{grn.grn_number}</p>
                                                            <p className="text-xs font-bold text-slate-400">ID: {grn.id.slice(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{grn.purchase_order?.po_number}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{grn.purchase_order?.vendor?.name || 'N/A'}</p>
                                                </td>
                                                <td className="px-8 py-6 text-slate-500 font-bold text-sm">
                                                    {new Date(grn.received_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md transition-all">
                                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Truck className="h-12 w-12 text-slate-200" />
                                                        <p className="font-bold text-slate-400">No goods receipts found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
        
                    <TabsContent value="bills" className="m-0">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Bill Number</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-50">
                                        {filteredBills.length > 0 ? filteredBills.map((bill) => (
                                            <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                                            <Receipt size={20} />
                                                        </div>
                                                        <p className="font-black text-slate-900">{bill.bill_number}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{bill.vendor?.name}</p>
                                                </td>
                                                <td className="px-8 py-6 text-slate-500 font-bold text-sm">
                                                    {new Date(bill.due_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900">${Number(bill.total_amount).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                        bill.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                        bill.status === 'overdue' ? "bg-red-50 text-red-600" :
                                                        "bg-amber-50 text-amber-600"
                                                    )}>
                                                        {bill.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {bill.status !== 'paid' && (
                                                        <Button 
                                                            size="sm" 
                                                            className="rounded-xl h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100"
                                                            onClick={() => router.push(`/admin/purchases/payments/new?bill_id=${bill.id}`)}
                                                        >
                                                            Pay
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Receipt className="h-12 w-12 text-slate-200" />
                                                        <p className="font-bold text-slate-400">No vendor bills found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
                    <TabsContent value="payments" className="m-0">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Payment Ref</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Bill Number</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Method</th>
                                    <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-50">
                                {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <DollarSign size={20} />
                                                </div>
                                                <p className="font-black text-slate-900">{payment.reference_no || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{payment.vendor_bill?.bill_number}</p>
                                        </td>
                                        <td className="px-8 py-6 text-slate-500 font-bold text-sm">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{payment.payment_method}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-emerald-600">${Number(payment.amount).toLocaleString()}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <DollarSign className="h-12 w-12 text-slate-200" />
                                                <p className="font-bold text-slate-400">No payments found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="vendors" className="m-0">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Supplier Name</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Contact Person</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Phone</th>
                                    <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-50">
                                {filteredVendors.length > 0 ? filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <Store size={20} />
                                                </div>
                                                <p className="font-black text-slate-900">{vendor.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{vendor.contact_person || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-500">{vendor.email || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-500">{vendor.phone || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md transition-all">
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Store className="h-12 w-12 text-slate-200" />
                                                <p className="font-bold text-slate-400">No suppliers found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="requests" className="m-0">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Item Detail</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Project</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Requested By</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-50">
                                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{req.item_name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{req.quantity} {req.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{req.project?.title || 'General'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{req.requester?.full_name || 'System'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                req.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" :
                                                req.priority === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" :
                                                "border-slate-200 text-slate-600 bg-slate-50"
                                            )}>
                                                {req.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={cn(
                                                "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                req.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                                req.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                "bg-slate-50 text-slate-600"
                                            )}>
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md transition-all">
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="h-12 w-12 text-slate-200" />
                                                <p className="font-bold text-slate-400">No purchase requests found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}


function PurchasesKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}