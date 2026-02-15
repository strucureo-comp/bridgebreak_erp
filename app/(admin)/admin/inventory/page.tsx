'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  getProducts, createProduct,
  getInventoryTransactions
} from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  RefreshCcw,
  Box,
  Layers,
  History,
  PieChart as PieChartIcon,
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
import { toast } from 'sonner';
import type { Product, InventoryTransaction, ProductVariant } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const [isItemOpen, setIsItemOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, txData] = await Promise.all([
        getProducts(),
        getInventoryTransactions()
      ]);
      setProducts(prodData || []);
      setTransactions(txData || []);
    } catch (error) {
      console.error('Inventory Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate total stock for a product across all variants and locations
  const validProducts = useMemo(() => {
    return products.map(p => {
      const totalStock = p.variants?.reduce((sum, v) => {
        const variantStock = v.inventory?.reduce((s, i) => s + Number(i.quantity), 0) || 0;
        return sum + variantStock;
      }, 0) || 0;

      const avgCost = p.variants?.[0]?.cost || 0; // Simplified

      return { ...p, totalStock, avgCost };
    });
  }, [products]);

  const stats = useMemo(() => {
    return {
      totalItems: validProducts.length,
      lowStock: validProducts.filter(p => p.totalStock <= 5).length, // Hardcoded threshold for now
      totalValue: validProducts.reduce((sum, p) => sum + (p.totalStock * p.avgCost), 0),
      movements: transactions.length
    };
  }, [validProducts, transactions]);

  const stockDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    validProducts.forEach(p => {
      const cat = p.category || 'Other';
      cats[cat] = (cats[cat] || 0) + p.totalStock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [validProducts]);

  const topItemsByValue = useMemo(() => {
    return validProducts
      .map(p => ({ name: p.name, value: p.totalStock * p.avgCost }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [validProducts]);

  const filteredItems = useMemo(() => {
    return validProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [validProducts, searchQuery]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Scanning Supply Chain...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Stock & Inventory</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              Real-time tracking of products, variants, and warehouse levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
                <ProductForm onSuccess={() => { setIsItemOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Visual Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          <InventoryKPI title="Unique Products" value={stats.totalItems} icon={Layers} color="blue" />
          <InventoryKPI title="Low Stock Alerts" value={stats.lowStock} icon={AlertTriangle} color={stats.lowStock > 0 ? "rose" : "slate"} />
          <InventoryKPI title="Total Valuation" value={`$${(stats.totalValue / 1000).toFixed(1)}k`} icon={TrendingUp} color="emerald" />
          <InventoryKPI title="Recent Movements" value={stats.movements} icon={History} color="indigo" />
        </div>

        {/* Visual Analysis Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
            <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Category Distribution</CardTitle>
                <CardDescription className="font-medium text-slate-400">Total units per category</CardDescription>
              </div>
              <PieChartIcon className="text-primary opacity-20" size={32} />
            </CardHeader>
            <div className="h-[300px] w-full flex flex-col md:flex-row items-center gap-8">
              <div className="h-full w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stockDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {stockDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3 w-full">
                {stockDistribution.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
            <CardHeader className="p-0 pb-8">
              <CardTitle className="text-2xl font-black">Top Products by Value</CardTitle>
              <CardDescription className="font-medium text-slate-400">Highest value inventory assets</CardDescription>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsByValue} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-8">
          <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <TabsTrigger value="products" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Product Catalog</TabsTrigger>
            <TabsTrigger value="movements" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">Stock Log</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between ml-2">
              <h2 className="text-2xl font-black text-slate-900">All Products</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Find a product..."
                  className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[300px] h-11 font-medium"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {filteredItems.map(p => (
                <Card key={p.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Package size={32} />
                      </div>
                      <Badge className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                        p.totalStock <= 5 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {p.totalStock <= 5 ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-6">
                      <h3 className="text-xl font-black text-slate-900 line-clamp-1">{p.name}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">
                        {p.variants?.length || 1} Variants • {p.uom}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Qty</p>
                        <p className="text-lg font-black text-slate-900">{p.totalStock} {p.uom}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Cost</p>
                        <p className="text-lg font-black text-slate-900">${p.avgCost.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button className="w-full rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 font-bold border-none h-11 transition-all">
                      Manage Product
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movements">
            {/* Transaction Log UI - Reuse from before but update fields */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8">
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
                        tx.type === 'in' ? "bg-emerald-500" : tx.type === 'out' ? "bg-rose-500" : "bg-blue-500"
                      )}>
                        {tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : 'T'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.variant?.name || 'Unknown Item'}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">{tx.type} • {tx.user?.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{tx.quantity}</p>
                      <p className="text-xs font-bold text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-center text-slate-400 font-medium py-8">No movements recorded</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function InventoryKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
  const variants: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
    indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
    rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
    slate: "bg-slate-50 text-slate-600 shadow-slate-100/50",
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

// --- Forms ---

function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', uom: 'pcs', type: 'goods', price: '0', cost: '0', description: ''
  });

  const handleSubmit = async () => {
    try {
      await createProduct({
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost)
      });
      toast.success('Product created successfully');
      onSuccess();
    } catch { toast.error('Failed to create product'); }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-3xl font-black tracking-tight">New Product</h3>
        <p className="text-slate-500 font-medium">Create a new product master record.</p>
      </div>
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="font-bold ml-1">Product Name</Label>
          <Input placeholder="e.g. Industrial Pump X200" className="h-12 rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold ml-1">SKU (Default)</Label>
            <Input placeholder="PUMP-X200" className="h-12 rounded-2xl font-bold font-mono" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="font-bold ml-1">Category</Label>
            <Input placeholder="e.g. Machinery" className="h-12 rounded-2xl font-bold" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold ml-1">Unit of Measure</Label>
            <Select value={formData.uom} onValueChange={v => setFormData({ ...formData, uom: v })}>
              <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="pcs">Pieces (Each)</SelectItem>
                <SelectItem value="kg">Kilograms</SelectItem>
                <SelectItem value="m">Meters</SelectItem>
                <SelectItem value="l">Liters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold ml-1">Type</Label>
            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="goods">Goods (Stocked)</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold ml-1">Sales Price</Label>
            <Input type="number" className="h-12 rounded-2xl font-bold" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="font-bold ml-1">Cost Price</Label>
            <Input type="number" className="h-12 rounded-2xl font-bold" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
          </div>
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Create Product</Button>
    </div>
  );
}
