'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTenant } from '@/lib/tenant-context';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  TrendingUp,
  ChevronRight,
  Warehouse,
  ArrowUpRight,
  ArrowDownLeft,
  MoveHorizontal
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
import type { Product, InventoryTransaction } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { ModuleGuard } from '@/components/layout/module-guard';

export default function InventoryPage() {
  const { getModuleLabel } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isItemOpen, setIsItemOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, txData] = await Promise.all([
        getProducts().catch(() => []),
        getInventoryTransactions().catch(() => [])
      ]);
      setProducts((prodData as Product[]) || []);
      setTransactions(txData || []);
    } catch (error) {
      console.error('Inventory Fetch Error:', error);
      toast.error('Failed to sync stock data');
    } finally {
      setLoading(false);
    }
  };

  const validProducts = useMemo(() => {
    return products.map(p => {
      const totalStock = p.variants?.reduce((sum, v) => {
        const variantStock = v.inventory?.reduce((s, i) => s + Number(i.quantity), 0) || 0;
        return sum + variantStock;
      }, 0) || 0;
      const avgCost = p.variants?.[0]?.cost || 0;
      return { ...p, totalStock, avgCost };
    });
  }, [products]);

  const stats = useMemo(() => {
    return {
      totalItems: validProducts.length,
      lowStock: validProducts.filter(p => p.totalStock <= 5).length,
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

  const filteredItems = useMemo(() => {
    return validProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [validProducts, searchQuery]);

  const CHART_COLORS = ['#ef4444', '#18181b', '#71717a', '#d4d4d8', '#f4f4f5'];

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inventory Sync in Progress</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <ModuleGuard module="operations">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">{getModuleLabel('inventory')}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Stock Control & Asset Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Register Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                  <ProductForm onSuccess={() => { setIsItemOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsTile title="Material Catalog" value={stats.totalItems} icon={Layers} label="SKUs Tracked" />
            <StatsTile title="Low Stock" value={stats.lowStock} icon={AlertTriangle} label="Critical Level" highlight={stats.lowStock > 0} />
            <StatsTile title="Holding Value" value={`AED ${stats.totalValue.toLocaleString()}`} icon={TrendingUp} label="Net Assets" />
            <StatsTile title="Activity Log" value={stats.movements} icon={History} label="Movements (30d)" />
          </div>

          <Tabs defaultValue="catalog" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-muted/50 border h-10 p-0.5 w-full md:w-auto justify-start overflow-x-auto no-scrollbar">
                <TabsTrigger value="catalog" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Catalog</TabsTrigger>
                <TabsTrigger value="movements" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Movement Log</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Stock Analytics</TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  className="pl-9 h-9 border-border text-xs w-full md:w-64 rounded-md"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="catalog" className="mt-0">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map(p => (
                  <Card key={p.id} className="border border-border shadow-sm rounded-md overflow-hidden bg-card hover:border-primary/50 transition-colors group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                          <Package size={20} />
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                          p.totalStock <= 5 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {p.totalStock <= 5 ? 'Low' : 'Healthy'}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="text-sm font-bold text-foreground line-clamp-1 uppercase tracking-tight">{p.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {p.category || 'General'} · {p.uom}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md mb-4 border border-border">
                        <div>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Stock Level</p>
                          <p className="text-xs font-black text-foreground">{p.totalStock} {p.uom}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Value</p>
                          <p className="text-xs font-black text-foreground">AED {p.avgCost.toLocaleString()}</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full h-8 text-[9px] font-bold uppercase tracking-widest gap-2 rounded-md">
                        Manage Assets <ChevronRight size={12} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="movements" className="mt-0">
              <Card className="border shadow-sm rounded-md overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Timestamp</th>
                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Material</th>
                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground text-right">Quantity</th>
                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-3 text-[10px] font-medium text-muted-foreground">{new Date(tx.date).toLocaleString()}</td>
                          <td className="px-6 py-3 text-xs font-bold text-foreground uppercase">{tx.variant?.name || 'Asset Entry'}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              {tx.type === 'in' ? <ArrowDownLeft className="h-3 w-3 text-emerald-500" /> : tx.type === 'out' ? <ArrowUpRight className="h-3 w-3 text-rose-500" /> : <MoveHorizontal className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">{tx.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs font-black text-foreground text-right">{tx.quantity}</td>
                          <td className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase">{tx.user?.full_name || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border border-border shadow-sm rounded-md bg-card p-6">
                  <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Asset Distribution</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase">Weightage by category</CardDescription>
                    </div>
                    <PieChartIcon className="text-zinc-200" size={24} />
                  </CardHeader>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stockDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                          {stockDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border border-border shadow-sm rounded-md bg-foreground text-card-foreground p-6 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="h-10 w-10 rounded-md bg-primary text-card-foreground flex items-center justify-center shadow-sm">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest">Smart Stock Intelligence</h3>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider mt-2">
                        Predictive replenishment alerts enabled. System monitors material burn-rate to automate procurement requests.
                      </p>
                    </div>
                    <Button className="w-full bg-card text-foreground hover:bg-zinc-200 h-9 font-bold uppercase text-[9px] tracking-widest">Generate Report</Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ModuleGuard>
    </DashboardShell>
  );
}

function StatsTile({ title, value, icon: Icon, label, highlight }: { title: string; value: any; icon: any; label: string; highlight?: boolean }) {
  return (
    <Card className={cn(
      "border border-border shadow-sm rounded-md bg-card p-5 relative overflow-hidden",
      highlight && "border-rose-200 bg-rose-50/30"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "h-8 w-8 rounded-md flex items-center justify-center border",
          highlight ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-muted border-border text-muted-foreground"
        )}>
          <Icon size={16} />
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className="text-xl font-black text-foreground tracking-tight">{value}</h3>
        <p className={cn("text-[8px] font-black uppercase tracking-tighter", highlight ? "text-rose-500" : "text-muted-foreground")}>{label}</p>
      </div>
    </Card>
  );
}

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
      toast.success('Material entry committed');
      onSuccess();
    } catch { toast.error('Commit failed'); }
  };

  return (
    <div className="bg-card">
      <div className="p-6 bg-foreground text-card-foreground">
        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 mb-6">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight uppercase">Register Material</h3>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Initialize asset in Master Catalog</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">1. Basic Identification</Label>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Material Name</Label>
              <Input placeholder="e.g. Structural Steel H-Beam" className="h-10 border-border" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Primary SKU</Label>
                <Input placeholder="STL-H-001" className="h-10 border-border font-mono font-bold uppercase text-xs" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Asset Category</Label>
                <Input placeholder="Raw Materials" className="h-10 border-border" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">2. Logistical Metrics</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Unit of Measure</Label>
              <Select value={formData.uom} onValueChange={v => setFormData({ ...formData, uom: v })}>
                <SelectTrigger className="h-10 border-border text-xs font-bold uppercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="m">Meters</SelectItem>
                  <SelectItem value="l">Liters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Management Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="h-10 border-border text-xs font-bold uppercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="goods">Stocked Inventory</SelectItem>
                  <SelectItem value="service">Non-Stock Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">3. Financial Valuation</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Purchase Cost (AED)</Label>
              <Input type="number" className="h-10 border-border font-bold" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Target Selling Price (AED)</Label>
              <Input type="number" className="h-10 border-border font-bold" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-muted border-t border-border">
        <Button onClick={handleSubmit} className="w-full h-12 bg-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">Commit Asset Record</Button>
      </div>
    </div>
  );
}
