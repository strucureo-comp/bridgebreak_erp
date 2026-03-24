'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { KpiCard } from '@/components/finance/KpiCard';
import { useTenant } from '@/lib/tenant-context';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { getFinanceHubSummary } from '@/lib/api';
import {
    BookOpen, Landmark, TrendingUp, ShoppingCart, Package, Cpu,
    Scale, Building2, BarChart3, Globe, Lock,
    ShieldCheck,
    CreditCard,
    Receipt,
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
        href: '/admin/purchases/bills',
    },
    {
        key: 'inventory', label: 'Inventory Accounting', icon: Package,
        desc: 'Valuation · COGS · Stock Adjustments · Write-offs',
        href: '/admin/inventory',
    },
    {
        key: 'assets', label: 'Fixed Assets', icon: Cpu,
        desc: 'Asset Register · Depreciation · Disposal · Impairment',
        href: '/admin/finance/assets',
    },
    {
        key: 'tax', label: 'Tax Management', icon: Scale,
        desc: 'Tax Codes · VAT/GST · Returns · Filing · Audit',
        href: '/admin/settings/taxes',
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
        href: '/admin/settings/currency',
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
    {
        key: 'paymentvouchers', label: 'Payment Vouchers', icon: CreditCard,
        desc: 'Outgoing Payment Vouchers · Posting · Tracking',
        href: '/admin/finance/payment-vouchers',
    },
    {
        key: 'receiptvouchers', label: 'Receipt Vouchers', icon: Receipt,
        desc: 'Incoming Receipt Vouchers · Posting · Tracking',
        href: '/admin/finance/receipt-vouchers',
    },
    {
        key: 'financialaudit', label: 'Financial Audit Report', icon: BarChart3,
        desc: 'Audit Health · Anomalies · Ledger Integrity',
        href: '/admin/reports/audit',
    },
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function FinancePage() {
    const { getModuleLabel } = useTenant();
    const { baseCurrency } = useCompanySettings();
    const fmt = (amount: number, options?: { compact?: boolean }) => formatCurrency(amount, baseCurrency, options);
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
    }, [baseCurrency]);

    return (
        <ModuleGuard module="finance">
            <div className="space-y-6 max-w-7xl">
                <div>
                    <h1 className="text-2xl font-semibold">{getModuleLabel('finance')}</h1>
                    <p className="text-muted-foreground">
                        Manage your accounting, ledgers, tax, assets, and treasury operations.
                    </p>
                </div>

                {/* ── Executive KPI Strip ─ */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Finance Components Board</CardTitle>
                        <CardDescription>
                            Access each finance domain including ledgers, treasury, receivables, payables, tax, and reporting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {modules.map(m => (
                                <ModuleCard key={m.key} module={m} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ModuleGuard>
    );
}

// ── Module Card ────────────────────────────────────────────────────────────────
function ModuleCard({ module: m }: { module: FinanceModule }) {
    return (
        <Link href={m.href} className="block h-full">
            <Card
                className={cn(
                    'h-full transition-colors hover:bg-muted/50 cursor-pointer',
                    m.alert && 'border-red-500/50 dark:border-red-500/30',
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex flex-row justify-between items-start mb-2">
                        <m.icon className="h-5 w-5 text-muted-foreground" />
                        {m.alert && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                Action Required
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-base font-semibold">{m.label}</CardTitle>
                    <CardDescription className="text-xs">{m.desc}</CardDescription>
                </CardHeader>
                {m.stats.length > 0 && (
                    <CardContent>
                        <div className="flex flex-col gap-2 pt-1">
                            {m.stats.map((s, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{s.label}</span>
                                    <span className="font-medium">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>
        </Link>
    );
}
