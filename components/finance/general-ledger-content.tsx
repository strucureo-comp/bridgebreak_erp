'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    BookOpen,
    Plus,
    Search,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    ChevronRight,
    Activity,
    Landmark,
    Briefcase,
    TrendingUp,
    TrendingDown,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAccounts } from '@/lib/api';

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface Account {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    balance: number;
    parent_id?: string;
    children?: Account[];
}

function fmt(n: number): string {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0
    }).format(n);
}

export function GeneralLedgerContent() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data as Account[]);
        } catch (error) {
            toast.error('Failed to load chart of accounts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const stats = useMemo(() => {
        const parentIds = new Set<string>();
        accounts.forEach(a => { if (a.parent_id) parentIds.add(a.parent_id); });
        const isLeaf = (id: string) => !parentIds.has(id);

        const sumLeaf = (type: AccountType) =>
            accounts.filter(a => a.type === type && isLeaf(a.id)).reduce((s, a) => s + Number(a.balance), 0);

        const assets = sumLeaf('asset');
        const liabilities = sumLeaf('liability');
        const equity = sumLeaf('equity');
        const revenue = sumLeaf('revenue');
        const expenses = sumLeaf('expense');
        const netIncome = revenue - expenses;
        const equationBalanced = Math.abs(assets - (liabilities + equity + netIncome)) < 0.01;

        return { assets, liabilities, equity, revenue, expenses, netIncome, equationBalanced };
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        if (!searchQuery) return accounts;
        return accounts.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.code.includes(searchQuery)
        );
    }, [accounts, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Chart of Accounts</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Hierarchical structure of all financial ledgers</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={fetchAccounts}>
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                    </Button>
                    <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="h-3.5 w-3.5" /> New Account
                    </Button>
                </div>
            </div>

            <Card className={cn(
                "border shadow-none rounded-md p-4",
                stats.equationBalanced ? "border-emerald-100 bg-emerald-50/30" : "border-rose-100 bg-rose-50/30"
            )}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            stats.equationBalanced ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        )}>
                            {stats.equationBalanced ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground uppercase tracking-tight">
                                {stats.equationBalanced ? 'Double-Entry Core Valid' : 'Ledger Integrity Warning'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">A = L + E + NI Analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="text-indigo-600">{fmt(stats.assets)}</span>
                        <span className="text-muted-foreground/60">=</span>
                        <span className="text-rose-600">{fmt(stats.liabilities)}</span>
                        <span className="text-muted-foreground/60">+</span>
                        <span className="text-emerald-600">{fmt(stats.equity)}</span>
                        <span className="text-muted-foreground/60">+</span>
                        <span className="text-blue-600">{fmt(stats.netIncome)}</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Assets" value={fmt(stats.assets)} icon={Landmark} trend="Debit" />
                <MetricCard title="Liabilities" value={fmt(stats.liabilities)} icon={TrendingDown} trend="Credit" trendUp={false} />
                <MetricCard title="Owner Equity" value={fmt(stats.equity)} icon={CheckCircle2} trend="Equity" trendUp />
                <MetricCard title="Net Yield" value={fmt(stats.netIncome)} icon={TrendingUp} trend="Profit" trendUp={stats.netIncome >= 0} />
            </div>

            <Card className="border shadow-sm rounded-md overflow-hidden bg-card">
                <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold">Ledger Hierarchy</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Filter accounts..." 
                            className="h-8 pl-8 text-xs rounded-md border-border" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-32">Code</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Classification</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredAccounts.map((account) => {
                                const parentIds = new Set<string>();
                                accounts.forEach(a => { if (a.parent_id) parentIds.add(a.parent_id); });
                                const isGroup = parentIds.has(account.id);
                                return (
                                    <tr key={account.id} className={cn(
                                        "hover:bg-zinc-50/50 transition-colors group",
                                        isGroup && "bg-zinc-50/20"
                                    )}>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-muted-foreground font-mono tracking-tighter">{account.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {account.parent_id && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                                                <span className={cn("text-xs font-bold", isGroup ? "text-foreground" : "text-foreground")}>
                                                    {account.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] font-black uppercase border-none",
                                                account.type === 'asset' && "bg-blue-50 text-blue-700",
                                                account.type === 'liability' && "bg-rose-50 text-rose-700",
                                                account.type === 'equity' && "bg-emerald-50 text-emerald-700",
                                                account.type === 'revenue' && "bg-foreground text-card-foreground",
                                                account.type === 'expense' && "bg-amber-50 text-amber-700",
                                            )}>{account.type}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn(
                                                "text-xs font-black tabular-nums",
                                                isGroup ? "text-muted-foreground/60 italic font-medium" : "text-foreground"
                                            )}>
                                                {isGroup ? "group" : fmt(account.balance)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: any) {
    return (
        <Card className="border shadow-sm rounded-md bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
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