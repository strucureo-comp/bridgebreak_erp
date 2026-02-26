'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader } from '@/components/finance/FinancePageHeader';
import {
    BookOpen, Plus, Search, AlertTriangle, Trash2, PlusCircle,
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface CoaAccount {
    code: string; name: string; type: string; group: string;
    balance: number; currency: string; status: string; subLedger: string | null;
}

interface JournalLine {
    account: string;
    description: string;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: string; date: string; type: string; description: string;
    debit: number; credit: number; status: string;
    createdBy: string; approvedBy: string | null;
    lines: JournalLine[];
}

// ── INITIAL COA ────────────────────────────────────────────────────────────────
const INITIAL_COA: CoaAccount[] = [
    { code: '1000', name: 'Cash & Bank', type: 'Asset', group: 'Current Assets', balance: 1840000, currency: 'AED', status: 'active', subLedger: 'Bank' },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset', group: 'Current Assets', balance: 542000, currency: 'AED', status: 'active', subLedger: 'AR' },
    { code: '1200', name: 'Inventory', type: 'Asset', group: 'Current Assets', balance: 380000, currency: 'AED', status: 'active', subLedger: 'Inventory' },
    { code: '1300', name: 'Prepaid Expenses', type: 'Asset', group: 'Current Assets', balance: 45000, currency: 'AED', status: 'active', subLedger: null },
    { code: '1500', name: 'Property, Plant & Equipment', type: 'Asset', group: 'Non-Current Assets', balance: 1200000, currency: 'AED', status: 'active', subLedger: 'FA' },
    { code: '1510', name: 'Accumulated Depreciation', type: 'Asset', group: 'Non-Current Assets', balance: -240000, currency: 'AED', status: 'active', subLedger: 'FA' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability', group: 'Current Liabilities', balance: 218000, currency: 'AED', status: 'active', subLedger: 'AP' },
    { code: '2100', name: 'Accrued Expenses', type: 'Liability', group: 'Current Liabilities', balance: 67000, currency: 'AED', status: 'active', subLedger: null },
    { code: '2200', name: 'VAT Payable', type: 'Liability', group: 'Current Liabilities', balance: 123000, currency: 'AED', status: 'active', subLedger: 'Tax' },
    { code: '2300', name: 'Unearned Revenue', type: 'Liability', group: 'Current Liabilities', balance: 89000, currency: 'AED', status: 'active', subLedger: null },
    { code: '2500', name: 'Long-term Loan', type: 'Liability', group: 'Non-Current Liabilities', balance: 500000, currency: 'AED', status: 'active', subLedger: null },
    { code: '3000', name: 'Share Capital', type: 'Equity', group: 'Equity', balance: 1000000, currency: 'AED', status: 'active', subLedger: null },
    { code: '3100', name: 'Retained Earnings', type: 'Equity', group: 'Equity', balance: 850000, currency: 'AED', status: 'active', subLedger: null },
    { code: '4000', name: 'Sales Revenue', type: 'Revenue', group: 'Operating Revenue', balance: 2460000, currency: 'AED', status: 'active', subLedger: null },
    { code: '4100', name: 'Service Revenue', type: 'Revenue', group: 'Operating Revenue', balance: 340000, currency: 'AED', status: 'active', subLedger: null },
    { code: '4500', name: 'Other Income', type: 'Revenue', group: 'Other Income', balance: 28000, currency: 'AED', status: 'active', subLedger: null },
    { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', group: 'Direct Costs', balance: 412000, currency: 'AED', status: 'active', subLedger: 'Inventory' },
    { code: '5100', name: 'Direct Labour', type: 'Expense', group: 'Direct Costs', balance: 180000, currency: 'AED', status: 'active', subLedger: null },
    { code: '6000', name: 'Salaries & Wages', type: 'Expense', group: 'Operating Expenses', balance: 156000, currency: 'AED', status: 'active', subLedger: null },
    { code: '6100', name: 'Rent Expense', type: 'Expense', group: 'Operating Expenses', balance: 72000, currency: 'AED', status: 'active', subLedger: null },
    { code: '6200', name: 'Utilities', type: 'Expense', group: 'Operating Expenses', balance: 18500, currency: 'AED', status: 'active', subLedger: null },
    { code: '6300', name: 'Depreciation Expense', type: 'Expense', group: 'Operating Expenses', balance: 48000, currency: 'AED', status: 'active', subLedger: 'FA' },
    { code: '6400', name: 'Insurance', type: 'Expense', group: 'Operating Expenses', balance: 24000, currency: 'AED', status: 'active', subLedger: null },
    { code: '7000', name: 'Interest Expense', type: 'Expense', group: 'Finance Costs', balance: 32000, currency: 'AED', status: 'active', subLedger: null },
    { code: '7100', name: 'FX Loss', type: 'Expense', group: 'Finance Costs', balance: 8400, currency: 'AED', status: 'active', subLedger: null },
];

const INITIAL_JOURNALS: JournalEntry[] = [
    { id: 'JE-0048', date: '2026-02-22', type: 'Standard', description: 'Monthly rent payment', debit: 24000, credit: 24000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO', lines: [] },
    { id: 'JE-0047', date: '2026-02-21', type: 'Standard', description: 'Client payment — Al Futtaim', debit: 127000, credit: 127000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO', lines: [] },
    { id: 'JE-0046', date: '2026-02-20', type: 'Recurring', description: 'AWS subscription — Feb 2026', debit: 8200, credit: 8200, status: 'posted', createdBy: 'system', approvedBy: 'auto', lines: [] },
    { id: 'JE-0045', date: '2026-02-19', type: 'Reversal', description: 'Rev: Accrual reversal Dec payroll', debit: 45000, credit: 45000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO', lines: [] },
    { id: 'JE-0044', date: '2026-02-18', type: 'Standard', description: 'Depreciation — Feb 2026', debit: 4000, credit: 4000, status: 'draft', createdBy: 'admin', approvedBy: null, lines: [] },
    { id: 'JE-0043', date: '2026-02-17', type: 'Standard', description: 'Vendor payment — XYZ Logistics', debit: 18500, credit: 18500, status: 'draft', createdBy: 'admin', approvedBy: null, lines: [] },
];

const ACCOUNT_GROUPS: Record<string, string[]> = {
    Asset: ['Current Assets', 'Non-Current Assets'],
    Liability: ['Current Liabilities', 'Non-Current Liabilities'],
    Equity: ['Equity', 'Reserves'],
    Revenue: ['Operating Revenue', 'Other Income'],
    Expense: ['Direct Costs', 'Operating Expenses', 'Finance Costs'],
};

const EMPTY_LINE: JournalLine = { account: '', description: '', debit: 0, credit: 0 };

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function GeneralLedgerPage() {
    const { format: fmt } = useCurrency();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('coa');

    // ── Data state ──
    const [coa, setCoa] = useState<CoaAccount[]>(INITIAL_COA);
    const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);

    // ── Account dialog ──
    const [acctOpen, setAcctOpen] = useState(false);
    const [editAcct, setEditAcct] = useState<Partial<CoaAccount>>({});

    // ── Journal dialog ──
    const [jeOpen, setJeOpen] = useState(false);
    const [jeForm, setJeForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        type: 'Standard',
        description: '',
    });
    const [jeLines, setJeLines] = useState<JournalLine[]>([
        { ...EMPTY_LINE },
        { ...EMPTY_LINE },
    ]);

    // ── Derived ──
    const totalAssets = coa.filter(a => a.type === 'Asset').reduce((s, a) => s + a.balance, 0);
    const totalLiab = coa.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
    const totalEquity = coa.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0);
    const draftJEs = journals.filter(j => j.status === 'draft').length;

    const filteredCOA = useMemo(() =>
        coa.filter(a =>
            `${a.code} ${a.name} ${a.type} ${a.group}`.toLowerCase().includes(search.toLowerCase()),
        ), [coa, search],
    );

    const trialBalance = useMemo(() => coa.map(a => ({
        code: a.code, name: a.name, type: a.type,
        debit: a.balance > 0 ? Math.abs(a.balance) : 0,
        credit: a.balance < 0
            ? Math.abs(a.balance)
            : (['Liability', 'Equity', 'Revenue'].includes(a.type) ? Math.abs(a.balance) : 0),
    })), [coa]);

    const trialDebit = trialBalance.reduce((s, t) => s + t.debit, 0);
    const trialCredit = trialBalance.reduce((s, t) => s + t.credit, 0);

    // ── Journal line helpers ──
    const jeDebitTotal = jeLines.reduce((s, l) => s + (l.debit || 0), 0);
    const jeCreditTotal = jeLines.reduce((s, l) => s + (l.credit || 0), 0);
    const jeBalanced = Math.abs(jeDebitTotal - jeCreditTotal) < 0.01;

    const updateLine = useCallback((idx: number, patch: Partial<JournalLine>) => {
        setJeLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
    }, []);
    const addLine = () => setJeLines(prev => [...prev, { ...EMPTY_LINE }]);
    const removeLine = (idx: number) => setJeLines(prev => prev.filter((_, i) => i !== idx));

    // ── Save Account ──
    const saveAccount = () => {
        if (!editAcct.code || !editAcct.name || !editAcct.type) {
            toast.error('Code, Name and Type are required');
            return;
        }
        if (coa.find(a => a.code === editAcct.code && a.code !== editAcct.code)) {
            toast.error('Account code already exists'); return;
        }
        const isEdit = coa.some(a => a.code === editAcct.code);
        if (isEdit) {
            setCoa(prev => prev.map(a => a.code === editAcct.code ? { ...a, ...editAcct } as CoaAccount : a));
            toast.success('Account updated');
        } else {
            setCoa(prev => [...prev, {
                code: editAcct.code!, name: editAcct.name!, type: editAcct.type!,
                group: editAcct.group ?? '', balance: 0, currency: 'AED',
                status: 'active', subLedger: editAcct.subLedger ?? null,
            }].sort((a, b) => a.code.localeCompare(b.code)));
            toast.success('Account created');
        }
        setAcctOpen(false);
        setEditAcct({});
    };

    // ── Save Journal Entry ──
    const saveJE = () => {
        if (!jeForm.description) { toast.error('Description is required'); return; }
        if (jeLines.some(l => !l.account)) { toast.error('All lines must have an account'); return; }
        if (!jeBalanced) { toast.error(`Debit (${fmt(jeDebitTotal)}) ≠ Credit (${fmt(jeCreditTotal)}) — journal must balance`); return; }
        const nextId = `JE-${String(journals.length + 49).padStart(4, '0')}`;
        const newJE: JournalEntry = {
            id: nextId,
            date: jeForm.date,
            type: jeForm.type,
            description: jeForm.description,
            debit: jeDebitTotal, credit: jeCreditTotal,
            status: 'draft', createdBy: 'admin', approvedBy: null,
            lines: jeLines,
        };
        setJournals(prev => [newJE, ...prev]);
        toast.success(`${nextId} saved as draft`);
        setJeOpen(false);
        setJeForm({ date: new Date().toISOString().slice(0, 10), type: 'Standard', description: '' });
        setJeLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
    };

    // ── Post draft JE ──
    const postJE = (id: string) => {
        setJournals(prev =>
            prev.map(j => j.id === id ? { ...j, status: 'posted', approvedBy: 'admin' } : j),
        );
        toast.success(`${id} posted`);
    };

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <FinancePageHeader
                    title="General Ledger"
                    subtitle="Accounting Core · Chart of Accounts · Journals · Trial Balance"
                    icon={BookOpen}
                    badges={
                        <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600">
                            Period Open
                        </Badge>
                    }
                />

                {/* KPI Strip */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <KpiCard label="Total Assets" value={fmt(totalAssets)} />
                    <KpiCard label="Total Liabilities" value={fmt(Math.abs(totalLiab))} />
                    <KpiCard label="Total Equity" value={fmt(Math.abs(totalEquity))} />
                    <KpiCard
                        label="Unposted JE"
                        value={String(draftJEs)}
                        alert={draftJEs > 0}
                        footer={draftJEs > 0 ? 'Needs posting' : undefined}
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="coa" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Chart of Accounts</TabsTrigger>
                        <TabsTrigger value="journals" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Journal Entries</TabsTrigger>
                        <TabsTrigger value="trial" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Trial Balance</TabsTrigger>
                    </TabsList>

                    {/* ── Chart of Accounts ── */}
                    <TabsContent value="coa" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search accounts…"
                                    className="pl-9 h-9 w-72 text-sm"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                size="sm"
                                className="gap-2 bg-red-600 hover:bg-red-700"
                                onClick={() => { setEditAcct({}); setAcctOpen(true); }}
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Account
                            </Button>
                        </div>

                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">Code</span>
                                        <span className="col-span-3">Account Name</span>
                                        <span className="col-span-2">Type</span>
                                        <span className="col-span-2">Group</span>
                                        <span className="col-span-1">Sub-Ledger</span>
                                        <span className="col-span-2 text-right">Balance</span>
                                        <span className="col-span-1 text-right">Status</span>
                                    </div>
                                    {filteredCOA.map(a => (
                                        <div
                                            key={a.code}
                                            className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm group cursor-pointer"
                                            onClick={() => { setEditAcct({ ...a }); setAcctOpen(true); }}
                                        >
                                            <span className="col-span-1 font-mono text-xs font-bold text-red-600">{a.code}</span>
                                            <span className="col-span-3 font-medium truncate">{a.name}</span>
                                            <span className="col-span-2"><TypeBadge type={a.type} /></span>
                                            <span className="col-span-2 text-xs text-muted-foreground truncate">{a.group}</span>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{a.subLedger ?? '—'}</span>
                                            <span className={cn('col-span-2 text-right font-bold text-xs', a.balance < 0 && 'text-red-600')}>
                                                {fmt(a.balance)}
                                            </span>
                                            <span className="col-span-1 text-right">
                                                <Badge variant="outline" className="text-[8px] h-4 px-1">{a.status}</Badge>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Journals ── */}
                    <TabsContent value="journals" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px]">{journals.length} entries</Badge>
                                {draftJEs > 0 && <Badge variant="secondary" className="text-[9px]">{draftJEs} draft</Badge>}
                            </div>
                            <Button
                                size="sm"
                                className="gap-2 bg-red-600 hover:bg-red-700"
                                onClick={() => setJeOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5" /> New Journal Entry
                            </Button>
                        </div>

                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">ID</span>
                                        <span className="col-span-1">Date</span>
                                        <span className="col-span-1">Type</span>
                                        <span className="col-span-3">Description</span>
                                        <span className="col-span-2 text-right">Debit</span>
                                        <span className="col-span-2 text-right">Credit</span>
                                        <span className="col-span-1">Status</span>
                                        <span className="col-span-1 text-right">Action</span>
                                    </div>
                                    {journals.map(j => (
                                        <div key={j.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs font-bold text-red-600">{j.id}</span>
                                            <span className="col-span-1 text-xs text-muted-foreground">{j.date.slice(5)}</span>
                                            <span className="col-span-1"><JTypeBadge type={j.type} /></span>
                                            <span className="col-span-3 text-xs truncate">{j.description}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(j.debit)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(j.credit)}</span>
                                            <span className="col-span-1"><StatusBadge status={j.status} /></span>
                                            <span className="col-span-1 text-right">
                                                {j.status === 'draft' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[10px] px-2"
                                                        onClick={() => postJE(j.id)}
                                                    >
                                                        Post
                                                    </Button>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Trial Balance ── */}
                    <TabsContent value="trial" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">As at 28 Feb 2026</p>
                            <Badge
                                variant={trialDebit === trialCredit ? 'default' : 'destructive'}
                                className="text-[9px]"
                            >
                                {trialDebit === trialCredit ? '✓ Balanced' : '✗ Imbalanced'}
                            </Badge>
                        </div>
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">Code</span>
                                        <span className="col-span-4">Account</span>
                                        <span className="col-span-2">Type</span>
                                        <span className="col-span-2 text-right">Debit</span>
                                        <span className="col-span-2 text-right">Credit</span>
                                        <span className="col-span-1" />
                                    </div>
                                    {trialBalance.map(t => (
                                        <div key={t.code} className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{t.code}</span>
                                            <span className="col-span-4 text-xs font-medium">{t.name}</span>
                                            <span className="col-span-2"><TypeBadge type={t.type} /></span>
                                            <span className="col-span-2 text-right text-xs font-bold">{t.debit > 0 ? fmt(t.debit) : ''}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{t.credit > 0 ? fmt(t.credit) : ''}</span>
                                            <span className="col-span-1" />
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 font-bold text-sm border-t-2">
                                        <span className="col-span-7">Total</span>
                                        <span className="col-span-2 text-right">{fmt(trialDebit)}</span>
                                        <span className="col-span-2 text-right">{fmt(trialCredit)}</span>
                                        <span className="col-span-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* ── ADD / EDIT ACCOUNT DIALOG ── */}
                <Dialog open={acctOpen} onOpenChange={v => { setAcctOpen(v); if (!v) setEditAcct({}); }}>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>{editAcct.code && coa.some(a => a.code === editAcct.code) ? 'Edit Account' : 'Add GL Account'}</DialogTitle>
                            <DialogDescription className="text-xs">
                                Define a new account in the Chart of Accounts. Code must be unique.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Account Code *</Label>
                                    <Input
                                        value={editAcct.code ?? ''}
                                        onChange={e => setEditAcct(p => ({ ...p, code: e.target.value }))}
                                        placeholder="e.g. 6500"
                                        className="h-9 text-xs font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Account Type *</Label>
                                    <Select
                                        value={editAcct.type ?? ''}
                                        onValueChange={v => setEditAcct(p => ({ ...p, type: v, group: '' }))}
                                    >
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(ACCOUNT_GROUPS).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Account Name *</Label>
                                <Input
                                    value={editAcct.name ?? ''}
                                    onChange={e => setEditAcct(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Employee Welfare Expenses"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Group / Category</Label>
                                    <Select
                                        value={editAcct.group ?? ''}
                                        onValueChange={v => setEditAcct(p => ({ ...p, group: v }))}
                                        disabled={!editAcct.type}
                                    >
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select group" /></SelectTrigger>
                                        <SelectContent>
                                            {(ACCOUNT_GROUPS[editAcct.type ?? ''] ?? []).map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Sub-Ledger (optional)</Label>
                                    <Select
                                        value={editAcct.subLedger ?? 'none'}
                                        onValueChange={v => setEditAcct(p => ({ ...p, subLedger: v === 'none' ? null : v }))}
                                    >
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {['AR', 'AP', 'Bank', 'FA', 'Inventory', 'Tax', 'Project'].map(sl => (
                                                <SelectItem key={sl} value={sl}>{sl}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Status</Label>
                                <Select
                                    value={editAcct.status ?? 'active'}
                                    onValueChange={v => setEditAcct(p => ({ ...p, status: v }))}
                                >
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="locked">Locked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setAcctOpen(false)}>Cancel</Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={saveAccount}>Save Account</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── NEW JOURNAL ENTRY DIALOG ── */}
                <Dialog open={jeOpen} onOpenChange={v => { setJeOpen(v); }}>
                    <DialogContent className="sm:max-w-[680px] max-h-[88vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>New Journal Entry</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter debit and credit lines. Debit must equal Credit before posting.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {/* Header fields */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Date *</Label>
                                    <Input
                                        type="date"
                                        value={jeForm.date}
                                        onChange={e => setJeForm(p => ({ ...p, date: e.target.value }))}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Type</Label>
                                    <Select value={jeForm.type} onValueChange={v => setJeForm(p => ({ ...p, type: v }))}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="Recurring">Recurring</SelectItem>
                                            <SelectItem value="Reversal">Reversal</SelectItem>
                                            <SelectItem value="Accrual">Accrual</SelectItem>
                                            <SelectItem value="Opening">Opening</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1 space-y-2" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Description / Narration *</Label>
                                <Input
                                    value={jeForm.description}
                                    onChange={e => setJeForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="e.g. Monthly rent — Feb 2026"
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* Line items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-bold">Journal Lines</Label>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={addLine}>
                                        <PlusCircle className="h-2.5 w-2.5" /> Add Line
                                    </Button>
                                </div>

                                {/* Line header */}
                                <div className="grid grid-cols-12 px-2 py-1.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider rounded-t border">
                                    <span className="col-span-4">Account</span>
                                    <span className="col-span-3">Description</span>
                                    <span className="col-span-2 text-right">Debit</span>
                                    <span className="col-span-2 text-right">Credit</span>
                                    <span className="col-span-1" />
                                </div>

                                <div className="border border-t-0 rounded-b divide-y">
                                    {jeLines.map((line, i) => (
                                        <div key={i} className="grid grid-cols-12 px-2 py-1.5 items-center gap-1">
                                            <div className="col-span-4">
                                                <Select
                                                    value={line.account}
                                                    onValueChange={v => updateLine(i, { account: v })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Account…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {coa.filter(a => a.status === 'active').map(a => (
                                                            <SelectItem key={a.code} value={a.code}>
                                                                {a.code} – {a.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    value={line.description}
                                                    onChange={e => updateLine(i, { description: e.target.value })}
                                                    placeholder="Narration"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={line.debit || ''}
                                                    onChange={e => updateLine(i, { debit: Number(e.target.value), credit: 0 })}
                                                    placeholder="0.00"
                                                    className="h-8 text-xs text-right"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={line.credit || ''}
                                                    onChange={e => updateLine(i, { credit: Number(e.target.value), debit: 0 })}
                                                    placeholder="0.00"
                                                    className="h-8 text-xs text-right"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                {jeLines.length > 2 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive"
                                                        onClick={() => removeLine(i)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals row */}
                                <div className="grid grid-cols-12 px-2 py-2 mt-1 bg-muted/30 rounded text-xs font-bold">
                                    <span className="col-span-7 text-right text-muted-foreground pr-2">Totals</span>
                                    <span className={cn('col-span-2 text-right', !jeBalanced && 'text-red-600')}>
                                        {fmt(jeDebitTotal)}
                                    </span>
                                    <span className={cn('col-span-2 text-right', !jeBalanced && 'text-red-600')}>
                                        {fmt(jeCreditTotal)}
                                    </span>
                                    <span className="col-span-1 text-right">
                                        {jeBalanced
                                            ? <span className="text-emerald-600 text-[10px]">✓</span>
                                            : <AlertTriangle className="h-3 w-3 text-red-500 inline-block" />
                                        }
                                    </span>
                                </div>
                                {!jeBalanced && (
                                    <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Difference: {fmt(Math.abs(jeDebitTotal - jeCreditTotal))}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setJeOpen(false)}>Cancel</Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={saveJE}>
                                Save as Draft
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = {
        Asset: 'bg-blue-50 text-blue-700',
        Liability: 'bg-amber-50 text-amber-700',
        Equity: 'bg-violet-50 text-violet-700',
        Revenue: 'bg-emerald-50 text-emerald-700',
        Expense: 'bg-red-50 text-red-700',
    };
    return <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', c[type] ?? 'bg-muted')}>{type}</span>;
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge
            variant={status === 'posted' ? 'default' : status === 'draft' ? 'outline' : 'destructive'}
            className="text-[8px] h-4 px-1"
        >
            {status}
        </Badge>
    );
}

function JTypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = {
        Standard: 'bg-blue-50 text-blue-700',
        Recurring: 'bg-emerald-50 text-emerald-700',
        Reversal: 'bg-amber-50 text-amber-700',
        Accrual: 'bg-violet-50 text-violet-700',
        Opening: 'bg-gray-100 text-gray-700',
    };
    return <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', c[type] ?? 'bg-muted')}>{type}</span>;
}
