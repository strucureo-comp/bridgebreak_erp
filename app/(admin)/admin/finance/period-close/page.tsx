'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Lock, ChevronLeft, CheckCircle2, Circle, Clock,
    AlertTriangle, ShieldCheck, FileText, RotateCcw
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PERIODS = [
    { id: 'P11', label: 'Feb 2026', status: 'open', closedBy: null, closedAt: null },
    { id: 'P10', label: 'Jan 2026', status: 'closed', closedBy: 'CFO', closedAt: '2026-02-05' },
    { id: 'P09', label: 'Dec 2025', status: 'closed', closedBy: 'CFO', closedAt: '2026-01-08' },
    { id: 'P08', label: 'Nov 2025', status: 'locked', closedBy: 'CFO', closedAt: '2025-12-06' },
    { id: 'P07', label: 'Oct 2025', status: 'locked', closedBy: 'CFO', closedAt: '2025-11-05' },
];

const MONTH_END_CHECKLIST = [
    { id: 1, task: 'Bank reconciliation completed', category: 'Treasury', done: true, assignee: 'Treasury' },
    { id: 2, task: 'AR aging reviewed — overdue items addressed', category: 'AR', done: true, assignee: 'AR Team' },
    { id: 3, task: 'AP aging reviewed — payment schedule confirmed', category: 'AP', done: true, assignee: 'AP Team' },
    { id: 4, task: 'Accruals posted (payroll, rent, utilities)', category: 'GL', done: false, assignee: 'Controller' },
    { id: 5, task: 'Depreciation run executed', category: 'FA', done: false, assignee: 'Controller' },
    { id: 6, task: 'FX revaluation processed', category: 'FX', done: true, assignee: 'Treasury' },
    { id: 7, task: 'Tax accrual calculated & posted', category: 'Tax', done: false, assignee: 'Tax Manager' },
    { id: 8, task: 'Intercompany reconciliation balanced', category: 'IC', done: true, assignee: 'Group Finance' },
    { id: 9, task: 'Inventory valuation validated', category: 'Inventory', done: true, assignee: 'Warehouse' },
    { id: 10, task: 'Revenue recognition reviewed', category: 'Revenue', done: false, assignee: 'Controller' },
    { id: 11, task: 'Trial balance balanced (Dr = Cr)', category: 'GL', done: true, assignee: 'Controller' },
    { id: 12, task: 'Management review & sign-off', category: 'Governance', done: false, assignee: 'CFO' },
];

const AUDIT_LOG = [
    { timestamp: '2026-02-22 14:32', user: 'admin', action: 'Journal Entry Posted', detail: 'JE-0048 — Monthly rent payment', module: 'GL' },
    { timestamp: '2026-02-21 11:15', user: 'admin', action: 'Invoice Created', detail: 'INV-1048 — Al Futtaim Group', module: 'AR' },
    { timestamp: '2026-02-20 09:45', user: 'system', action: 'FX Revaluation', detail: 'EUR — Unrealized gain 4,200', module: 'FX' },
    { timestamp: '2026-02-19 16:20', user: 'admin', action: 'Period Closed', detail: 'P10 (Jan 2026) closed', module: 'Period' },
    { timestamp: '2026-02-18 10:00', user: 'admin', action: 'Depreciation Run', detail: 'Feb 2026 — 14,208 total', module: 'FA' },
    { timestamp: '2026-02-17 13:30', user: 'admin', action: 'Vendor Bill Approved', detail: 'BILL-0082 — Al Ghurair Steel 78,000', module: 'AP' },
    { timestamp: '2026-02-15 08:22', user: 'system', action: 'Recurring JE Posted', detail: 'JE-0046 — AWS subscription', module: 'GL' },
];

export default function PeriodClosePage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('checklist');
    const completedTasks = MONTH_END_CHECKLIST.filter(t => t.done).length;
    const totalTasks = MONTH_END_CHECKLIST.length;
    const completionPct = Math.round((completedTasks / totalTasks) * 100);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Lock className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Period Close & Governance</h1>
                            <p className="text-[11px] text-muted-foreground">Month-End · Year-End · Audit Logs · Controls</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px]">{completionPct}% complete</Badge>
                        <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={() => toast.info('Complete all checklist items before closing')}><Lock className="h-3.5 w-3.5" /> Close Period</Button>
                    </div>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Current Period</p>
                            <p className="text-lg font-bold tracking-tight">P11 · Feb 2026</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Checklist Progress</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", completionPct === 100 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${completionPct}%` }} />
                                </div>
                                <span className="text-sm font-bold">{completedTasks}/{totalTasks}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Open Items</p>
                            <p className={cn("text-lg font-bold tracking-tight", (totalTasks - completedTasks) > 0 && "text-red-600")}>{totalTasks - completedTasks}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Audit Events</p>
                            <p className="text-lg font-bold tracking-tight">{AUDIT_LOG.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="checklist" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Month-End Checklist</TabsTrigger>
                        <TabsTrigger value="periods" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Fiscal Periods</TabsTrigger>
                        <TabsTrigger value="audit" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Audit Log</TabsTrigger>
                    </TabsList>

                    <TabsContent value="checklist" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    {MONTH_END_CHECKLIST.map(t => (
                                        <div key={t.id} className={cn("flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors", !t.done && "bg-red-50/30")}>
                                            <div className="flex items-center gap-3">
                                                {t.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                                                <div>
                                                    <p className={cn("text-sm", t.done && "text-muted-foreground line-through")}>{t.task}</p>
                                                    <p className="text-[10px] text-muted-foreground">{t.category} · {t.assignee}</p>
                                                </div>
                                            </div>
                                            {!t.done && <Badge variant="outline" className="text-[8px] h-4 px-1 border-red-200 text-red-600">Pending</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="periods" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Period</span><span className="col-span-3">Label</span>
                                        <span className="col-span-2">Status</span><span className="col-span-2">Closed By</span><span className="col-span-3 text-right">Date</span>
                                    </div>
                                    {PERIODS.map(p => (
                                        <div key={p.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 font-mono text-xs text-red-600">{p.id}</span>
                                            <span className="col-span-3 text-xs font-medium">{p.label}</span>
                                            <span className="col-span-2">
                                                <Badge variant={p.status === 'open' ? 'default' : p.status === 'closed' ? 'secondary' : 'outline'} className="text-[8px] h-4 px-1">
                                                    {p.status === 'open' && <span className="h-1 w-1 rounded-full bg-emerald-400 mr-1 animate-pulse" />}
                                                    {p.status}
                                                </Badge>
                                            </span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{p.closedBy ?? '—'}</span>
                                            <span className="col-span-3 text-right text-xs text-muted-foreground">{p.closedAt ?? '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audit" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Timestamp</span><span className="col-span-1">User</span>
                                        <span className="col-span-2">Action</span><span className="col-span-4">Detail</span>
                                        <span className="col-span-1">Module</span><span className="col-span-2"></span>
                                    </div>
                                    {AUDIT_LOG.map((l, i) => (
                                        <div key={i} className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{l.timestamp}</span>
                                            <span className="col-span-1 text-xs">{l.user}</span>
                                            <span className="col-span-2 text-xs font-medium">{l.action}</span>
                                            <span className="col-span-4 text-xs text-muted-foreground truncate">{l.detail}</span>
                                            <span className="col-span-1"><Badge variant="outline" className="text-[7px] h-4 px-1">{l.module}</Badge></span>
                                            <span className="col-span-2"></span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}
