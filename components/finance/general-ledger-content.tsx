'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    BookOpen,
    Plus,
    Search,
    LayoutGrid,
    List,
    Briefcase,
    TrendingDown,
    CheckCircle2,
    TrendingUp,
    AlertCircle,
    Trash2,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAccounts, createAccount, createJournalEntry } from '@/lib/api';

// Types
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

interface JournalLine {
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
}

function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function GeneralLedgerContent() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
    const [isJournalOpen, setIsJournalOpen] = useState(false);

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

    const handleSeed = async () => {
        const toastId = toast.loading('Seeding Finance Data...');
        try {
            const res = await fetch('/api/admin/finance/seed', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                toast.success('Finance data seeded successfully!');
                fetchAccounts();
            } else {
                toast.error(json.error || 'Seed failed');
            }
        } catch (e) {
            toast.error('Failed to seed data');
        } finally {
            toast.dismiss(toastId);
        }
    };

    /**
     * Stats — ONLY aggregate LEAF accounts (accounts with no children).
     * This avoids the double-counting bug where parent accounts
     * (e.g., "1000 Assets") were being added alongside their children.
     */
    const stats = useMemo(() => {
        // Build a set of all parent IDs
        const parentIds = new Set<string>();
        accounts.forEach(a => {
            if (a.parent_id) parentIds.add(a.parent_id);
        });

        // isLeaf: account has no children
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

    // Build hierarchical view
    const accountTree = useMemo(() => {
        // Root accounts = no parent
        const tree: Account[] = [];
        const map: Record<string, Account & { _children?: Account[] }> = {};
        accounts.forEach(a => { map[a.id] = { ...a, _children: [] }; });
        accounts.forEach(a => {
            if (a.parent_id && map[a.parent_id]) {
                map[a.parent_id]._children!.push(map[a.id]);
            } else {
                tree.push(map[a.id]);
            }
        });
        return { tree, map };
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        if (!searchQuery) return accounts;
        return accounts.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.code.includes(searchQuery)
        );
    }, [accounts, searchQuery]);

    return (
        <div className="space-y-8 pb-12">
            {/* Visual Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">General Ledger</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Chart of Accounts & Journal Entries
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold shadow-lg shadow-indigo-200">
                                <Plus className="h-4 w-4 mr-2" />
                                New Journal Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] p-8 max-w-4xl">
                            <JournalEntryForm accounts={accounts} onSuccess={() => { setIsJournalOpen(false); fetchAccounts(); }} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Accounting Equation Verification Banner */}
            {accounts.length > 0 && (
                <Card className={cn(
                    "rounded-2xl border-2 p-5",
                    stats.equationBalanced
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-300 bg-red-50"
                )}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            {stats.equationBalanced
                                ? <ShieldCheck className="h-6 w-6 text-emerald-600" />
                                : <AlertTriangle className="h-6 w-6 text-red-600" />
                            }
                            <div>
                                <p className="font-black text-sm">
                                    {stats.equationBalanced
                                        ? '✅ Accounting Equation Balanced'
                                        : '⚠️ Accounting Equation VIOLATED'
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Assets = Liabilities + Equity + Net Income
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono font-bold flex-wrap">
                            <span className="text-indigo-700">${fmt(stats.assets)}</span>
                            <span className="text-slate-400">=</span>
                            <span className="text-rose-600">${fmt(stats.liabilities)}</span>
                            <span className="text-slate-400">+</span>
                            <span className="text-emerald-600">${fmt(stats.equity)}</span>
                            <span className="text-slate-400">+</span>
                            <span className="text-blue-600">${fmt(stats.netIncome)}</span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Quick Stats — Only LEAF account totals */}
            <div className="grid gap-6 md:grid-cols-4">
                <StatCard title="Total Assets" value={stats.assets} icon={Briefcase} color="indigo" />
                <StatCard title="Liabilities" value={stats.liabilities} icon={TrendingDown} color="rose" />
                <StatCard title="Equity" value={stats.equity} icon={CheckCircle2} color="emerald" />
                <StatCard title="Net Income" value={stats.netIncome} icon={TrendingUp} color="blue" subtitle={`Rev $${fmt(stats.revenue)} − Exp $${fmt(stats.expenses)}`} />
            </div>

            {/* Chart of Accounts */}
            <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden min-h-[500px]">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Chart of Accounts</CardTitle>
                        <CardDescription className="font-medium text-slate-400">
                            {accounts.length} accounts • Only leaf accounts carry balances
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleSeed} className="rounded-xl h-10 border-dashed border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-Seed Data
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search accounts..."
                                className="pl-10 rounded-2xl border-slate-200 bg-slate-50 w-[250px] font-bold"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <div className="p-0">
                    <div className="grid grid-cols-12 bg-slate-50/50 border-b border-slate-100 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="col-span-2 pl-4">Code</div>
                        <div className="col-span-5">Account Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-1 text-center">Leaf</div>
                        <div className="col-span-2 text-right pr-4">Balance</div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading ledgers...</div>
                        ) : accounts.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">No accounts found.</p>
                                <p className="text-sm opacity-70 mb-4">Seed the standard chart of accounts to get started.</p>
                                <Button onClick={handleSeed} className="rounded-xl">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Seed Finance Data
                                </Button>
                            </div>
                        ) : (
                            filteredAccounts.map((account) => {
                                const parentIds = new Set<string>();
                                accounts.forEach(a => { if (a.parent_id) parentIds.add(a.parent_id); });
                                const leaf = !parentIds.has(account.id);
                                const balance = Number(account.balance);
                                const isGroup = !leaf;

                                return (
                                    <div key={account.id} className={cn(
                                        "grid grid-cols-12 p-4 hover:bg-slate-50/50 transition-colors group items-center",
                                        isGroup && "bg-slate-50/30"
                                    )}>
                                        <div className="col-span-2 pl-4 font-mono font-bold text-slate-500">{account.code}</div>
                                        <div className="col-span-5 font-bold text-slate-900 flex items-center gap-2">
                                            {account.parent_id && <div className="w-4 h-[1px] bg-slate-200" />}
                                            <span className={isGroup ? 'font-black' : ''}>{account.name}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <Badge variant="secondary" className={cn(
                                                "border-none font-bold text-[10px] uppercase",
                                                account.type === 'asset' && "bg-indigo-50 text-indigo-600",
                                                account.type === 'liability' && "bg-rose-50 text-rose-600",
                                                account.type === 'equity' && "bg-emerald-50 text-emerald-600",
                                                account.type === 'revenue' && "bg-blue-50 text-blue-600",
                                                account.type === 'expense' && "bg-amber-50 text-amber-600",
                                            )}>
                                                {account.type}
                                            </Badge>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            {leaf ? (
                                                <Badge variant="outline" className="text-[9px] rounded-full bg-emerald-50 border-emerald-200 text-emerald-600">●</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[9px] rounded-full bg-slate-50 border-slate-200 text-slate-400">⊕</Badge>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "col-span-2 text-right pr-4 font-mono font-black",
                                            isGroup ? "text-slate-400 text-xs" : "text-slate-900",
                                            !isGroup && balance < 0 && "text-rose-600",
                                            !isGroup && balance > 0 && "text-slate-900",
                                        )}>
                                            {isGroup ? 'group' : `$${fmt(balance)}`}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: {
    title: string; value: number; icon: any; color: string; subtitle?: string;
}) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600",
        rose: "bg-rose-50 text-rose-600",
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", colors[color as keyof typeof colors])}>
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className={cn(
                "text-2xl font-black tracking-tight mt-1",
                value < 0 ? "text-rose-600" : "text-slate-900"
            )}>${fmt(value)}</h3>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
        </Card>
    );
}

function JournalEntryForm({ accounts, onSuccess }: { accounts: Account[], onSuccess: () => void }) {
    const [lines, setLines] = useState<JournalLine[]>([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' }
    ]);
    const [desc, setDesc] = useState('');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only show leaf accounts in the dropdown
    const leafAccounts = useMemo(() => {
        const parentIds = new Set<string>();
        accounts.forEach(a => { if (a.parent_id) parentIds.add(a.parent_id); });
        return accounts.filter(a => !parentIds.has(a.id)).sort((a, b) => a.code.localeCompare(b.code));
    }, [accounts]);

    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const addLine = () => setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }]);

    const updateLine = (idx: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines];
        (newLines[idx] as any)[field] = value;

        // Auto-clear opposite side
        if (field === 'debit' && Number(value) > 0) newLines[idx].credit = 0;
        if (field === 'credit' && Number(value) > 0) newLines[idx].debit = 0;

        setLines(newLines);
    };

    const removeLine = (idx: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!isBalanced) return toast.error('Entry must be balanced — Dr ≠ Cr');
        if (!desc) return toast.error('Description required');

        // Validate all lines have accounts
        const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
        if (validLines.length < 2) return toast.error('At least 2 valid lines required');

        setIsSubmitting(true);
        try {
            await createJournalEntry({ date, description: desc, reference, lines: validLines });
            toast.success('Journal Entry Posted ✅');
            onSuccess();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to post entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">New Journal Entry</h3>
                <p className="text-slate-500 font-medium">Double-entry — Total Debits must equal Total Credits.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="font-bold ml-1">Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label className="font-bold ml-1">Description / Narration</Label>
                    <Input placeholder="e.g. Monthly Depreciation" value={desc} onChange={e => setDesc(e.target.value)} className="h-12 rounded-xl font-bold" />
                </div>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-slate-50 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 gap-4">
                    <div className="col-span-5">Account (Leaf Only)</div>
                    <div className="col-span-2 text-right text-emerald-600">Dr ($)</div>
                    <div className="col-span-2 text-right text-rose-600">Cr ($)</div>
                    <div className="col-span-3">Note</div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {lines.map((line, i) => (
                        <div key={i} className="grid grid-cols-12 p-3 gap-3 items-center hover:bg-slate-50/50 transition-colors group">
                            <div className="col-span-5">
                                <Select value={line.account_id} onValueChange={v => updateLine(i, 'account_id', v)}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 font-medium"><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {leafAccounts.map(a => (
                                            <SelectItem key={a.id} value={a.id}>
                                                <span className="font-mono text-slate-400 mr-2">{a.code}</span>{a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Input type="number" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} className="h-10 text-right font-mono bg-emerald-50/30" placeholder="0.00" />
                            </div>
                            <div className="col-span-2 relative">
                                <Input type="number" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} className="h-10 text-right font-mono bg-rose-50/30" placeholder="0.00" />
                            </div>
                            <div className="col-span-3 flex items-center gap-1">
                                <Input placeholder="Note (optional)" value={line.description || ''} onChange={e => updateLine(i, 'description', e.target.value)} className="h-10 border-slate-200" />
                                {lines.length > 2 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)} className="h-8 w-8 text-slate-300 hover:text-rose-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-slate-50 flex justify-center border-t border-slate-100">
                    <Button variant="ghost" size="sm" onClick={addLine} className="text-slate-600 font-bold"><Plus className="h-4 w-4 mr-2" /> Add Line</Button>
                </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200">
                <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Balance Check</div>
                    <div className="flex items-center gap-2">
                        {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
                        <span className={cn("text-sm font-bold", isBalanced ? "text-emerald-400" : "text-rose-400")}>
                            {isBalanced ? "✅ Balanced" : "⚠️ Unbalanced"}
                        </span>
                    </div>
                </div>
                <div className="flex gap-12 text-2xl font-black font-mono tracking-tight">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Dr</span>
                        <span className="text-emerald-400">${fmt(totalDebit)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Cr</span>
                        <span className="text-emerald-400">${fmt(totalCredit)}</span>
                    </div>
                </div>
            </div>

            <Button onClick={handleSubmit} disabled={!isBalanced || isSubmitting} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-200/50 transition-all hover:scale-[1.01] active:scale-[0.98]">
                {isSubmitting ? 'Posting Entry...' : 'Post Journal Entry'}
            </Button>
        </div>
    );
}
