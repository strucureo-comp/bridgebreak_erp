'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { getInvoices, getTransactions, getSystemSetting, createTransaction, getBankAccounts } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet,
  Building2,
  Receipt,
  TrendingUp,
  Plus,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Search,
  Filter,
  Calendar,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Activity,
  PiggyBank
} from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Transaction, TransactionType, BankAccount } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import type { FinanceConfiguration, CurrencyCode } from '@/lib/finance-config';
import { formatCurrency, DEFAULT_MULTI_ENGINE_CONFIG } from '@/lib/finance-config';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie,
  Cell
} from 'recharts';

export default function AdminFinancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'taxes'>('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [financeConfig, setFinanceConfig] = useState<Partial<FinanceConfiguration> | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as TransactionType,
    amount: '',
    category: '',
    category_preset: 'Sales',
    description: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    exchange_rate: '1',
  });

  // 1. MEMOS (Must be above early returns)
  const baseCurrency = (financeConfig?.currency_config?.base_currency || 'USD') as CurrencyCode;

  const { totalRevenue, totalExpenses, netProfit, profitMargin } = useMemo(() => {
    const invRev = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const txRev = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) * (t.exchange_rate || 1)), 0);
    const revenue = invRev + txRev;
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) * (t.exchange_rate || 1)), 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { totalRevenue: revenue, totalExpenses: expenses, netProfit: profit, profitMargin: margin };
  }, [invoices, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [transactions, searchQuery]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    // Last 6 months calculation
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);
      
      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === mIdx && d.getFullYear() === year;
      });

      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      
      data.push({ 
        name: months[mIdx], 
        income: income || 0, 
        expense: expense || 0 
      });
    }
    return data;
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other';
      cats[cat] = (cats[cat] || 0) + Number(t.amount);
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // 2. EFFECTS
  useEffect(() => {
    setIsMounted(true);
    const controller = new AbortController();
    if (user?.role === 'admin') fetchData(controller.signal);
    return () => controller.abort();
  }, [user]);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      const results = await Promise.allSettled([
        getInvoices(undefined, { signal }),
        getTransactions({ signal }),
        getSystemSetting('finance_config', { signal }),
        getBankAccounts({ signal })
      ]);

      if (results[0].status === 'fulfilled') setInvoices(results[0].value || []);
      if (results[1].status === 'fulfilled') setTransactions(results[1].value || []);
      if (results[3].status === 'fulfilled') setAccounts(results[3].value || []);
      if (results[2].status === 'fulfilled') setFinanceConfig(results[2].value || DEFAULT_MULTI_ENGINE_CONFIG);
    } catch (error) {
      if ((error as any).name !== 'AbortError') toast.error('Failed to update data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount) return toast.error('Please enter an amount');
    setIsSavingTransaction(true);
    try {
      await createTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category_preset,
        exchange_rate: 1
      });
      await fetchData();
      setIsAddTransactionOpen(false);
      toast.success('Record saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSavingTransaction(false);
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Updating Cash Flow...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Simple Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Cash Manager</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              See where your money is coming from and where it goes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Money In / Out
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-[2.5rem] p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-3xl font-black">Quick Record</DialogTitle>
                  <DialogDescription className="text-base">Enter details for a new money entry.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                    <button 
                      className={cn("flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all", newTransaction.type === 'income' ? "bg-white shadow-md text-emerald-600" : "text-slate-400")}
                      onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    >Money In</button>
                    <button 
                      className={cn("flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all", newTransaction.type === 'expense' ? "bg-white shadow-md text-rose-600" : "text-slate-400")}
                      onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    >Money Out</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold ml-1">Amount</Label>
                      <Input type="number" placeholder="0.00" className="h-12 rounded-xl border-slate-200 font-black text-lg" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold ml-1">Date</Label>
                      <Input type="date" className="h-12 rounded-xl border-slate-200 font-bold" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Category</Label>
                    <Select value={newTransaction.category_preset} onValueChange={v => setNewTransaction({...newTransaction, category_preset: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Sales">Sales / Income</SelectItem>
                        <SelectItem value="Payroll">Payroll / Salaries</SelectItem>
                        <SelectItem value="Rent">Rent & Utilities</SelectItem>
                        <SelectItem value="Supplies">Materials / Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Short Description</Label>
                    <Input placeholder="What was this for?" className="h-12 rounded-xl" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTransaction} disabled={isSavingTransaction} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Save Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href="/admin/finance/settings">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 shadow-sm">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <VisualCard title="Money Received" value={totalRevenue} icon={ArrowUpRight} color="emerald" label="Total earnings this year" />
          <VisualCard title="Money Spent" value={totalExpenses} icon={ArrowDownRight} color="rose" label="Total expenses this year" />
          <ScoreCard title="Profit Score" value={profitMargin} icon={TrendingUp} label="Your overall profitability" />
        </div>

        {/* Interactive Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
          <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Activity</TabsTrigger>
            <TabsTrigger value="banking" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Banks</TabsTrigger>
            <TabsTrigger value="taxes" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Taxes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            {/* Visual Analysis Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                  <CardTitle className="text-2xl font-black">Monthly Flow</CardTitle>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase text-slate-400">In</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-black uppercase text-slate-400">Out</span>
                    </div>
                  </div>
                </CardHeader>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} dy={10} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardTitle className="text-2xl font-black mb-8">Top Spending</CardTitle>
                <div className="space-y-4">
                  {expenseByCategory.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                        <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{formatCurrency(cat.value, baseCurrency)}</span>
                    </div>
                  ))}
                  {expenseByCategory.length === 0 && <div className="text-center py-12 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No spending recorded yet</div>}
                </div>
              </Card>
            </div>

            {/* List of Movements */}
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Recent Activity</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Find transaction..." className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[300px] h-11 font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Value</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredTransactions.length === 0 ? (
                        <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-bold uppercase tracking-widest italic text-[10px]">No activity identified</td></tr>
                      ) : filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-8">
                            <div className="flex items-center gap-5">
                              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                {t.type === 'income' ? <ArrowUpRight className="h-6 w-6" strokeWidth={3} /> : <ArrowDownRight className="h-6 w-6" strokeWidth={3} />}
                              </div>
                              <div>
                                <p className="text-base font-black text-slate-900">{t.description || "Cash Entry"}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-8 text-sm font-bold text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-8 text-right font-black text-lg">
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, baseCurrency)}
                          </td>
                          <td className="p-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                              <CheckCircle2 className="h-4 w-4" /> Verified
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banking">
            <EmptySection icon={Building2} title="Bank Summary" desc="View your combined cash balances across all linked accounts." />
          </TabsContent>
          <TabsContent value="taxes">
            <EmptySection icon={Receipt} title="Tax Records" desc="Track your VAT and other tax liabilities automatically." />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

// --- Visual Components ---

function VisualCard({ title, value, icon: Icon, color, label }: { title: string; value: number; icon: any; color: 'emerald' | 'rose'; label: string }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
    rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
  };
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("h-14 w-14 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", styles[color])}>
          <Icon className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">${value.toLocaleString()}</h3>
      <p className="text-xs font-bold text-slate-400 pt-2 flex items-center gap-1.5"><Info className="h-3 w-3" /> {label}</p>
    </Card>
  );
}

function ScoreCard({ title, value, icon: Icon, label }: { title: string; value: number; icon: any; label: string }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-8 overflow-hidden relative group">
      <Icon className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <h3 className="text-5xl font-black tracking-tighter">{value.toFixed(1)}%</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${value}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-400">HEALTHY</span>
        </div>
      </div>
    </Card>
  );
}

function EmptySection({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-sm space-y-6 text-center px-6">
      <div className="h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <div className="max-w-sm space-y-2">
        <h3 className="text-2xl font-black text-slate-900">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
      <Button className="rounded-2xl px-10 h-12 font-black bg-slate-900 text-sm uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-transform active:scale-95">Open Module</Button>
    </div>
  );
}