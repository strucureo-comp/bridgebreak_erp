'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Plus, Search, BookOpen, Receipt,
    ArrowRightLeft, Trash2, Loader2,
    ChevronRight, FileText, Filter,
    ArrowUpRight, ArrowDownRight, RefreshCw, X
} from 'lucide-react';
import { getAccounts, createJournalEntry, getJournalEntries } from '@/lib/api';

/* ─── Types ─── */
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
    { value: 'journal', label: 'Journal Voucher', icon: BookOpen, color: 'bg-violet-50 text-violet-600', desc: 'General purpose double-entry' },
    { value: 'payment', label: 'Payment Voucher', icon: ArrowDownRight, color: 'bg-rose-50 text-rose-600', desc: 'Cash/Bank outflow' },
    { value: 'receipt', label: 'Receipt Voucher', icon: ArrowUpRight, color: 'bg-emerald-50 text-emerald-600', desc: 'Cash/Bank inflow' },
    { value: 'contra', label: 'Contra Entry', icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-600', desc: 'Bank ↔ Cash transfer' },
];

function fmt(n: number): string {
    if (n === 0) return '—';
    return Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function UnifiedEntriesContent() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
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
    }, [entries, searchQuery, filterType]);

    const totalDebit = useMemo(() => entries.reduce((s, e) => s + (e.total_debit || 0), 0), [entries]);
    const totalCredit = useMemo(() => entries.reduce((s, e) => s + (e.total_credit || 0), 0), [entries]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-slate-500">Loading entries...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Voucher Entries</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        All double-entry vouchers — Journal, Payment, Receipt & Contra
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 gap-2">
                                <Plus className="h-4 w-4" /> New Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] p-0 max-w-3xl max-h-[90vh] overflow-y-auto">
                            <VoucherForm
                                accounts={accounts}
                                onSuccess={() => { setIsFormOpen(false); fetchData(); }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-border/40 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Entries</p>
                            <p className="text-xl font-black text-slate-900">{entries.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border-border/40 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Dr</p>
                            <p className="text-xl font-black text-emerald-700">${fmt(totalDebit)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border-border/40 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <ArrowDownRight className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Cr</p>
                            <p className="text-xl font-black text-rose-700">${fmt(totalCredit)}</p>
                        </div>
                    </div>
                </Card>
                <Card className={cn(
                    "rounded-2xl border-border/40 shadow-sm p-5",
                    totalDebit === totalCredit ? "" : "border-amber-300 bg-amber-50/50"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                            totalDebit === totalCredit ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                            <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Balance</p>
                            <p className={cn("text-xl font-black",
                                totalDebit === totalCredit ? "text-emerald-700" : "text-amber-700"
                            )}>
                                {totalDebit === totalCredit ? '✓ Balanced' : `Diff: $${fmt(Math.abs(totalDebit - totalCredit))}`}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by description or reference..."
                        className="pl-10 h-11 rounded-xl border-slate-200"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Entries Table */}
            <Card className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                <th className="px-6 py-3 text-left font-bold text-slate-700">Date</th>
                                <th className="px-6 py-3 text-left font-bold text-slate-700">Reference</th>
                                <th className="px-6 py-3 text-left font-bold text-slate-700">Description / Narration</th>
                                <th className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/50">Dr ($)</th>
                                <th className="px-4 py-3 text-right font-bold text-rose-700 bg-rose-50/50">Cr ($)</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                                        <p className="font-bold text-slate-400">No voucher entries found</p>
                                        <p className="text-xs text-slate-300 mt-1">Create your first entry to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map(entry => (
                                    <EntryRow key={entry.id} entry={entry} accounts={accounts} />
                                ))
                            )}
                        </tbody>
                        {filteredEntries.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 border-t-[3px] border-double border-slate-400 font-black">
                                    <td colSpan={3} className="px-6 py-3 text-right text-xs uppercase tracking-wider text-slate-600">Totals</td>
                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-800 bg-emerald-50/50">
                                        {fmt(filteredEntries.reduce((s, e) => s + (e.total_debit || 0), 0))}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-800 bg-rose-50/50">
                                        {fmt(filteredEntries.reduce((s, e) => s + (e.total_credit || 0), 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>
        </div>
    );
}

/* ─── Entry Row (Expandable) ─── */
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
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-6 py-3 text-slate-600 font-medium">
                    {new Date(entry.date || entry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-3">
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{entry.reference || '—'}</span>
                </td>
                <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
                        <span className="font-semibold text-slate-700 truncate max-w-[300px]">{entry.description || 'Journal Entry'}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 bg-emerald-50/20">
                    {entry.total_debit > 0 ? fmt(entry.total_debit) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-700 bg-rose-50/20">
                    {entry.total_credit > 0 ? fmt(entry.total_credit) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={cn(
                        "rounded-full text-[10px] font-semibold",
                        entry.status === 'posted' ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600"
                    )}>
                        {entry.status || 'posted'}
                    </Badge>
                </td>
            </tr>
            {/* Expanded detail rows */}
            {expanded && entry.lines && entry.lines.map((line: any, i: number) => {
                const acct = accountMap[line.account_id];
                return (
                    <tr key={`${entry.id}-${i}`} className="bg-slate-50/50 border-b border-dashed border-slate-100">
                        <td className="px-6 py-2"></td>
                        <td className="px-6 py-2 text-xs font-mono text-slate-400">
                            {acct?.code || '—'}
                        </td>
                        <td className="px-6 py-2 text-xs text-slate-600 pl-14">
                            {acct?.name || line.account_id}
                            {line.description && <span className="text-slate-400 ml-2">({line.description})</span>}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-xs text-emerald-600 bg-emerald-50/10">
                            {Number(line.debit) > 0 ? fmt(Number(line.debit)) : ''}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-xs text-rose-600 bg-rose-50/10">
                            {Number(line.credit) > 0 ? fmt(Number(line.credit)) : ''}
                        </td>
                        <td></td>
                    </tr>
                );
            })}
        </>
    );
}

/* ─── Voucher Entry Form ─── */
function VoucherForm({ accounts, onSuccess, onCancel }: {
    accounts: Account[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const [voucherType, setVoucherType] = useState<VoucherType>('journal');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [narration, setNarration] = useState('');
    const [lines, setLines] = useState<EntryLine[]>([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const addLine = () => {
        setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }]);
    };

    const updateLine = (idx: number, field: keyof EntryLine, value: any) => {
        const updated = [...lines];
        (updated[idx] as any)[field] = value;

        // Auto-clear opposite side for convenience
        if (field === 'debit' && Number(value) > 0) updated[idx].credit = 0;
        if (field === 'credit' && Number(value) > 0) updated[idx].debit = 0;

        setLines(updated);
    };

    const removeLine = (idx: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== idx));
    };

    const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCr = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const isBalanced = totalDr === totalCr && totalDr > 0;

    const handleSubmit = async () => {
        if (!isBalanced) {
            toast.error('Entry is not balanced. Total Dr must equal Total Cr.');
            return;
        }

        const validLines = lines.filter(l => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
        if (validLines.length < 2) {
            toast.error('At least 2 valid lines required');
            return;
        }

        try {
            setSubmitting(true);
            await createJournalEntry({
                date,
                reference: reference || `${voucherType.toUpperCase()}-${Date.now()}`,
                description: narration || `${VOUCHER_TYPES.find(v => v.value === voucherType)?.label}`,
                lines: validLines.map(l => ({
                    account_id: l.account_id,
                    debit: Number(l.debit || 0),
                    credit: Number(l.credit || 0),
                    description: l.description || '',
                })),
            });
            toast.success('Voucher posted successfully');
            onSuccess();
        } catch (err) {
            toast.error('Failed to post voucher');
        } finally {
            setSubmitting(false);
        }
    };

    // Sort accounts by code for the dropdown
    const sortedAccounts = useMemo(() => [...accounts].sort((a, b) => a.code.localeCompare(b.code)), [accounts]);

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black tracking-tight">New Voucher Entry</h3>
                    <p className="text-sm text-muted-foreground mt-1">Create a double-entry with clear Dr & Cr</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Voucher Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VOUCHER_TYPES.map(vt => (
                    <button
                        key={vt.value}
                        onClick={() => setVoucherType(vt.value)}
                        className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            voucherType === vt.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", vt.color)}>
                            <vt.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-bold text-slate-900">{vt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{vt.desc}</p>
                    </button>
                ))}
            </div>

            {/* Meta Fields */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Reference / Voucher No.</Label>
                    <Input placeholder="Auto-generated" value={reference} onChange={e => setReference(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Narration</Label>
                    <Input placeholder="Brief description..." value={narration} onChange={e => setNarration(e.target.value)} className="h-10 rounded-xl" />
                </div>
            </div>

            {/* Entry Lines Table */}
            <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2.5 text-left font-bold text-slate-700 w-[45%]">Account</th>
                            <th className="px-3 py-2.5 text-right font-bold text-emerald-700 bg-emerald-50/50 w-[20%]">Dr ($)</th>
                            <th className="px-3 py-2.5 text-right font-bold text-rose-700 bg-rose-50/50 w-[20%]">Cr ($)</th>
                            <th className="px-3 py-2.5 text-center font-bold text-slate-500 w-[15%]">Note</th>
                            <th className="w-[40px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lines.map((line, idx) => (
                            <tr key={idx} className="group">
                                <td className="px-3 py-2">
                                    <Select value={line.account_id} onValueChange={v => updateLine(idx, 'account_id', v)}>
                                        <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200">
                                            <SelectValue placeholder="Select account..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl max-h-[200px]">
                                            {sortedAccounts.map(a => (
                                                <SelectItem key={a.id} value={a.id} className="text-xs">
                                                    <span className="font-mono text-muted-foreground mr-2">{a.code}</span>
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="px-3 py-2 bg-emerald-50/20">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-9 rounded-lg text-right font-mono text-xs border-slate-200"
                                        value={line.debit || ''}
                                        onChange={e => updateLine(idx, 'debit', e.target.value)}
                                    />
                                </td>
                                <td className="px-3 py-2 bg-rose-50/20">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-9 rounded-lg text-right font-mono text-xs border-slate-200"
                                        value={line.credit || ''}
                                        onChange={e => updateLine(idx, 'credit', e.target.value)}
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <Input
                                        placeholder="Note"
                                        className="h-9 rounded-lg text-xs border-slate-200"
                                        value={line.description || ''}
                                        onChange={e => updateLine(idx, 'description', e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
                                        onClick={() => removeLine(idx)}
                                        disabled={lines.length <= 2}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="px-4 py-2.5">
                                <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1.5 text-primary" onClick={addLine}>
                                    <Plus className="h-3 w-3" /> Add Line
                                </Button>
                            </td>
                            <td className={cn("px-3 py-2.5 text-right font-mono font-bold bg-emerald-50/50", totalDr > 0 ? "text-emerald-700" : "text-slate-400")}>
                                {totalDr > 0 ? fmt(totalDr) : '0.00'}
                            </td>
                            <td className={cn("px-3 py-2.5 text-right font-mono font-bold bg-rose-50/50", totalCr > 0 ? "text-rose-700" : "text-slate-400")}>
                                {totalCr > 0 ? fmt(totalCr) : '0.00'}
                            </td>
                            <td colSpan={2} className="px-3 py-2.5 text-center">
                                {isBalanced ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-full text-[10px]">✓ Balanced</Badge>
                                ) : totalDr > 0 || totalCr > 0 ? (
                                    <Badge className="bg-amber-100 text-amber-700 border-none rounded-full text-[10px]">
                                        Diff: ${fmt(Math.abs(totalDr - totalCr))}
                                    </Badge>
                                ) : null}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={!isBalanced || submitting}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 gap-2"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                Post Voucher
            </Button>
        </div>
    );
}
