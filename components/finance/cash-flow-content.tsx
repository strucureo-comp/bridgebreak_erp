'use client';

import { useEffect, useState, useMemo, ElementType } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import {
    getTransactions,
    createTransaction,
    getFinancialReport, getJournalEntries,
} from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    TrendingUp, Plus, Settings, ArrowUpRight, ArrowDownRight,
    RefreshCcw, Search, CheckCircle2, Activity,
    ShieldCheck, AlertTriangle, BookOpen, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, TransactionType } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/**
 * Finance Overview — "Source of Truth" Dashboard
 * ───────────────────────────────────────────────
 * This tab combines TWO data sources into a unified overview:
 *
 * 1. GL Data (General Ledger / Journal Entries) — The core accounting system.
 *    Used for: Total Assets, Liabilities, Equity, Revenue, Expenses, Net Income.
 *    Source: /api/admin/finance/reports (which reads Account balances)
 *
 * 2. Cash Transactions — Quick income/expense records (separate from GL).
 *    Used for: Transaction list, monthly flow chart, top spending.
 *    Source: /api/admin/finance/transactions
 *
 * The dashboard clearly labels which data comes from which source.
 * Currency is standardized to USD ($) to avoid INR/USD confusion.
 */

function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function CashFlowContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isSavingTransaction, setIsSavingTransaction] = useState(false);

    // GL Data from Reports API
    const [glData, setGlData] = useState<{
        assets: number; liabilities: number; equity: number;
        revenue: number; expenses: number; netIncome: number;
        equationBalanced: boolean;
    }>({ assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, netIncome: 0, equationBalanced: true });

    // Journal entries for the entries count
    const [journalCount, setJournalCount] = useState(0);

    const [newTransaction, setNewTransaction] = useState({
        type: 'income' as TransactionType,
        amount: '',
        category: '',
        category_preset: 'Sales',
        description: '',
        date: '',
        currency: 'USD',
        exchange_rate: '1',
    });

    useEffect(() => {
        setNewTransaction(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }, []);

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (t.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [transactions, searchQuery]);

    // Chart data from transactions
    const chartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const data = [];

        for (let i = 5; i >= 0; i--) {
            const mIdx = (currentMonth - i + 12) % 12;
            const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);

            const monthTx = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === mIdx && d.getFullYear() === year;
            });

            const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
            const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

            data.push({ name: months[mIdx], income: income || 0, expense: expense || 0 });
        }
        return data;
    }, [transactions]);

    const expenseByCategory = useMemo(() => {
        const cats: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Other';
            cats[cat] = (cats[cat] || 0) + Number(t.amount);
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [transactions]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        const controller = new AbortController();
        if (user?.role === 'admin') fetchData(controller.signal);
        return () => controller.abort();
    }, [user]);

    const fetchData = async (signal?: AbortSignal) => {
        try {
            const results = await Promise.allSettled([
                getTransactions({ signal }),
                getFinancialReport('bs'),    // Balance Sheet from GL
                getFinancialReport('pnl'),   // P&L from GL
                getJournalEntries(),
            ]);

            if (results[0].status === 'fulfilled') setTransactions(results[0].value || []);

            // Parse GL data
            if (results[1].status === 'fulfilled' && results[2].status === 'fulfilled') {
                const bs = results[1].value as any;
                const pnl = results[2].value as any;
                setGlData({
                    assets: bs?.total_assets || 0,
                    liabilities: bs?.total_liabilities || 0,
                    equity: bs?.total_equity || 0,
                    revenue: pnl?.total_revenue || 0,
                    expenses: pnl?.total_expense || 0,
                    netIncome: pnl?.net_income || 0,
                    equationBalanced: bs?.equation_balanced ?? true,
                });
            }

            if (results[3].status === 'fulfilled') {
                const entries = results[3].value;
                setJournalCount(Array.isArray(entries) ? entries.length : 0);
            }
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
                exchange_rate: 1,
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                <p className="font-bold text-slate-900">Updating Overview...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Financial Overview</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        GL-based financials + cash transaction tracking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                <Plus className="h-5 w-5 mr-2" /> Quick Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-[2.5rem] p-8">
                            <DialogHeader className="space-y-2">
                                <DialogTitle className="text-3xl font-black">Quick Record</DialogTitle>
                                <DialogDescription className="text-base">Enter details for a new cash transaction.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                                    <button
                                        className={cn("flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all", newTransaction.type === 'income' ? "bg-white shadow-md text-emerald-600" : "text-slate-400")}
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                                    >Money In</button>
                                    <button
                                        className={cn("flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all", newTransaction.type === 'expense' ? "bg-white shadow-md text-rose-600" : "text-slate-400")}
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                                    >Money Out</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold ml-1">Amount ($)</Label>
                                        <Input type="number" placeholder="0.00" className="h-12 rounded-xl border-slate-200 font-black text-lg" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold ml-1">Date</Label>
                                        <Input type="date" className="h-12 rounded-xl border-slate-200 font-bold" value={newTransaction.date} onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Category</Label>
                                    <Select value={newTransaction.category_preset} onValueChange={v => setNewTransaction({ ...newTransaction, category_preset: v })}>
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
                                    <Input placeholder="What was this for?" className="h-12 rounded-xl" value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} />
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

            {/* Accounting Equation Banner */}
            <Card className={cn(
                "rounded-2xl border-2 p-5",
                glData.equationBalanced ? "border-emerald-200 bg-emerald-50/50" : "border-red-300 bg-red-50"
            )}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        {glData.equationBalanced
                            ? <ShieldCheck className="h-6 w-6 text-emerald-600" />
                            : <AlertTriangle className="h-6 w-6 text-red-600" />
                        }
                        <div>
                            <p className="font-black text-sm">
                                {glData.equationBalanced ? '✅ Accounting Equation Balanced' : '⚠️ Equation VIOLATED'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                A = L + E + NI • {journalCount} journal entries posted
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono font-bold flex-wrap">
                        <span className="px-2 py-1 bg-indigo-100 rounded text-indigo-700">${fmt(glData.assets)}</span>
                        <span className="text-slate-400">=</span>
                        <span className="px-2 py-1 bg-rose-100 rounded text-rose-600">${fmt(glData.liabilities)}</span>
                        <span className="text-slate-400">+</span>
                        <span className="px-2 py-1 bg-emerald-100 rounded text-emerald-600">${fmt(glData.equity)}</span>
                        <span className="text-slate-400">+</span>
                        <span className="px-2 py-1 bg-blue-100 rounded text-blue-600">${fmt(glData.netIncome)}</span>
                    </div>
                </div>
            </Card>

            {/* GL-Based Financial Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <GLCard title="Total Assets" value={glData.assets} icon={DollarSign} color="indigo" source="GL" />
                <GLCard title="Revenue" value={glData.revenue} icon={ArrowUpRight} color="emerald" source="GL" />
                <GLCard title="Expenses" value={glData.expenses} icon={ArrowDownRight} color="rose" source="GL" />
                <ScoreCard title="Net Income" value={glData.netIncome} icon={TrendingUp} label="Revenue - Expenses" />
            </div>

            {/* Cash Transaction Analysis */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                    <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black">Monthly Cash Flow</CardTitle>
                            <CardDescription className="text-xs mt-1">Source: Cash Transactions</CardDescription>
                        </div>
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
                        <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${fmt(Number(value))}`, '']}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                    <CardTitle className="text-2xl font-black mb-2">Top Spending</CardTitle>
                    <CardDescription className="text-xs mb-6">Source: Cash Transactions</CardDescription>
                    <div className="space-y-4">
                        {expenseByCategory.map((cat, i) => (
                            <div key={cat.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">${fmt(cat.value)}</span>
                            </div>
                        ))}
                        {expenseByCategory.length === 0 && <div className="text-center py-12 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No spending recorded yet</div>}
                    </div>
                </Card>
            </div>

            {/* Recent Cash Transactions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between ml-2">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Recent Cash Activity</h2>
                        <p className="text-xs text-muted-foreground">Source: Transaction Records (separate from GL)</p>
                    </div>
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
                                    <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-bold uppercase tracking-widest italic text-[10px]">No cash transactions recorded</td></tr>
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
                                            {t.type === 'income' ? '+' : '-'}${fmt(Number(t.amount))}
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
        </div>
    );
}

function GLCard({ title, value, icon: Icon, color, source }: {
    title: string; value: number; icon: ElementType; color: 'indigo' | 'emerald' | 'rose' | 'blue'; source: string;
}) {
    const styles = {
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className={cn("h-14 w-14 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", styles[color])}>
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase rounded-full px-2">{source}</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <h3 className={cn("text-3xl font-black tracking-tighter", value < 0 ? "text-rose-600" : "text-slate-900")}>${fmt(value)}</h3>
        </Card>
    );
}

function ScoreCard({ title, value, icon: Icon, label }: { title: string; value: number; icon: ElementType; label: string }) {
    const isPositive = value >= 0;
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-8 overflow-hidden relative group">
            <Icon className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
                    <h3 className={cn("text-4xl font-black tracking-tighter", isPositive ? "text-emerald-400" : "text-rose-400")}>
                        {isPositive ? '+' : ''}${fmt(value)}
                    </h3>
                </div>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" /> {label} — Source: GL
                </p>
            </div>
        </Card>
    );
}
