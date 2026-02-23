'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { getFinanceHubSummary } from '@/lib/api';
import {
    BookOpen, Landmark, Users, ShoppingCart, Package, Cpu,
    Scale, Building2, BarChart3, Globe, Lock, DollarSign,
    ChevronRight, ArrowUpRight, ArrowDownRight, TrendingUp,
    AlertTriangle, Clock, CheckCircle2, ShieldCheck
} from 'lucide-react';

// ── KPI DEFAULTS (populated from backend on mount) ───────────────────────────
const KPI_DEFAULTS = {
    revenue: 0, expenses: 0, netIncome: 0,
    cashPosition: 0, receivables: 0, payables: 0,
    taxLiability: 0, openInvoices: 0, overdueBills: 0,
    pendingApprovals: 0, periodStatus: 'Open' as const,
    currentPeriod: 'Current Period',
};

interface FinanceModule {
    key: string; label: string; icon: React.ComponentType<{ className?: string }>;
    desc: string; href: string; stats: { label: string; value: string }[];
    alert?: boolean;
}

const MODULES: FinanceModule[] = [
    {
        key: 'ledger', label: 'General Ledger', icon: BookOpen,
        desc: 'Chart of Accounts · Journals · Trial Balance · Period Close',
        href: '/admin/finance/ledger',
        stats: [],
    },
    {
        key: 'treasury', label: 'Bank & Treasury', icon: Landmark,
        desc: 'Cash Management · Reconciliation · FX · Cash Forecast',
        href: '/admin/finance/banking',
        stats: [],
    },
    {
        key: 'receivables', label: 'Accounts Receivable', icon: TrendingUp,
        desc: 'Customer Ledger · Aging · Credit Notes · Revenue Recognition',
        href: '/admin/finance/receivables',
        stats: [],
    },
    {
        key: 'payables', label: 'Accounts Payable', icon: ShoppingCart,
        desc: 'Vendor Ledger · Bill Posting · Approvals · Payment Runs',
        href: '/admin/finance/payables',
        stats: [],
    },
    {
        key: 'inventory', label: 'Inventory Accounting', icon: Package,
        desc: 'Valuation · COGS · Stock Adjustments · Write-offs',
        href: '/admin/finance/inventory',
        stats: [],
    },
    {
        key: 'assets', label: 'Fixed Assets', icon: Cpu,
        desc: 'Asset Register · Depreciation · Disposal · Impairment',
        href: '/admin/finance/assets',
        stats: [],
    },
    {
        key: 'tax', label: 'Tax Management', icon: Scale,
        desc: 'Tax Codes · VAT/GST · Returns · Filing · Audit',
        href: '/admin/finance/taxes',
        stats: [],
    },
    {
        key: 'intercompany', label: 'Intercompany', icon: Building2,
        desc: 'IC AR/AP · Mirror Journals · Elimination · Consolidation',
        href: '/admin/finance/intercompany',
        stats: [],
    },
    {
        key: 'reports', label: 'Financial Reporting', icon: BarChart3,
        desc: 'Balance Sheet · P&L · Cash Flow · Budget vs Actual',
        href: '/admin/finance/reports',
        stats: [],
    },
    {
        key: 'multicurrency', label: 'Multi-Currency', icon: Globe,
        desc: 'FX Rates · Revaluation · Currency Exposure · Translation',
        href: '/admin/finance/multi-currency',
        stats: [],
    },
    {
        key: 'periodclose', label: 'Period Close & Governance', icon: Lock,
        desc: 'Month-End · Year-End · Audit Logs · Control Checklists',
        href: '/admin/finance/period-close',
        stats: [],
    },
    {
        key: 'approvals', label: 'Approval Engine', icon: ShieldCheck,
        desc: 'Document Workflows · Conditional Logic · SoD · Escalation',
        href: '/admin/finance/approvals',
        stats: [],
    },
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function FinancePage() {
    const { getModuleLabel } = useTenant();
    const { format: fmt, currencyCode } = useCurrency();
    const [kpi, setKpi] = useState(KPI_DEFAULTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getFinanceHubSummary().then(data => {
            if (!cancelled) {
                setKpi(prev => ({ ...prev, ...data }));
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="finance">
                <div className="space-y-8 pb-8">
                    {/* ── Hub Header ─ */}
                    <div className="flex items-center justify-between border-b border-border pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">{getModuleLabel('finance')}</h1>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-red-600">{currencyCode}</span>
                                    <span>·</span>
                                    <span>{kpi.currentPeriod}</span>
                                    <span>·</span>
                                    <Badge variant="outline" className="h-4 text-[8px] px-1.5 border-emerald-300 text-emerald-600">{kpi.periodStatus}</Badge>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Executive KPI Strip ─ */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        <MiniKpi label="Revenue YTD" value={fmt(kpi.revenue, { compact: true })} loading={loading} />
                        <MiniKpi label="Expenses YTD" value={fmt(kpi.expenses, { compact: true })} loading={loading} />
                        <MiniKpi label="Net Income" value={fmt(kpi.netIncome, { compact: true })} loading={loading} />
                        <MiniKpi label="Cash Position" value={fmt(kpi.cashPosition, { compact: true })} loading={loading} />
                        <MiniKpi label="Receivables" value={fmt(kpi.receivables, { compact: true })} loading={loading} />
                        <MiniKpi label="Payables" value={fmt(kpi.payables, { compact: true })} loading={loading} />
                    </div>

                    {/* ── Module Grid ─ */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Finance Modules</p>
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {MODULES.map(m => (
                                <Link key={m.key} href={m.href}>
                                    <Card className="border-border shadow-sm hover:border-red-200 hover:shadow-md transition-all cursor-pointer group h-full">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                                    <m.icon className="h-4 w-4" />
                                                </div>
                                                {m.alert && (
                                                    <Badge variant="destructive" className="text-[8px] h-4 px-1.5">Action</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold mb-0.5">{m.label}</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
                                            <div className="flex items-center gap-4 pt-2 border-t border-border">
                                                {m.stats.length > 0 && m.stats.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-muted-foreground">{s.label}</span>
                                                        <span className="text-xs font-bold">{s.value}</span>
                                                    </div>
                                                ))}
                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:text-red-600 transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────
function MiniKpi({ label, value, delta, positive, alert: hasAlert, loading }: {
    label: string; value: string; delta?: string; positive?: boolean; alert?: boolean; loading?: boolean;
}) {
    return (
        <Card className={cn("border-border shadow-sm", hasAlert && "border-red-200")}>
            <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
                {loading ? <div className="h-7 w-20 bg-muted rounded animate-pulse" /> : <p className="text-lg font-bold tracking-tight">{value}</p>}
                {delta && (
                    <p className={cn("text-[10px] font-medium flex items-center gap-0.5 mt-0.5",
                        positive ? "text-emerald-600" : "text-red-600")}>
                        {positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                        {delta}
                    </p>
                )}
                {hasAlert && (
                    <p className="text-[10px] text-red-600 font-medium flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> Overdue items
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
