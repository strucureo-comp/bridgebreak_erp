'use client';

import { useState, useCallback } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader } from '@/components/finance/FinancePageHeader';
import { Lock, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface ChecklistTask {
    id: number;
    task: string;
    category: string;
    assignee: string;
    done: boolean;
    /** Blocking tasks must be completed before "Close Period" is allowed */
    blocking: boolean;
}

interface PeriodRecord {
    id: string;
    label: string;
    status: 'open' | 'closed' | 'locked';
    closedBy: string | null;
    closedAt: string | null;
}

interface AuditEntry {
    timestamp: string;
    user: string;
    action: string;
    detail: string;
    module: string;
}

// ── INITIAL DATA ───────────────────────────────────────────────────────────────
const INITIAL_CHECKLIST: ChecklistTask[] = [
    { id: 1, task: 'Bank reconciliation completed', category: 'Treasury', done: true, assignee: 'Treasury', blocking: true },
    { id: 2, task: 'AR aging reviewed — overdue items addressed', category: 'AR', done: true, assignee: 'AR Team', blocking: true },
    { id: 3, task: 'AP aging reviewed — payment schedule confirmed', category: 'AP', done: true, assignee: 'AP Team', blocking: false },
    { id: 4, task: 'Accruals posted (payroll, rent, utilities)', category: 'GL', done: false, assignee: 'Controller', blocking: true },
    { id: 5, task: 'Depreciation run executed', category: 'FA', done: false, assignee: 'Controller', blocking: true },
    { id: 6, task: 'FX revaluation processed', category: 'FX', done: true, assignee: 'Treasury', blocking: false },
    { id: 7, task: 'Tax accrual calculated & posted', category: 'Tax', done: false, assignee: 'Tax Manager', blocking: true },
    { id: 8, task: 'Intercompany reconciliation balanced', category: 'IC', done: true, assignee: 'Group Finance', blocking: true },
    { id: 9, task: 'Inventory valuation validated', category: 'Inventory', done: true, assignee: 'Warehouse', blocking: false },
    { id: 10, task: 'Revenue recognition reviewed', category: 'Revenue', done: false, assignee: 'Controller', blocking: false },
    { id: 11, task: 'Trial balance balanced (Dr = Cr)', category: 'GL', done: true, assignee: 'Controller', blocking: true },
    { id: 12, task: 'Management review & sign-off', category: 'Governance', done: false, assignee: 'CFO', blocking: true },
];

const INITIAL_PERIODS: PeriodRecord[] = [
    { id: 'P11', label: 'Feb 2026', status: 'open', closedBy: null, closedAt: null },
    { id: 'P10', label: 'Jan 2026', status: 'closed', closedBy: 'CFO', closedAt: '2026-02-05' },
    { id: 'P09', label: 'Dec 2025', status: 'closed', closedBy: 'CFO', closedAt: '2026-01-08' },
    { id: 'P08', label: 'Nov 2025', status: 'locked', closedBy: 'CFO', closedAt: '2025-12-06' },
    { id: 'P07', label: 'Oct 2025', status: 'locked', closedBy: 'CFO', closedAt: '2025-11-05' },
];

const INITIAL_AUDIT: AuditEntry[] = [
    { timestamp: '2026-02-22 14:32', user: 'admin', action: 'Journal Entry Posted', detail: 'JE-0048 — Monthly rent payment', module: 'GL' },
    { timestamp: '2026-02-21 11:15', user: 'admin', action: 'Invoice Created', detail: 'INV-1048 — Al Futtaim Group', module: 'AR' },
    { timestamp: '2026-02-20 09:45', user: 'system', action: 'FX Revaluation', detail: 'EUR — Unrealized gain 4,200', module: 'FX' },
    { timestamp: '2026-02-19 16:20', user: 'admin', action: 'Period Closed', detail: 'P10 (Jan 2026) closed', module: 'Period' },
    { timestamp: '2026-02-18 10:00', user: 'admin', action: 'Depreciation Run', detail: 'Feb 2026 — AED 14,208 total', module: 'FA' },
    { timestamp: '2026-02-17 13:30', user: 'admin', action: 'Vendor Bill Approved', detail: 'BILL-0082 — Al Ghurair Steel 78,000', module: 'AP' },
    { timestamp: '2026-02-15 08:22', user: 'system', action: 'Recurring JE Posted', detail: 'JE-0046 — AWS subscription', module: 'GL' },
];

// ── UTILS ──────────────────────────────────────────────────────────────────────
function nowTimestamp() {
    const n = new Date();
    return `${n.toISOString().slice(0, 10)} ${n.toTimeString().slice(0, 5)}`;
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function PeriodClosePage() {
    const [tab, setTab] = useState('checklist');
    const [checklist, setChecklist] = useState<ChecklistTask[]>(INITIAL_CHECKLIST);
    const [periods, setPeriods] = useState<PeriodRecord[]>(INITIAL_PERIODS);
    const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT);
    const [closing, setClosing] = useState(false);

    // ── derived ──
    const completedTasks = checklist.filter(t => t.done).length;
    const totalTasks = checklist.length;
    const completionPct = Math.round((completedTasks / totalTasks) * 100);
    const openPeriod = periods.find(p => p.status === 'open');
    const blockingPending = checklist.filter(t => t.blocking && !t.done);
    const canClose = blockingPending.length === 0;

    // ── toggle checklist task ──
    const toggleTask = useCallback((id: number) => {
        setChecklist(prev =>
            prev.map(t => t.id === id ? { ...t, done: !t.done } : t),
        );
        // Optimistic audit entry
        const task = checklist.find(t => t.id === id);
        if (task) {
            setAudit(prev => [{
                timestamp: nowTimestamp(),
                user: 'admin',
                action: task.done ? 'Task Unchecked' : 'Task Completed',
                detail: task.task,
                module: task.category,
            }, ...prev]);
        }
    }, [checklist]);

    // ── close period ──
    const closePeriod = useCallback(async () => {
        if (!openPeriod) return;
        if (!canClose) {
            toast.error(
                `${blockingPending.length} blocking task${blockingPending.length > 1 ? 's' : ''} must be completed first`,
                { description: blockingPending.map(t => t.task).join(', ') },
            );
            return;
        }

        setClosing(true);
        try {
            // Simulate async API call (replace with real endpoint)
            await new Promise(r => setTimeout(r, 1200));

            const closedAt = new Date().toISOString().slice(0, 10);
            setPeriods(prev =>
                prev.map(p =>
                    p.id === openPeriod.id
                        ? { ...p, status: 'closed', closedBy: 'admin', closedAt }
                        : p,
                ),
            );
            setAudit(prev => [{
                timestamp: nowTimestamp(),
                user: 'admin',
                action: 'Period Closed',
                detail: `${openPeriod.id} (${openPeriod.label}) — all checklist items verified`,
                module: 'Period',
            }, ...prev]);
            toast.success(`Period ${openPeriod.id} (${openPeriod.label}) closed successfully`);
        } catch {
            toast.error('Failed to close period — please try again');
        } finally {
            setClosing(false);
        }
    }, [openPeriod, canClose, blockingPending]);

    // ── lock a closed period ──
    const lockPeriod = useCallback(async (id: string) => {
        await new Promise(r => setTimeout(r, 600));
        setPeriods(prev =>
            prev.map(p => p.id === id ? { ...p, status: 'locked' } : p),
        );
        setAudit(prev => [{
            timestamp: nowTimestamp(),
            user: 'admin',
            action: 'Period Locked',
            detail: `${id} permanently locked — no further edits allowed`,
            module: 'Period',
        }, ...prev]);
        toast.success(`Period ${id} locked`);
    }, []);

    return (
        <div className="space-y-6 pb-8">

                {/* Header */}
                <FinancePageHeader
                    title="Period Close & Governance"
                    subtitle="Month-End · Year-End · Audit Logs · Controls"
                    icon={Lock}
                    actions={
                        <>
                            <Badge variant="outline" className="text-[9px]">
                                {completionPct}% complete
                            </Badge>
                            {openPeriod && (
                                <Button
                                    size="sm"
                                    className={cn(
                                        'gap-2 text-xs',
                                        canClose
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-muted text-muted-foreground cursor-not-allowed',
                                    )}
                                    onClick={closePeriod}
                                    disabled={closing}
                                >
                                    <Lock className="h-3.5 w-3.5" />
                                    {closing ? 'Closing…' : `Close ${openPeriod.id}`}
                                </Button>
                            )}
                            {!openPeriod && (
                                <Badge variant="secondary" className="text-[9px]">No open period</Badge>
                            )}
                        </>
                    }
                />

                {/* KPI Strip */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <KpiCard label="Current Period" value={openPeriod ? `${openPeriod.id} · ${openPeriod.label}` : 'None'} />
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                                Checklist Progress
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            completionPct === 100 ? 'bg-emerald-500' : 'bg-red-500',
                                        )}
                                        style={{ width: `${completionPct}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold">{completedTasks}/{totalTasks}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <KpiCard
                        label="Blocking Open"
                        value={String(blockingPending.length)}
                        alert={blockingPending.length > 0}
                        footer={blockingPending.length > 0 ? 'Must complete to close' : undefined}
                    />
                    <KpiCard label="Audit Events" value={String(audit.length)} />
                </div>

                {/* Blocking warning banner */}
                {blockingPending.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                        <div>
                            <p className="text-xs font-bold">Blocking items pending</p>
                            <p className="text-[11px] mt-0.5 text-amber-700">
                                {blockingPending.map(t => t.task).join(' · ')}
                            </p>
                        </div>
                    </div>
                )}

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="checklist" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Month-End Checklist
                        </TabsTrigger>
                        <TabsTrigger value="periods" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Fiscal Periods
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Audit Log
                        </TabsTrigger>
                    </TabsList>

                    {/* ── CHECKLIST ── */}
                    <TabsContent value="checklist" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    {checklist.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => toggleTask(t.id)}
                                            className={cn(
                                                'w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-muted/30 transition-colors',
                                                !t.done && t.blocking && 'bg-red-50/30',
                                                !t.done && !t.blocking && 'bg-amber-50/20',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {t.done
                                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                                }
                                                <div>
                                                    <p className={cn('text-sm', t.done && 'text-muted-foreground line-through')}>
                                                        {t.task}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {t.category} · {t.assignee}
                                                        {t.blocking && (
                                                            <span className="ml-1.5 text-red-600 font-bold">· Blocking</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {!t.done && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-[8px] h-4 px-1',
                                                        t.blocking
                                                            ? 'border-red-200 text-red-600'
                                                            : 'border-amber-200 text-amber-600',
                                                    )}
                                                >
                                                    {t.blocking ? 'Blocking' : 'Pending'}
                                                </Badge>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── PERIODS ── */}
                    <TabsContent value="periods" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Period</span>
                                        <span className="col-span-3">Label</span>
                                        <span className="col-span-2">Status</span>
                                        <span className="col-span-2">Closed By</span>
                                        <span className="col-span-2">Date</span>
                                        <span className="col-span-1 text-right">Action</span>
                                    </div>
                                    {periods.map(p => (
                                        <div key={p.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{p.id}</span>
                                            <span className="col-span-3 text-xs font-medium">{p.label}</span>
                                            <span className="col-span-2">
                                                <Badge
                                                    variant={p.status === 'open' ? 'default' : p.status === 'closed' ? 'secondary' : 'outline'}
                                                    className={cn('text-[8px] h-4 px-1', p.status === 'locked' && 'border-red-300 text-red-600')}
                                                >
                                                    {p.status === 'open' && (
                                                        <span className="h-1 w-1 rounded-full bg-emerald-400 mr-1 animate-pulse inline-block" />
                                                    )}
                                                    {p.status}
                                                </Badge>
                                            </span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{p.closedBy ?? '—'}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{p.closedAt ?? '—'}</span>
                                            <span className="col-span-1 text-right">
                                                {p.status === 'closed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[10px] px-2 gap-1"
                                                        onClick={() => lockPeriod(p.id)}
                                                    >
                                                        <Lock className="h-2.5 w-2.5" /> Lock
                                                    </Button>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── AUDIT LOG ── */}
                    <TabsContent value="audit" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-3">Timestamp</span>
                                        <span className="col-span-1">User</span>
                                        <span className="col-span-3">Action</span>
                                        <span className="col-span-4">Detail</span>
                                        <span className="col-span-1">Module</span>
                                    </div>
                                    {audit.map((l, i) => (
                                        <div key={i} className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-3 text-[10px] text-muted-foreground font-mono">{l.timestamp}</span>
                                            <span className="col-span-1 text-xs">{l.user}</span>
                                            <span className="col-span-3 text-xs font-medium">{l.action}</span>
                                            <span className="col-span-4 text-xs text-muted-foreground truncate">{l.detail}</span>
                                            <span className="col-span-1">
                                                <Badge variant="outline" className="text-[7px] h-4 px-1">{l.module}</Badge>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
    );
}
