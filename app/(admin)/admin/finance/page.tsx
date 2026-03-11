'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { KpiCard } from '@/components/finance/KpiCard';
import { useTenant } from '@/lib/tenant-context';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { getFinanceHubSummary } from '@/lib/api';
import {
    BookOpen, Landmark, TrendingUp, ShoppingCart, Package, Cpu,
    Scale, Building2, BarChart3, Globe, Lock,
    DollarSign, ChevronRight,
    ShieldCheck,
} from 'lucide-react';

// ── KPI DEFAULTS (populated from backend on mount) ─────────────────────────────
const KPI_DEFAULTS = {
    revenue: 0, expenses: 0, netIncome: 0,
    cashPosition: 0, receivables: 0, payables: 0,
    taxLiability: 0, openInvoices: 0, overdueBills: 0,
    pendingApprovals: 0, periodStatus: 'Open' as const,
    currentPeriod: 'Current Period',
};

interface FinanceModule {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    href: string;
    /** Populated by API summary — shown below the description */
    stats: { label: string; value: string }[];
    alert?: boolean;
}

/** Module catalogue — stats are hydrated from getFinanceHubSummary() */
const MODULES_BASE: Omit<FinanceModule, 'stats'>[] = [
    {
        key: 'ledger', label: 'General Ledger', icon: BookOpen,
        desc: 'Chart of Accounts · Journals · Trial Balance · Period Close',
        href: '/admin/finance/ledger',
    },
    {
        key: 'treasury', label: 'Bank & Treasury', icon: Landmark,
        desc: 'Cash Management · Reconciliation · FX · Cash Forecast',
        href: '/admin/finance/banking',
    },
    {
        key: 'receivables', label: 'Accounts Receivable', icon: TrendingUp,
        desc: 'Customer Ledger · Aging · Credit Notes · Revenue Recognition',
        href: '/admin/finance/receivables',
    },
    {
        key: 'payables', label: 'Accounts Payable', icon: ShoppingCart,
        desc: 'Vendor Ledger · Bill Posting · Approvals · Payment Runs',
        href: '/admin/finance/payables',
    },
    {
        key: 'inventory', label: 'Inventory Accounting', icon: Package,
        desc: 'Valuation · COGS · Stock Adjustments · Write-offs',
        href: '/admin/finance/inventory',
    },
    {
        key: 'assets', label: 'Fixed Assets', icon: Cpu,
        desc: 'Asset Register · Depreciation · Disposal · Impairment',
        href: '/admin/finance/assets',
    },
    {
        key: 'tax', label: 'Tax Management', icon: Scale,
        desc: 'Tax Codes · VAT/GST · Returns · Filing · Audit',
        href: '/admin/finance/taxes',
    },
    {
        key: 'intercompany', label: 'Intercompany', icon: Building2,
        desc: 'IC AR/AP · Mirror Journals · Elimination · Consolidation',
        href: '/admin/finance/intercompany',
    },
    {
        key: 'reports', label: 'Financial Reporting', icon: BarChart3,
        desc: 'Balance Sheet · P&L · Cash Flow · Budget vs Actual',
        href: '/admin/finance/reports',
    },
    {
        key: 'multicurrency', label: 'Multi-Currency', icon: Globe,
        desc: 'FX Rates · Revaluation · Currency Exposure · Translation',
        href: '/admin/finance/multi-currency',
    },
    {
        key: 'periodclose', label: 'Period Close & Governance', icon: Lock,
        desc: 'Month-End · Year-End · Audit Logs · Control Checklists',
        href: '/admin/finance/period-close',
    },
    {
        key: 'approvals', label: 'Approval Engine', icon: ShieldCheck,
        desc: 'Document Workflows · Conditional Logic · SoD · Escalation',
        href: '/admin/finance/approvals',
    },
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function FinancePage() {
    const { getModuleLabel } = useTenant();
    const { format: fmt, currencyCode } = useCurrency();
    const [kpi, setKpi] = useState(KPI_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<FinanceModule[]>(
        MODULES_BASE.map(m => ({ ...m, stats: [] })),
    );

    useEffect(() => {
        let cancelled = false;

        getFinanceHubSummary()
            .then(data => {
                if (cancelled) return;
                setKpi(prev => ({ ...prev, ...data }));

                // Hydrate per-module stat chips from the summary payload when available
                setModules(MODULES_BASE.map(m => {
                    const stats: { label: string; value: string }[] = [];
                    if (m.key === 'receivables' && data.receivables != null)
                        stats.push({ label: 'Balance', value: fmt(data.receivables, { compact: true }) });
                    if (m.key === 'payables' && data.payables != null)
                        stats.push({ label: 'Balance', value: fmt(data.payables, { compact: true }) });
                    if (m.key === 'treasury' && data.cashPosition != null)
                        stats.push({ label: 'Cash', value: fmt(data.cashPosition, { compact: true }) });
                    if (m.key === 'tax' && data.taxLiability != null)
                        stats.push({ label: 'Liability', value: fmt(data.taxLiability, { compact: true }) });
                    if (m.key === 'payables' && data.overdueBills != null && data.overdueBills > 0)
                        return { ...m, stats, alert: true };
                    if (m.key === 'approvals' && data.pendingApprovals != null && data.pendingApprovals > 0)
                        stats.push({ label: 'Pending', value: String(data.pendingApprovals) });
                    return { ...m, stats };
                }));

                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ModuleGuard module="finance">
                <div className="space-y-8 pb-8">

                    {/* ── Hub Header ─ */}
                    <div className="flex items-center justify-between border-b border-border pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight uppercase leading-none">
                                    {getModuleLabel('finance')}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Strategic Ops Center</span>
                                    <span className="text-muted-foreground/30">·</span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                                        <span className="font-mono text-red-600/80">{currencyCode}</span>
                                        <span className="text-slate-400">{kpi.currentPeriod}</span>
                                        <Badge
                                            variant="outline"
                                            className="h-4 text-[8px] px-1.5 border-emerald-300 text-emerald-600 font-black uppercase"
                                        >
                                            {kpi.periodStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Executive KPI Strip ─ */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        <KpiCard label="Revenue YTD" value={fmt(kpi.revenue, { compact: true })} loading={loading} />
                        <KpiCard label="Expenses YTD" value={fmt(kpi.expenses, { compact: true })} loading={loading} />
                        <KpiCard label="Net Income" value={fmt(kpi.netIncome, { compact: true })} loading={loading} />
                        <KpiCard label="Cash Position" value={fmt(kpi.cashPosition, { compact: true })} loading={loading} />
                        <KpiCard label="Receivables" value={fmt(kpi.receivables, { compact: true })} loading={loading} />
                        <KpiCard
                            label="Payables"
                            value={fmt(kpi.payables, { compact: true })}
                            loading={loading}
                            alert={kpi.overdueBills > 0}
                            footer={kpi.overdueBills > 0 ? `${kpi.overdueBills} overdue bills` : undefined}
                        />
                    </div>

                    {/* ── Module Grid ─ */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            Finance Modules
                        </p>
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {modules.map(m => (
                                <ModuleCard key={m.key} module={m} />
                            ))}
                        </div>
                    </div>

                </div>
            </ModuleGuard>
    );
}

// ── Module Card ────────────────────────────────────────────────────────────────
function ModuleCard({ module: m }: { module: FinanceModule }) {
    return (
        <Link href={m.href}>
            <Card
                className={cn(
                    'border-border shadow-sm hover:border-red-200 hover:shadow-md transition-all cursor-pointer group h-full',
                    m.alert && 'border-red-200',
                )}
            >
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <m.icon className="h-4 w-4" />
                        </div>
                        {m.alert && (
                            <Badge variant="destructive" className="text-[8px] h-4 px-1.5">
                                Action
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm font-bold mb-0.5">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{m.desc}</p>

                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                        {m.stats.map((s, i) => (
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
    );
}
