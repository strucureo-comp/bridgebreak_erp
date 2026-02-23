'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BookOpen, Plus, Search, ChevronLeft, Loader2, Lock,
    CheckCircle2, Clock, ArrowRightLeft, FileText, RotateCcw,
    AlertTriangle, Filter
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── MOCK: CHART OF ACCOUNTS ────────────────────────────────────────────────────
const COA: CoaAccount[] = [
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

// ── MOCK: JOURNAL ENTRIES ──────────────────────────────────────────────────────
const JOURNALS: JournalEntry[] = [
    { id: 'JE-0048', date: '2026-02-22', type: 'Standard', description: 'Monthly rent payment', debit: 24000, credit: 24000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO' },
    { id: 'JE-0047', date: '2026-02-21', type: 'Standard', description: 'Client payment received — Al Futtaim', debit: 127000, credit: 127000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO' },
    { id: 'JE-0046', date: '2026-02-20', type: 'Recurring', description: 'AWS subscription — Feb 2026', debit: 8200, credit: 8200, status: 'posted', createdBy: 'system', approvedBy: 'auto' },
    { id: 'JE-0045', date: '2026-02-19', type: 'Reversal', description: 'Rev: Accrual reversal Dec payroll', debit: 45000, credit: 45000, status: 'posted', createdBy: 'admin', approvedBy: 'CFO' },
    { id: 'JE-0044', date: '2026-02-18', type: 'Standard', description: 'Depreciation — Feb 2026', debit: 4000, credit: 4000, status: 'draft', createdBy: 'admin', approvedBy: null },
    { id: 'JE-0043', date: '2026-02-17', type: 'Standard', description: 'Vendor payment — XYZ Logistics', debit: 18500, credit: 18500, status: 'draft', createdBy: 'admin', approvedBy: null },
];

// ── MOCK: TRIAL BALANCE ────────────────────────────────────────────────────────
const TRIAL_BALANCE = COA.map(a => ({
    code: a.code, name: a.name, type: a.type,
    debit: a.balance > 0 ? Math.abs(a.balance) : 0,
    credit: a.balance < 0 ? Math.abs(a.balance) : (['Liability', 'Equity', 'Revenue'].includes(a.type) ? Math.abs(a.balance) : 0),
}));

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface CoaAccount { code: string; name: string; type: string; group: string; balance: number; currency: string; status: string; subLedger: string | null; }
interface JournalEntry { id: string; date: string; type: string; description: string; debit: number; credit: number; status: string; createdBy: string; approvedBy: string | null; }

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function GeneralLedgerPage() {
    const { format: fmt } = useCurrency();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('coa');

    const totalAssets = COA.filter(a => a.type === 'Asset').reduce((s, a) => s + a.balance, 0);
    const totalLiab = COA.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
    const totalEquity = COA.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0);
    const draftJournals = JOURNALS.filter(j => j.status === 'draft').length;

    const filteredCOA = useMemo(() =>
        COA.filter(a => `${a.code} ${a.name} ${a.type} ${a.group}`.toLowerCase().includes(search.toLowerCase())), [search]);

    const trialDebit = TRIAL_BALANCE.reduce((s, t) => s + t.debit, 0);
    const trialCredit = TRIAL_BALANCE.reduce((s, t) => s + t.credit, 0);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">General Ledger</h1>
                            <p className="text-[11px] text-muted-foreground">Accounting Core · Chart of Accounts · Journals · Trial Balance</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600">Period Open</Badge>
                </div>

                {/* KPI Strip */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <MiniKpi label="Total Assets" value={fmt(totalAssets)} />
                    <MiniKpi label="Total Liabilities" value={fmt(Math.abs(totalLiab))} />
                    <MiniKpi label="Total Equity" value={fmt(Math.abs(totalEquity))} />
                    <MiniKpi label="Unposted JE" value={String(draftJournals)} alert={draftJournals > 0} />
                </div>

                {/* Tabs */}
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
                                <Input placeholder="Search accounts..." className="pl-9 h-9 w-72 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700"><Plus className="h-3.5 w-3.5" /> Add Account</Button>
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
                                        <div key={a.code} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs font-bold text-red-600">{a.code}</span>
                                            <span className="col-span-3 font-medium truncate">{a.name}</span>
                                            <span className="col-span-2"><TypeBadge type={a.type} /></span>
                                            <span className="col-span-2 text-xs text-muted-foreground truncate">{a.group}</span>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{a.subLedger ?? '—'}</span>
                                            <span className={cn("col-span-2 text-right font-bold text-xs", a.balance < 0 && "text-red-600")}>{fmt(a.balance)}</span>
                                            <span className="col-span-1 text-right"><Badge variant="outline" className="text-[8px] h-4 px-1">{a.status}</Badge></span>
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
                                <Badge variant="outline" className="text-[9px]">{JOURNALS.length} entries</Badge>
                                <Badge variant="secondary" className="text-[9px]">{draftJournals} draft</Badge>
                            </div>
                            <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700"><Plus className="h-3.5 w-3.5" /> New Journal Entry</Button>
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
                                        <span className="col-span-1">By</span>
                                    </div>
                                    {JOURNALS.map(j => (
                                        <div key={j.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs font-bold text-red-600">{j.id}</span>
                                            <span className="col-span-1 text-xs text-muted-foreground">{j.date.slice(5)}</span>
                                            <span className="col-span-1"><JournalTypeBadge type={j.type} /></span>
                                            <span className="col-span-3 text-xs truncate">{j.description}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(j.debit)}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(j.credit)}</span>
                                            <span className="col-span-1"><StatusBadge status={j.status} /></span>
                                            <span className="col-span-1 text-[10px] text-muted-foreground">{j.createdBy}</span>
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
                            <div className="flex items-center gap-2">
                                <Badge variant={trialDebit === trialCredit ? 'default' : 'destructive'} className="text-[9px]">
                                    {trialDebit === trialCredit ? '✓ Balanced' : '✗ Imbalanced'}
                                </Badge>
                            </div>
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
                                    </div>
                                    {TRIAL_BALANCE.map(t => (
                                        <div key={t.code} className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-1 font-mono text-xs text-red-600">{t.code}</span>
                                            <span className="col-span-4 text-xs font-medium">{t.name}</span>
                                            <span className="col-span-2"><TypeBadge type={t.type} /></span>
                                            <span className="col-span-2 text-right text-xs font-bold">{t.debit > 0 ? fmt(t.debit) : ''}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{t.credit > 0 ? fmt(t.credit) : ''}</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 font-bold text-sm border-t-2">
                                        <span className="col-span-7">Total</span>
                                        <span className="col-span-2 text-right">{fmt(trialDebit)}</span>
                                        <span className="col-span-2 text-right">{fmt(trialCredit)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

// ── Helper Components ──────────────────────────────────────────────────────────
function MiniKpi({ label, value, alert: hasAlert }: { label: string; value: string; alert?: boolean }) {
    return (
        <Card className={cn("border-border shadow-sm", hasAlert && "border-red-200")}>
            <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
                <p className="text-lg font-bold tracking-tight">{value}</p>
                {hasAlert && <p className="text-[10px] text-red-600 font-medium mt-0.5 flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" /> Needs posting</p>}
            </CardContent>
        </Card>
    );
}

function TypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = { Asset: 'bg-blue-50 text-blue-700', Liability: 'bg-amber-50 text-amber-700', Equity: 'bg-violet-50 text-violet-700', Revenue: 'bg-emerald-50 text-emerald-700', Expense: 'bg-red-50 text-red-700' };
    return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", c[type] ?? 'bg-muted')}>{type}</span>;
}

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={status === 'posted' ? 'default' : status === 'draft' ? 'outline' : 'destructive'} className="text-[8px] h-4 px-1">{status}</Badge>;
}

function JournalTypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = { Standard: 'bg-blue-50 text-blue-700', Recurring: 'bg-emerald-50 text-emerald-700', Reversal: 'bg-amber-50 text-amber-700' };
    return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", c[type] ?? 'bg-muted')}>{type}</span>;
}
