'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  getInventoryItems, createInventoryItem, 
  getInventoryTransactions, createInventoryTransaction 
} from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
    Package, 
    Plus, 
    Search, 
    Filter, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownRight, 
    RefreshCcw, 
    Box,
    Layers,
    ShoppingCart,
    MoreHorizontal,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    History,
    PieChart as PieChartIcon
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
import type { InventoryItem, InventoryTransaction } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
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
      const [itemData, txData] = await Promise.all([
        getInventoryItems(),
        getInventoryTransactions()
      ]);
      setItems(itemData || []);
      setTransactions(txData || []);
    } catch (error) {
      console.error('Inventory Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalItems: items.length,
    lowStock: items.filter(i => Number(i.current_stock) <= Number(i.min_stock ?? 0)).length,
    totalValue: items.reduce((sum, i) => sum + (Number(i.current_stock) * Number(i.cost_price || 0)), 0),
    movements: transactions.length
  }), [items, transactions]);

  const stockDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    items.forEach(i => {
      const cat = i.category || 'Other';
      cats[cat] = (cats[cat] || 0) + Number(i.current_stock);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [items]);

  const topItemsByValue = useMemo(() => {
    return items
      .map(i => ({ name: i.name, value: Number(i.current_stock) * Number(i.cost_price || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Scanning Stockroom...</p>
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
              Real-time tracking of materials and project assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
                <ItemForm onSuccess={() => { setIsItemOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Visual Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
            <InventoryKPI title="Unique Items" value={stats.totalItems} icon={Layers} color="blue" />
            <InventoryKPI title="Low Stock" value={stats.lowStock} icon={AlertTriangle} color={stats.lowStock > 0 ? "rose" : "slate"} />
            <InventoryKPI title="Total Value" value={`$${(stats.totalValue/1000).toFixed(1)}k`} icon={TrendingUp} color="emerald" />
            <InventoryKPI title="Movements" value={stats.movements} icon={History} color="indigo" />
        </div>

        {/* Visual Analysis Row */}
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Stock Distribution</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Total quantity per category</CardDescription>
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
                                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                    <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{cat.value}</span>
                            </div>
                        ))}
                        {stockDistribution.length === 0 && <p className="text-center py-12 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No data available</p>}
                    </div>
                </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8">
                    <CardTitle className="text-2xl font-black">Top Assets by Value</CardTitle>
                    <CardDescription className="font-medium text-slate-400">High-value inventory items</CardDescription>
                </CardHeader>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topItemsByValue} layout="vertical" margin={{ left: -20 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} width={100} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        <Tabs defaultValue="items" className="space-y-8">
            <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl">
                <TabsTrigger value="items" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Current Stock</TabsTrigger>
                <TabsTrigger value="movements" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">Log Book</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between ml-2">
                    <h2 className="text-2xl font-black text-slate-900">Items Catalog</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Find an item..." 
                            className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[300px] h-11 font-medium"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {filteredItems.map(item => (
                        <Card key={item.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                            <CardContent className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <Package size={32} />
                                    </div>
                                    <Badge className={cn(
                                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                        Number(item.current_stock) <= Number(item.min_stock ?? 0) ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {Number(item.current_stock) <= Number(item.min_stock ?? 0) ? 'Low Stock' : 'In Stock'}
                                    </Badge>
                                </div>
                                <div className="space-y-1 mb-6">
                                    <h3 className="text-xl font-black text-slate-900 line-clamp-1">{item.name}</h3>
                                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">SKU: {item.code} • {item.unit}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                                        <p className="text-lg font-black text-slate-900">{Number(item.current_stock)} {item.unit}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost/Unit</p>
                                        <p className="text-lg font-black text-slate-900">${Number(item.cost_price).toLocaleString()}</p>
                                    </div>
                                </div>
                                <Button className="w-full rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 font-bold border-none h-11 transition-all">
                                    Manage Item
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="movements">
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-sm space-y-6 text-center">
                    <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                        <History size={40} />
                    </div>
                    <div className="max-w-sm space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">Movement Log</h3>
                        <p className="text-slate-500 font-medium">Detailed tracking of every item entering or leaving the stockroom. Coming soon.</p>
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

function ItemForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', code: '', category: '', unit: 'pcs', current_stock: '0', min_stock: '5', cost_price: '0'
  });

  const handleSubmit = async () => {
    try {
      await createInventoryItem({
        ...formData,
        current_stock: Number(formData.current_stock),
        min_stock: Number(formData.min_stock),
        cost_price: Number(formData.cost_price),
      });
      toast.success('Item added to stockroom');
      onSuccess();
    } catch { toast.error('Failed to add item'); }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-3xl font-black tracking-tight">Add Stock Item</h3>
        <p className="text-slate-500 font-medium">Register a new material or tool in the inventory.</p>
      </div>
      <div className="grid gap-6">
        <div className="space-y-2">
            <Label className="font-bold ml-1">Item Name</Label>
            <Input placeholder="e.g. Steel Beam 10m" className="h-12 rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="font-bold ml-1">SKU / ID</Label>
                <Input placeholder="ST-100" className="h-12 rounded-2xl font-bold font-mono" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label className="font-bold ml-1">Unit</Label>
                <Select value={formData.unit} onValueChange={v => setFormData({...formData, unit: v})}>
                    <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="m">Meters</SelectItem>
                        <SelectItem value="ton">Tons</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="font-bold ml-1">Initial Quantity</Label>
                <Input type="number" className="h-12 rounded-2xl font-bold" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label className="font-bold ml-1">Low Stock Limit</Label>
                <Input type="number" className="h-12 rounded-2xl font-bold" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
            </div>
        </div>
        <div className="space-y-2">
            <Label className="font-bold ml-1">Cost Price per Unit</Label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <Input type="number" className="h-14 rounded-2xl font-black text-2xl pl-8" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
            </div>
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Register Item</Button>
    </div>
  );
}
