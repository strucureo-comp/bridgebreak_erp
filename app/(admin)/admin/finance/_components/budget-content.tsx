'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Plus,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getBudgets, getAccounts, saveBudget } from '@/lib/api';

// Types
interface BudgetLine {
    id: string;
    account_id: string;
    amount: number;
    period: string;
    actual: number; // derived from API join
    account: { name: string; code: string };
}

export function BudgetingContent() {
    const [budgets, setBudgets] = useState<BudgetLine[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]); // For dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [newTarget, setNewTarget] = useState({ account_id: '', amount: '' });
    const [period, setPeriod] = useState('2024'); // Simple period for now

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bData, aData] = await Promise.all([getBudgets(), getAccounts()]);
            setBudgets(bData as BudgetLine[]);
            setAccounts(aData as any[]);
        } catch (error) {
            toast.error('Failed to load budgeting data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalBudget = budgets.reduce((a, b) => a + Number(b.amount), 0);
    const totalActual = budgets.reduce((a, b) => a + Number(b.actual), 0);
    const variance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

    const handleAddBudget = async () => {
        if (!newTarget.account_id || !newTarget.amount) return;

        try {
            await saveBudget({
                account_id: newTarget.account_id,
                amount: parseFloat(newTarget.amount),
                period
            });
            toast.success('Budget target saved');
            setNewTarget({ account_id: '', amount: '' });
            fetchData();
        } catch (e) {
            toast.error('Failed to save budget');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Budgeting & Planning</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Set financial targets and monitor variance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl pr-4">
                        <div className="bg-card rounded-xl h-10 w-10 flex items-center justify-center shadow-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">FY {period}</span>
                    </div>
                    {/* <Button className="rounded-2xl h-12 font-bold px-6 bg-slate-900 text-card-foreground shadow-xl shadow-slate-200">
                        <Plus className="h-4 w-4 mr-2" />
                        New Scenario
                    </Button> */}
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-indigo-600 text-card-foreground p-8 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Budget Utilization</p>
                        <h3 className="text-4xl font-black mt-2">
                            {totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0}%
                        </h3>
                        <Progress value={totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0} className="h-2 bg-white/20 mt-4 rounded-full" indicatorClassName="bg-card" />
                    </div>
                    <Target className="absolute -right-4 -bottom-4 h-32 w-32 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-8 group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Variance</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className={cn("text-3xl font-black", variance > 0 ? "text-rose-600" : "text-emerald-600")}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                        </h3>
                        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
                            {variance > 0 ? <TrendingUp className="h-5 w-5 text-rose-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        </div>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground mt-2">Vs. Approved Budget</p>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-8 flex flex-col justify-center space-y-4">
                    <div className="flex gap-2">
                        <Select value={newTarget.account_id} onValueChange={v => setNewTarget({ ...newTarget, account_id: v })}>
                            <SelectTrigger className="w-full h-12 rounded-xl bg-muted border-transparent font-bold">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {accounts.length === 0 ? (
                                    <div className="p-2 text-xs text-center text-muted-foreground">
                                        No accounts found.<br />
                                        <span className="font-bold text-indigo-500">Go to General Ledger &gt; Seed</span>
                                    </div>
                                ) : (
                                    accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Target Amount"
                            type="number"
                            className="rounded-xl bg-muted border-transparent focus:bg-white h-12 font-bold w-full"
                            value={newTarget.amount}
                            onChange={e => setNewTarget({ ...newTarget, amount: e.target.value })}
                        />
                        <Button onClick={handleAddBudget} className="w-24 rounded-xl font-bold h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                            Set
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Budget Table */}
            <Card className="rounded-[3rem] border-none shadow-sm bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-border">
                            <tr>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Budget</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actual</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Variance</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading budgets...</td></tr>
                            ) : budgets.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No active budgets.</td></tr>
                            ) : (
                                budgets.map((item) => {
                                    const itemVar = Number(item.actual) - Number(item.amount);
                                    const isOver = itemVar > 0; // simplistic
                                    return (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-8 font-bold text-foreground">{item.account.code} - {item.account.name}</td>
                                            <td className="p-8 text-right font-mono font-bold text-muted-foreground">${Number(item.amount).toLocaleString()}</td>
                                            <td className="p-8 text-right font-mono font-bold text-foreground">${Number(item.actual).toLocaleString()}</td>
                                            <td className={cn("p-8 text-right font-mono font-bold", isOver ? "text-rose-600" : "text-emerald-600")}>
                                                {isOver ? '+' : ''}{itemVar.toLocaleString()}
                                            </td>
                                            <td className="p-8 text-center">
                                                {isOver ? (
                                                    <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                                                        <AlertCircle size={12} /> Over
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                        <CheckCircle2 size={12} /> On Track
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                }))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
