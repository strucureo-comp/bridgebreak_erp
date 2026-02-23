'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Plus, Search, BookOpen,
    ArrowRightLeft, Trash2, Loader2,
    ChevronRight, FileText,
    ArrowUpRight, ArrowDownRight, RefreshCw, X,
    Activity
} from 'lucide-react';
import { getAccounts, createJournalEntry, getJournalEntries } from '@/lib/api';

type VoucherType = 'journal' | 'payment' | 'receipt' | 'contra';

interface EntryLine {
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
}

interface JournalEntry {
    id: string;
    date: string;
    reference: string;
    description: string;
    lines: EntryLine[];
    status: string;
    total_debit: number;
    total_credit: number;
    created_at: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    balance: number;
}

const VOUCHER_TYPES: { value: VoucherType; label: string; icon: React.ElementType; color: string; desc: string }[] = [
    { value: 'journal', label: 'Journal', icon: BookOpen, color: 'bg-muted text-foreground', desc: 'General entry' },
    { value: 'payment', label: 'Payment', icon: ArrowDownRight, color: 'bg-rose-50 text-rose-600', desc: 'Cash outflow' },
    { value: 'receipt', label: 'Receipt', icon: ArrowUpRight, color: 'bg-emerald-50 text-emerald-600', desc: 'Cash inflow' },
    { value: 'contra', label: 'Contra', icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-600', desc: 'Bank transfer' },
];

function fmt(n: number): string {
    if (n === 0) return '—';
    return Math.abs(n).toLocaleString('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0
    });
}

export function UnifiedEntriesContent() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [accts, jEntries] = await Promise.all([
                getAccounts().catch(() => []),
                getJournalEntries().catch(() => []),
            ]);
            setAccounts((accts || []) as Account[]);
            setEntries((jEntries || []) as JournalEntry[]);
        } catch (err) {
            console.error('Entries fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = searchQuery === '' ||
                e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.reference?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [entries, searchQuery]);

    const totalDebit = useMemo(() => entries.reduce((s, e) => s + (e.total_debit || 0), 0), [entries]);
    const totalCredit = useMemo(() => entries.reduce((s, e) => s + (e.total_credit || 0), 0), [entries]);

    if (loading) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Voucher Entries</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Double-entry ledger records and financial adjustments</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                                <Plus className="h-3.5 w-3.5" /> New Voucher
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-0">
                            <VoucherForm
                                accounts={accounts}
                                onSuccess={() => { setIsFormOpen(false); fetchData(); }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <MetricCard title="Total Entries" value={entries.length} icon={FileText} trend="Posted" />
                <MetricCard
                    title="Ledger Integrity"
                    value={totalDebit === totalCredit ? "Balanced" : "Drift"}
                    icon={Activity}
                    trend={totalDebit === totalCredit ? "Verified" : "Sync Error"}
                    trendUp={totalDebit === totalCredit}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search reference..."
                        className="pl-8 h-9 text-xs border-border"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={fetchData}>
                    <RefreshCw className="h-3.5 w-3.5" />
                </Button>
            </div>

            <Card className="border shadow-sm rounded-md overflow-hidden bg-card flex flex-col max-h-[600px]">
                <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-muted/95 backdrop-blur-sm border-b shadow-sm">
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reference</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Narration</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Debit</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credit</th>
                                <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {filteredEntries.map(entry => (
                                <EntryRow key={entry.id} entry={entry} accounts={accounts} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function EntryRow({ entry, accounts }: { entry: JournalEntry; accounts: Account[] }) {
    const [expanded, setExpanded] = useState(false);
    const accountMap = useMemo(() => {
        const map: Record<string, Account> = {};
        accounts.forEach(a => { map[a.id] = a; });
        return map;
    }, [accounts]);

    return (
        <>
            <tr
                className="hover:bg-zinc-50/50 cursor-pointer transition-colors group"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                    {new Date(entry.date || entry.created_at).toLocaleDateString('en-AE')}
                </td>
                <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{entry.reference || '—'}</span>
                </td>
                <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <ChevronRight className={cn("h-3 w-3 text-muted-foreground/60 transition-transform", expanded && "rotate-90 text-primary")} />
                        <span className="text-xs font-bold text-foreground truncate max-w-[300px]">{entry.description}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-right text-xs font-black text-emerald-600">
                    {entry.total_debit > 0 ? fmt(entry.total_debit) : '—'}
                </td>
                <td className="px-6 py-4 text-right text-xs font-black text-rose-600">
                    {entry.total_credit > 0 ? fmt(entry.total_credit) : '—'}
                </td>
                <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="text-[8px] font-black uppercase bg-muted border-border">Posted</Badge>
                </td>
            </tr>
            {expanded && entry.lines && entry.lines.map((line: any, i: number) => {
                const acct = accountMap[line.account_id];
                return (
                    <tr key={`${entry.id}-${i}`} className="bg-muted/30 border-b border-dashed">
                        <td colSpan={2}></td>
                        <td className="px-6 py-2">
                            <div className="flex items-center gap-2 pl-5 border-l border-border">
                                <span className="text-[10px] font-bold text-muted-foreground font-mono">{acct?.code}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">{acct?.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-2 text-right text-[10px] font-bold text-emerald-600/70">
                            {Number(line.debit) > 0 ? fmt(Number(line.debit)) : ''}
                        </td>
                        <td className="px-6 py-2 text-right text-[10px] font-bold text-rose-600/70">
                            {Number(line.credit) > 0 ? fmt(Number(line.credit)) : ''}
                        </td>
                        <td></td>
                    </tr>
                );
            })}
        </>
    );
}

function VoucherForm({ accounts, onSuccess, onCancel }: any) {
    const [voucherType, setVoucherType] = useState<VoucherType>('journal');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [narration, setNarration] = useState('');
    const [lines, setLines] = useState<EntryLine[]>([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCr = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

    const handleSubmit = async () => {
        if (!isBalanced) return toast.error('Entry unbalanced');
        setSubmitting(true);
        try {
            await createJournalEntry({
                date,
                reference: reference || `${voucherType.toUpperCase()}-${Date.now()}`,
                description: narration || `${VOUCHER_TYPES.find(v => v.value === voucherType)?.label}`,
                lines: lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0)),
            });
            toast.success('Voucher posted');
            onSuccess();
        } catch { toast.error('Failed'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-6 border-b bg-muted flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">New Voucher</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Create double-entry ledger record</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-md"><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-4 gap-2">
                    {VOUCHER_TYPES.map(vt => (
                        <button
                            key={vt.value}
                            onClick={() => setVoucherType(vt.value)}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all",
                                voucherType === vt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                            )}
                        >
                            <vt.icon className="h-4 w-4 mb-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{vt.label}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reference</Label>
                        <Input placeholder="Voucher No." value={reference} onChange={e => setReference(e.target.value)} className="h-9 text-xs" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Narration</Label>
                    <Input placeholder="Description..." value={narration} onChange={e => setNarration(e.target.value)} className="h-9 text-xs" />
                </div>

                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Debit</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credit</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {lines.map((line, idx) => (
                                <tr key={idx}>
                                    <td className="p-2">
                                        <select
                                            value={line.account_id}
                                            onChange={e => {
                                                const updated = [...lines];
                                                updated[idx].account_id = e.target.value;
                                                setLines(updated);
                                            }}
                                            className="w-full h-8 bg-transparent text-[11px] font-bold outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 bg-emerald-50/20">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full h-8 bg-transparent text-right text-[11px] font-bold outline-none"
                                            value={line.debit || ''}
                                            onChange={e => {
                                                const updated = [...lines];
                                                updated[idx].debit = parseFloat(e.target.value) || 0;
                                                updated[idx].credit = 0;
                                                setLines(updated);
                                            }}
                                        />
                                    </td>
                                    <td className="p-2 bg-rose-50/20">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full h-8 bg-transparent text-right text-[11px] font-bold outline-none"
                                            value={line.credit || ''}
                                            onChange={e => {
                                                const updated = [...lines];
                                                updated[idx].credit = parseFloat(e.target.value) || 0;
                                                updated[idx].debit = 0;
                                                setLines(updated);
                                            }}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60 hover:text-rose-500" onClick={() => setLines(lines.filter((_, i) => i !== idx))} disabled={lines.length <= 2}><Trash2 className="h-3 w-3" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-2 bg-muted flex justify-between items-center border-t">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary" onClick={() => setLines([...lines, { account_id: '', debit: 0, credit: 0 }])}>+ Line</Button>
                        <div className="flex gap-4 text-[10px] font-black uppercase">
                            <span className="text-emerald-600">DR {fmt(totalDr)}</span>
                            <span className="text-rose-600">CR {fmt(totalCr)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t bg-muted">
                <Button onClick={handleSubmit} disabled={!isBalanced || submitting} className="w-full bg-foreground h-10 font-bold uppercase tracking-widest text-xs">Post Journal Entry</Button>
            </div>
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