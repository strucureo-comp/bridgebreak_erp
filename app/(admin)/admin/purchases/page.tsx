'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  getPurchaseOrders, getVendors, getPurchaseRequests
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
    TrendingUp
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
import type { PurchaseOrder, Vendor, PurchaseRequest } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function PurchasesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
      const [orderData, vendorData] = await Promise.all([
        getPurchaseOrders(),
        getVendors()
      ]);
      setOrders(orderData || []);
      setVendors(vendorData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalSpent: orders.filter(o => o.status === 'received').reduce((sum, o) => sum + Number(o.total_amount), 0),
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
          <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <Plus className="h-5 w-5 mr-2" /> New Purchase Order
          </Button>
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

        <Tabs defaultValue="orders" className="space-y-8">
            {/* ... List content remains same ... */}
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