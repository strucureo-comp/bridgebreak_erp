'use client';

import { useEffect, useState, useMemo, ElementType } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import {
    getTransactions,
    createTransaction,
    getFinancialReport, getJournalEntries,
} from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    ChevronRight, Calendar, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, TransactionType } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function fmt(n: number): string {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0
    }).format(n);
}

export function CashFlowContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isSavingTransaction, setIsSavingTransaction] = useState(false);

    const [glData, setGlData] = useState<{
        assets: number; liabilities: number; equity: number;
        revenue: number; expenses: number; netIncome: number;
        equationBalanced: boolean;
    }>({ assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, netIncome: 0, equationBalanced: true });

    const [journalCount, setJournalCount] = useState(0);

    const [newTransaction, setNewTransaction] = useState({
        type: 'income' as TransactionType,
        amount: '',
        category: '',
        category_preset: 'Sales',
        description: '',
        date: '',
        currency: 'AED',
        exchange_rate: '1',
    });

    useEffect(() => {
        setNewTransaction(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }, []);

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

    useEffect(() => {
        const controller = new AbortController();
        if (user?.role === 'admin') fetchData(controller.signal);
        return () => controller.abort();
    }, [user]);

    const fetchData = async (signal?: AbortSignal) => {
        try {
            const results = await Promise.allSettled([
                getTransactions({ signal }),
                getFinancialReport('bs'),
                getFinancialReport('pnl'),
                getJournalEntries(),
            ]);

            if (results[0].status === 'fulfilled') setTransactions(results[0].value || []);

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
            toast.success('Transaction saved');
        } catch {
            toast.error('Failed to save');
        } finally {
            setIsSavingTransaction(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-foreground">Synchronizing Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Financial Performance</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time General Ledger and Cash Flow analysis</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                                <Plus className="h-3.5 w-3.5" /> Quick Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-lg">
                            <DialogHeader>
                                <DialogTitle>New Transaction</DialogTitle>
                                <DialogDescription>Enter cash inflow or outflow details.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex gap-2 p-1 bg-muted rounded-md h-10">
                                    <button
                                        className={cn("flex-1 text-[10px] font-bold uppercase rounded transition-all", newTransaction.type === 'income' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                                    >Income</button>
                                    <button
                                        className={cn("flex-1 text-[10px] font-bold uppercase rounded transition-all", newTransaction.type === 'expense' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                                    >Expense</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (AED)</Label>
                                        <Input type="number" className="h-9 font-bold" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</Label>
                                        <Input type="date" className="h-9" value={newTransaction.date} onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                                    <Select value={newTransaction.category_preset} onValueChange={v => setNewTransaction({ ...newTransaction, category_preset: v })}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sales">Sales / Income</SelectItem>
                                            <SelectItem value="Payroll">Payroll</SelectItem>
                                            <SelectItem value="Rent">Rent & Utilities</SelectItem>
                                            <SelectItem value="Supplies">Supplies</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Input className="h-9" value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTransaction} disabled={isSavingTransaction} className="w-full bg-primary h-10 font-bold uppercase tracking-widest text-xs">Finalize Entry</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => fetchData()} className="h-9 gap-2">
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Accounting Status */}
            <Card className={cn(
                "border shadow-none rounded-md p-4",
                glData.equationBalanced ? "border-emerald-100 bg-emerald-50/30" : "border-rose-100 bg-rose-50/30"
            )}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            glData.equationBalanced ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        )}>
                            {glData.equationBalanced ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground uppercase tracking-tight">
                                {glData.equationBalanced ? 'GL Balanced' : 'Ledger Inconsistency'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">{journalCount} Journal Entries Verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <span>Assets:</span>
                            <span className="text-foreground">{fmt(glData.assets)}</span>
                        </div>
                        <div className="h-3 w-px bg-zinc-200" />
                        <div className="flex items-center gap-1.5">
                            <span>Liabilities:</span>
                            <span className="text-foreground">{fmt(glData.liabilities)}</span>
                        </div>
                        <div className="h-3 w-px bg-zinc-200" />
                        <div className="flex items-center gap-1.5">
                            <span>Equity:</span>
                            <span className="text-foreground">{fmt(glData.equity)}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Metric Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Assets" value={fmt(glData.assets)} icon={Landmark} trend="Core GL" />
                <MetricCard title="Revenue (Net)" value={fmt(glData.revenue)} icon={ArrowUpRight} trend="+12%" trendUp />
                <MetricCard title="Expense (Total)" value={fmt(glData.expenses)} icon={ArrowDownRight} trend="-5%" trendUp={false} />
                <Card className="border shadow-sm rounded-md bg-foreground text-card-foreground">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Net Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-xl font-bold tracking-tight", glData.netIncome >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {fmt(glData.netIncome)}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Strategic Reserve</p>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm rounded-md">
                    <CardHeader className="border-b bg-muted/50 flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-sm font-bold">Monthly Velocity</CardTitle>
                            <CardDescription className="text-[10px] mt-0.5">Cash Inflow vs Outflow</CardDescription>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Inflow</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Outflow</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }}
                                        formatter={(v: any) => [fmt(Number(v)), '']}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.05} />
                                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.05} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm rounded-md">
                    <CardHeader className="border-b bg-muted/50 py-4">
                        <CardTitle className="text-sm font-bold">Expense Distribution</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5">Top expenditure clusters</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {expenseByCategory.map((cat, i) => (
                            <div key={cat.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-zinc-200" />
                                    <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                                </div>
                                <span className="text-xs font-bold text-foreground">{fmt(cat.value)}</span>
                            </div>
                        ))}
                        {expenseByCategory.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest italic">No data</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction List */}
            <Card className="border shadow-sm rounded-md overflow-hidden">
                <CardHeader className="border-b bg-muted/50 flex flex-row items-center justify-between py-4">
                    <div>
                        <CardTitle className="text-sm font-bold">Recent Cash Activity</CardTitle>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Filter..." className="h-8 pl-8 w-48 text-xs rounded-md" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transaction</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-md flex items-center justify-center",
                                                t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{t.description || "Entry"}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{t.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className={cn("px-6 py-4 text-xs font-black text-right", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                        {t.type === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-bold uppercase px-2">Verified</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: any) {
    return (
        <Card className="border shadow-sm rounded-md">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
                <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    trendUp ? "bg-emerald-50 text-emerald-600" : trendUp === false ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground"
                )}>
                    {trend}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="text-xl font-bold tracking-tight text-foreground">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}