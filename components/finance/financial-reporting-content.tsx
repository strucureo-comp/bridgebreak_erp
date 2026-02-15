'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getFinancialReport } from '@/lib/api';
import { toast } from 'sonner';
import {
    Download, Printer, Scale, Loader2, BookOpen,
    TrendingUp, TrendingDown, ChevronDown, ChevronRight,
    ArrowUpRight, ArrowDownRight, Banknote, BarChart3,
    Wallet, Building2, FileText, DollarSign
} from 'lucide-react';

/* ─── Types ─── */
interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    balance: number | string;
    parent_id?: string;
}

interface PnLData {
    revenue: Account[];
    expenses: Account[];
    net_income: number;
}

interface BSData {
    assets: Account[];
    liabilities: Account[];
    equity: Account[];
}

interface TItem {
    label: string;
    amount: number;
    isBold?: boolean;
    isItalic?: boolean;
    isGroupHeader?: boolean;
    indent?: number;
    subItems?: TItem[];
}

/* ─── Helpers ─── */

function fmt(n: number): string {
    if (n === 0) return '—';
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return n < 0 ? `(${formatted})` : formatted;
}

function fmtCurrency(n: number): string {
    if (n === 0) return '—';
    return `$${fmt(n)}`;
}

function sumAccounts(accounts: Account[]): number {
    return accounts.reduce((s, a) => s + Number(a.balance), 0);
}

/* ─── P&L Categorization ─── */
function categorizeForPnL(pnlData: PnLData) {
    const revenue = pnlData.revenue || [];
    const expenses = pnlData.expenses || [];

    // COGS / Direct expenses (51xx codes)
    const cogsItems = expenses.filter(a => a.code.startsWith('51'));
    // Operating / Indirect expenses (52xx+ codes)
    const opExpItems = expenses.filter(a => !a.code.startsWith('51'));

    // Sales revenue (41xx) vs Other income
    const salesItems = revenue.filter(a => a.code.startsWith('41'));
    const otherIncome = revenue.filter(a => !a.code.startsWith('41'));

    const totalSales = sumAccounts(salesItems);
    const totalCOGS = sumAccounts(cogsItems);
    const totalOpEx = sumAccounts(opExpItems);
    const totalOtherIncome = sumAccounts(otherIncome);

    const grossProfit = totalSales - totalCOGS;

    // P&L section: Cr natural = GP (if positive) + Other Income
    // Dr natural = Gross Loss (if negative) + OpEx
    const pnlCrNatural = (grossProfit > 0 ? grossProfit : 0) + totalOtherIncome;
    const pnlDrNatural = (grossProfit < 0 ? Math.abs(grossProfit) : 0) + totalOpEx;
    const netProfit = pnlCrNatural - pnlDrNatural;

    return {
        salesItems, cogsItems, opExpItems, otherIncome,
        totalSales, totalCOGS, totalOpEx, totalOtherIncome,
        grossProfit, netProfit
    };
}

/* ─── BS Categorization ─── */
function categorizeForBS(bsData: BSData) {
    const assets = bsData.assets || [];
    const liabilities = bsData.liabilities || [];
    const equity = bsData.equity || [];

    // Use API's is_leaf flag, fallback to code-based detection for backwards compatibility
    const isLeaf = (a: Account & { is_leaf?: boolean }) => {
        if (typeof a.is_leaf === 'boolean') return a.is_leaf;
        // Fallback: header accounts never carry balances
        return !['1000', '1100', '2000', '3000', '4000', '5000', '5200'].includes(a.code);
    };

    const fixedAssets = assets.filter(a => a.code.startsWith('12') && isLeaf(a));
    const currentAssets = assets.filter(a => a.code.startsWith('11') && isLeaf(a));
    const otherAssets = assets.filter(a => isLeaf(a) && !a.code.startsWith('11') && !a.code.startsWith('12'));

    const currentLiab = liabilities.filter(a => a.code.startsWith('21') && isLeaf(a));
    const nonCurrentLiab = liabilities.filter(a => a.code.startsWith('22') && isLeaf(a));
    const otherLiab = liabilities.filter(a => isLeaf(a) && !a.code.startsWith('21') && !a.code.startsWith('22'));

    const equityLeaf = equity.filter(isLeaf);

    const totalFixedAssets = sumAccounts(fixedAssets);
    const totalCurrentAssets = sumAccounts(currentAssets);
    const totalOtherAssets = sumAccounts(otherAssets);
    const totalAssets = totalFixedAssets + totalCurrentAssets + totalOtherAssets;

    const totalCurrentLiab = sumAccounts(currentLiab);
    const totalNonCurrentLiab = sumAccounts(nonCurrentLiab);
    const totalOtherLiab = sumAccounts(otherLiab);
    const totalLiabilities = totalCurrentLiab + totalNonCurrentLiab + totalOtherLiab;

    const totalEquity = sumAccounts(equityLeaf);

    return {
        fixedAssets, currentAssets, otherAssets,
        currentLiab, nonCurrentLiab, otherLiab,
        equityLeaf,
        totalFixedAssets, totalCurrentAssets, totalOtherAssets, totalAssets,
        totalCurrentLiab, totalNonCurrentLiab, totalOtherLiab, totalLiabilities,
        totalEquity
    };
}

/* ─── Reusable T-Account Table ─── */
function TAccountTable({
    title, subtitle,
    drItems, crItems,
    drTotal, crTotal,
    drLabel = 'Dr', crLabel = 'Cr',
    drColHeader = 'Particulars', crColHeader = 'Particulars',
    amtHeader = 'Amount ($)',
}: {
    title: string;
    subtitle: string;
    drItems: TItem[];
    crItems: TItem[];
    drTotal: number;
    crTotal: number;
    drLabel?: string;
    crLabel?: string;
    drColHeader?: string;
    crColHeader?: string;
    amtHeader?: string;
}) {
    const maxRows = Math.max(drItems.length, crItems.length);
    const paddedDr = [...drItems, ...Array(Math.max(0, maxRows - drItems.length)).fill(null)];
    const paddedCr = [...crItems, ...Array(Math.max(0, maxRows - crItems.length)).fill(null)];

    return (
        <Card className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {/* Title */}
            <div className="bg-slate-900 text-white px-8 py-5 text-center">
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>
            </div>

            {/* Dr / Cr Labels */}
            <div className="flex justify-between px-8 py-2 bg-slate-50 border-b border-border/40">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{drLabel}</span>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{crLabel}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-300 bg-slate-50/60">
                            <th className="px-6 py-3 text-left font-bold text-slate-700 w-[35%]">{drColHeader}</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-700 w-[15%]">{amtHeader}</th>
                            <th className="px-6 py-3 text-left font-bold text-slate-700 w-[35%] border-l-2 border-slate-300">{crColHeader}</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-700 w-[15%]">{amtHeader}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paddedDr.map((dr: TItem | null, i: number) => {
                            const cr = paddedCr[i] as TItem | null;
                            return (
                                <tr key={i} className="border-b border-border/20 hover:bg-slate-50/50 transition-colors">
                                    <td className={cn(
                                        "px-6 py-2.5",
                                        dr?.isBold && "font-bold text-slate-900",
                                        dr?.isItalic && "italic text-slate-500",
                                        dr?.isGroupHeader && "font-bold text-slate-800 bg-slate-50/80 text-[13px]",
                                        !dr?.isBold && !dr?.isGroupHeader && "text-slate-600",
                                    )} style={dr?.indent ? { paddingLeft: `${24 + (dr.indent * 16)}px` } : {}}>
                                        {dr?.label || ''}
                                    </td>
                                    <td className={cn(
                                        "px-4 py-2.5 text-right font-mono tabular-nums",
                                        dr?.isBold ? "font-bold text-slate-900" : "text-slate-600",
                                        dr?.isGroupHeader && "font-bold"
                                    )}>
                                        {dr && dr.amount !== 0 ? fmt(dr.amount) : ''}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-2.5 border-l-2 border-slate-200",
                                        cr?.isBold && "font-bold text-slate-900",
                                        cr?.isItalic && "italic text-slate-500",
                                        cr?.isGroupHeader && "font-bold text-slate-800 bg-slate-50/80 text-[13px]",
                                        !cr?.isBold && !cr?.isGroupHeader && "text-slate-600",
                                    )} style={cr?.indent ? { paddingLeft: `${24 + (cr.indent * 16)}px` } : {}}>
                                        {cr?.label || ''}
                                    </td>
                                    <td className={cn(
                                        "px-4 py-2.5 text-right font-mono tabular-nums",
                                        cr?.isBold ? "font-bold text-slate-900" : "text-slate-600",
                                        cr?.isGroupHeader && "font-bold"
                                    )}>
                                        {cr && cr.amount !== 0 ? fmt(cr.amount) : ''}
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Total Row */}
                        <tr className="border-t-[3px] border-double border-slate-400 bg-slate-100/80">
                            <td className="px-6 py-3 text-sm font-black text-slate-900 uppercase tracking-wider"></td>
                            <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-[15px]">{fmt(drTotal)}</td>
                            <td className="px-6 py-3 text-sm font-black text-slate-900 uppercase tracking-wider border-l-2 border-slate-300"></td>
                            <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-[15px]">{fmt(crTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

/* ─── Loading ─── */
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-bold text-slate-500">Generating reports...</p>
        </div>
    );
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, icon: Icon, trend }: {
    label: string; value: number; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <Card className="rounded-2xl border-border/40 shadow-sm p-5">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    trend === 'up' ? "bg-emerald-50 text-emerald-600" :
                        trend === 'down' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className={cn(
                        "text-xl font-black tabular-nums",
                        value >= 0 ? "text-slate-900" : "text-rose-600"
                    )}>
                        ${fmt(value)}
                    </p>
                </div>
            </div>
        </Card>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function FinancialReportingContent() {
    const [pnlData, setPnlData] = useState<PnLData | null>(null);
    const [bsData, setBsData] = useState<BSData | null>(null);
    const [tbData, setTbData] = useState<Account[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /* ── Fetch ── */
    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            try {
                const [pnl, bs, tb] = await Promise.allSettled([
                    getFinancialReport('pnl'),
                    getFinancialReport('bs'),
                    getFinancialReport('tb')
                ]);
                if (pnl.status === 'fulfilled') setPnlData(pnl.value as PnLData);
                if (bs.status === 'fulfilled') setBsData(bs.value as BSData);
                if (tb.status === 'fulfilled') {
                    // New API returns { accounts: [...], total_debit, total_credit }
                    const tbResult = tb.value;
                    setTbData(Array.isArray(tbResult) ? tbResult : (tbResult as any)?.accounts || []);
                }
            } catch (err) {
                toast.error('Failed to load financial reports');
            } finally {
                setIsLoading(false);
            }
        };
        loadAll();
    }, []);

    /* ── Computed Data ── */
    const pnl = useMemo(() => pnlData ? categorizeForPnL(pnlData) : null, [pnlData]);
    const bs = useMemo(() => bsData ? categorizeForBS(bsData) : null, [bsData]);

    /* ── Build T-Account items for Trading Account ── */
    const tradingData = useMemo(() => {
        if (!pnl) return null;

        const drItems: TItem[] = [
            ...pnl.cogsItems.map(a => ({ label: `To ${a.name}`, amount: Number(a.balance) })),
        ];
        const crItems: TItem[] = [
            ...pnl.salesItems.map(a => ({ label: `By ${a.name}`, amount: Number(a.balance) })),
        ];

        // Balance with Gross Profit / Gross Loss
        if (pnl.grossProfit > 0) {
            drItems.push({ label: 'To Gross Profit c/d', amount: pnl.grossProfit, isBold: true });
        } else if (pnl.grossProfit < 0) {
            crItems.push({ label: 'By Gross Loss c/d', amount: Math.abs(pnl.grossProfit), isBold: true });
        }

        // Both sides must total the same
        const total = Math.max(pnl.totalSales, pnl.totalCOGS + (pnl.grossProfit > 0 ? pnl.grossProfit : 0));

        return { drItems, crItems, total };
    }, [pnl]);

    /* ── Build T-Account items for P&L Account ── */
    const pnlAccountData = useMemo(() => {
        if (!pnl) return null;

        const drItems: TItem[] = [];
        const crItems: TItem[] = [];

        // Dr side: Gross Loss (if any) + Operating Expenses + Net Profit (if any)
        if (pnl.grossProfit < 0) {
            drItems.push({ label: 'To Gross Loss b/d', amount: Math.abs(pnl.grossProfit), isBold: true });
        }
        pnl.opExpItems.forEach(a => {
            drItems.push({ label: `To ${a.name}`, amount: Number(a.balance) });
        });

        // Cr side: Gross Profit (if any) + Other Income + Net Loss (if any)
        if (pnl.grossProfit > 0) {
            crItems.push({ label: 'By Gross Profit b/d', amount: pnl.grossProfit, isBold: true });
        }
        pnl.otherIncome.forEach(a => {
            crItems.push({ label: `By ${a.name}`, amount: Number(a.balance) });
        });

        // Balance: Net Profit on Dr side, Net Loss on Cr side
        if (pnl.netProfit > 0) {
            drItems.push({ label: 'To Net Profit', amount: pnl.netProfit, isBold: true });
        } else if (pnl.netProfit < 0) {
            crItems.push({ label: 'By Net Loss', amount: Math.abs(pnl.netProfit), isBold: true });
        }

        const drSum = drItems.reduce((s, i) => s + i.amount, 0);
        const crSum = crItems.reduce((s, i) => s + i.amount, 0);
        const total = Math.max(drSum, crSum);

        return { drItems, crItems, total };
    }, [pnl]);

    /* ── Build T-Account items for Balance Sheet ── */
    const bsAccountData = useMemo(() => {
        if (!bs) return null;

        // Left side: Liabilities + Equity
        const leftItems: TItem[] = [];
        // Capital / Equity
        if (bs.equityLeaf.length > 0) {
            leftItems.push({ label: 'Capital / Equity', amount: 0, isGroupHeader: true });
            bs.equityLeaf.forEach(a => {
                leftItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
            leftItems.push({ label: 'Total Capital', amount: bs.totalEquity, isBold: true });
            leftItems.push({ label: '', amount: 0 }); // spacer
        }
        // Non-Current Liabilities
        if (bs.nonCurrentLiab.length > 0) {
            leftItems.push({ label: 'Non-Current Liabilities', amount: 0, isGroupHeader: true });
            bs.nonCurrentLiab.forEach(a => {
                leftItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
            leftItems.push({ label: '', amount: 0 }); // spacer
        }
        // Current Liabilities
        if (bs.currentLiab.length > 0) {
            leftItems.push({ label: 'Current Liabilities', amount: 0, isGroupHeader: true });
            bs.currentLiab.forEach(a => {
                leftItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
            leftItems.push({ label: '', amount: 0 }); // spacer
        }
        // Other Liabilities
        if (bs.otherLiab.length > 0) {
            leftItems.push({ label: 'Other Liabilities', amount: 0, isGroupHeader: true });
            bs.otherLiab.forEach(a => {
                leftItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
        }

        // Right side: Assets
        const rightItems: TItem[] = [];
        // Fixed / Non-Current Assets
        if (bs.fixedAssets.length > 0) {
            rightItems.push({ label: 'Fixed / Non-Current Assets', amount: 0, isGroupHeader: true });
            bs.fixedAssets.forEach(a => {
                rightItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
            rightItems.push({ label: 'Total Fixed Assets', amount: bs.totalFixedAssets, isBold: true });
            rightItems.push({ label: '', amount: 0 }); // spacer
        }
        // Current Assets
        if (bs.currentAssets.length > 0) {
            rightItems.push({ label: 'Current Assets', amount: 0, isGroupHeader: true });
            bs.currentAssets.forEach(a => {
                rightItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
            rightItems.push({ label: 'Total Current Assets', amount: bs.totalCurrentAssets, isBold: true });
            rightItems.push({ label: '', amount: 0 }); // spacer
        }
        // Other Assets
        if (bs.otherAssets.length > 0) {
            rightItems.push({ label: 'Other Assets', amount: 0, isGroupHeader: true });
            bs.otherAssets.forEach(a => {
                rightItems.push({ label: a.name, amount: Number(a.balance), indent: 1 });
            });
        }

        const leftTotal = bs.totalLiabilities + bs.totalEquity;
        const rightTotal = bs.totalAssets;

        return { leftItems, rightItems, leftTotal, rightTotal };
    }, [bs]);

    /* ── Render ── */
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Financial Reports</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Statutory reports with Dr / Cr classification
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Sub-tabs */}
            <Tabs defaultValue="pnl" className="space-y-8">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-12 w-full md:w-auto inline-flex">
                    <TabsTrigger value="pnl" className="rounded-xl h-10 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Trading & P&L
                    </TabsTrigger>
                    <TabsTrigger value="bs" className="rounded-xl h-10 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
                        <Scale className="h-3.5 w-3.5" /> Balance Sheet
                    </TabsTrigger>
                    <TabsTrigger value="tb" className="rounded-xl h-10 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" /> Trial Balance
                    </TabsTrigger>
                    <TabsTrigger value="cf" className="rounded-xl h-10 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
                        <Banknote className="h-3.5 w-3.5" /> Cash Flow
                    </TabsTrigger>
                </TabsList>

                {/* ═══════ TRADING & P&L ACCOUNT ═══════ */}
                <TabsContent value="pnl" className="space-y-6">
                    {isLoading ? <LoadingState /> : pnl ? (
                        <div className="space-y-8">
                            {/* KPI Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard label="Total Revenue" value={pnl.totalSales} icon={TrendingUp} trend="up" />
                                <KpiCard label="Cost of Goods" value={pnl.totalCOGS} icon={TrendingDown} trend="down" />
                                <KpiCard label="Gross Profit" value={pnl.grossProfit} icon={DollarSign} trend={pnl.grossProfit >= 0 ? 'up' : 'down'} />
                                <KpiCard label="Net Profit" value={pnl.netProfit} icon={Wallet} trend={pnl.netProfit >= 0 ? 'up' : 'down'} />
                            </div>

                            {/* Trading Account - T Format */}
                            {tradingData && (
                                <TAccountTable
                                    title="Trading Account"
                                    subtitle={`for the period ending ${dateStr}`}
                                    drItems={tradingData.drItems}
                                    crItems={tradingData.crItems}
                                    drTotal={tradingData.total}
                                    crTotal={tradingData.total}
                                />
                            )}

                            {/* Profit & Loss Account - T Format */}
                            {pnlAccountData && (
                                <TAccountTable
                                    title="Profit and Loss Account"
                                    subtitle={`for the period ending ${dateStr}`}
                                    drItems={pnlAccountData.drItems}
                                    crItems={pnlAccountData.crItems}
                                    drTotal={pnlAccountData.total}
                                    crTotal={pnlAccountData.total}
                                />
                            )}

                            {/* Net Result Summary */}
                            <Card className={cn(
                                "rounded-2xl border-none shadow-lg overflow-hidden p-6",
                                pnl.netProfit >= 0
                                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                                    : "bg-gradient-to-r from-rose-600 to-rose-500 text-white"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {pnl.netProfit >= 0
                                            ? <ArrowUpRight className="h-8 w-8" strokeWidth={3} />
                                            : <ArrowDownRight className="h-8 w-8" strokeWidth={3} />
                                        }
                                        <div>
                                            <p className="text-sm font-bold opacity-80 uppercase tracking-wider">
                                                {pnl.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                                            </p>
                                            <p className="text-3xl font-black">${fmt(Math.abs(pnl.netProfit))}</p>
                                        </div>
                                    </div>
                                    <div className="text-right opacity-80">
                                        <p className="text-xs font-bold">Gross Margin: {pnl.totalSales > 0 ? ((pnl.grossProfit / pnl.totalSales) * 100).toFixed(1) : '0'}%</p>
                                        <p className="text-xs font-bold">Net Margin: {pnl.totalSales > 0 ? ((pnl.netProfit / pnl.totalSales) * 100).toFixed(1) : '0'}%</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <EmptyReport label="Profit & Loss" />
                    )}
                </TabsContent>

                {/* ═══════ BALANCE SHEET ═══════ */}
                <TabsContent value="bs" className="space-y-6">
                    {isLoading ? <LoadingState /> : bsAccountData ? (
                        <div className="space-y-8">
                            {/* Balance Sheet T-Format */}
                            <TAccountTable
                                title="Balance Sheet"
                                subtitle={`as on ${dateStr}`}
                                drLabel="Liabilities"
                                crLabel="Assets"
                                drColHeader="Particulars"
                                crColHeader="Particulars"
                                drItems={bsAccountData.leftItems}
                                crItems={bsAccountData.rightItems}
                                drTotal={bsAccountData.leftTotal}
                                crTotal={bsAccountData.rightTotal}
                            />

                            {/* Balance Check */}
                            <Card className={cn(
                                "rounded-2xl p-5 border-none shadow-sm",
                                bsAccountData.leftTotal === bsAccountData.rightTotal
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-amber-50 border-amber-200"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Scale className={cn("h-5 w-5", bsAccountData.leftTotal === bsAccountData.rightTotal ? "text-emerald-600" : "text-amber-600")} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {bsAccountData.leftTotal === bsAccountData.rightTotal
                                                    ? '✓ Balance Sheet is balanced'
                                                    : '⚠ Balance Sheet is out of balance'
                                                }
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Liabilities + Equity = ${fmt(bsAccountData.leftTotal)} | Assets = ${fmt(bsAccountData.rightTotal)}
                                            </p>
                                        </div>
                                    </div>
                                    {bsAccountData.leftTotal !== bsAccountData.rightTotal && (
                                        <Badge variant="outline" className="rounded-full text-amber-700 border-amber-300">
                                            Diff: ${fmt(Math.abs(bsAccountData.leftTotal - bsAccountData.rightTotal))}
                                        </Badge>
                                    )}
                                </div>
                            </Card>

                            {/* Quick Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard label="Total Assets" value={bs!.totalAssets} icon={Building2} trend="neutral" />
                                <KpiCard label="Total Liabilities" value={bs!.totalLiabilities} icon={FileText} trend="neutral" />
                                <KpiCard label="Total Equity" value={bs!.totalEquity} icon={Wallet} trend="neutral" />
                                <KpiCard label="Debt-to-Equity" value={bs!.totalEquity > 0 ? +(bs!.totalLiabilities / bs!.totalEquity).toFixed(2) : 0} icon={BarChart3} trend="neutral" />
                            </div>
                        </div>
                    ) : (
                        <EmptyReport label="Balance Sheet" />
                    )}
                </TabsContent>

                {/* ═══════ TRIAL BALANCE ═══════ */}
                <TabsContent value="tb">
                    {isLoading ? <LoadingState /> : tbData ? (
                        <Card className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                            <div className="bg-slate-900 text-white px-8 py-5 text-center">
                                <h3 className="text-lg font-bold tracking-tight">Trial Balance</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">as on {dateStr}</p>
                            </div>

                            {/* Dr/Cr header */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b-2 border-slate-300">
                                            <th className="px-6 py-3 text-left font-bold text-slate-700">Code</th>
                                            <th className="px-6 py-3 text-left font-bold text-slate-700">Account Name</th>
                                            <th className="px-6 py-3 text-left font-bold text-slate-700">Type</th>
                                            <th className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/50">
                                                Dr ($)
                                            </th>
                                            <th className="px-4 py-3 text-right font-bold text-rose-700 bg-rose-50/50">
                                                Cr ($)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tbData.map((account: Account) => {
                                            const balance = Number(account.balance);
                                            let debit = 0;
                                            let credit = 0;

                                            // Asset/Expense: normal balance = Debit
                                            if (['asset', 'expense'].includes(account.type)) {
                                                if (balance >= 0) debit = balance;
                                                else credit = Math.abs(balance);
                                            } else {
                                                // Liability/Equity/Revenue: normal balance = Credit
                                                if (balance >= 0) credit = balance;
                                                else debit = Math.abs(balance);
                                            }

                                            return (
                                                <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{account.code}</td>
                                                    <td className="px-6 py-3 font-semibold text-slate-700">{account.name}</td>
                                                    <td className="px-6 py-3">
                                                        <Badge variant="outline" className="rounded-full text-[10px] font-semibold capitalize">
                                                            {account.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 bg-emerald-50/20">
                                                        {debit > 0 ? fmt(debit) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-700 bg-rose-50/20">
                                                        {credit > 0 ? fmt(credit) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-100 border-t-[3px] border-double border-slate-400 font-black text-slate-900">
                                            <td colSpan={3} className="px-6 py-3 text-right text-xs uppercase tracking-wider">Totals</td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-800 bg-emerald-50/50">
                                                {fmt(tbData.reduce((sum: number, a: Account) => {
                                                    const bal = Number(a.balance);
                                                    if (['asset', 'expense'].includes(a.type)) return sum + (bal >= 0 ? bal : 0);
                                                    return sum + (bal < 0 ? Math.abs(bal) : 0);
                                                }, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-800 bg-rose-50/50">
                                                {fmt(tbData.reduce((sum: number, a: Account) => {
                                                    const bal = Number(a.balance);
                                                    if (!['asset', 'expense'].includes(a.type)) return sum + (bal >= 0 ? bal : 0);
                                                    return sum + (bal < 0 ? Math.abs(bal) : 0);
                                                }, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <EmptyReport label="Trial Balance" />
                    )}
                </TabsContent>

                {/* ═══════ CASH FLOW STATEMENT ═══════ */}
                <TabsContent value="cf" className="space-y-6">
                    {isLoading ? <LoadingState /> : (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                                <div className="bg-slate-900 text-white px-8 py-5 text-center">
                                    <h3 className="text-lg font-bold tracking-tight">Cash Flow Statement</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">for the period ending {dateStr}</p>
                                </div>

                                <div className="p-6 space-y-1">
                                    {/* Operating Activities */}
                                    <CashFlowSection
                                        title="A. Cash Flow from Operating Activities"
                                        items={[
                                            { label: 'Net Profit / (Loss)', amount: pnl?.netProfit || 0, isBold: true },
                                            { label: 'Adjustments:', amount: 0, isGroupHeader: true },
                                            { label: 'Depreciation & Amortisation', amount: 0, indent: 1 },
                                            { label: 'Changes in Working Capital', amount: 0, indent: 1 },
                                            { label: '(Increase) / Decrease in Receivables', amount: 0, indent: 2 },
                                            { label: '(Increase) / Decrease in Inventories', amount: 0, indent: 2 },
                                            { label: 'Increase / (Decrease) in Payables', amount: 0, indent: 2 },
                                        ]}
                                        total={pnl?.netProfit || 0}
                                    />

                                    <div className="border-t border-border/30 my-4" />

                                    {/* Investing Activities */}
                                    <CashFlowSection
                                        title="B. Cash Flow from Investing Activities"
                                        items={[
                                            { label: 'Purchase of Fixed Assets', amount: 0, indent: 1 },
                                            { label: 'Sale of Fixed Assets', amount: 0, indent: 1 },
                                            { label: 'Investments Made', amount: 0, indent: 1 },
                                        ]}
                                        total={0}
                                    />

                                    <div className="border-t border-border/30 my-4" />

                                    {/* Financing Activities */}
                                    <CashFlowSection
                                        title="C. Cash Flow from Financing Activities"
                                        items={[
                                            { label: 'Loans Received', amount: 0, indent: 1 },
                                            { label: 'Loans Repaid', amount: 0, indent: 1 },
                                            { label: 'Capital Introduced', amount: 0, indent: 1 },
                                            { label: 'Drawings / Dividends', amount: 0, indent: 1 },
                                        ]}
                                        total={0}
                                    />

                                    <div className="border-t-[3px] border-double border-slate-400 my-4" />

                                    {/* Net Change */}
                                    <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                                        <span className="font-bold uppercase tracking-wider text-sm">Net Change in Cash (A+B+C)</span>
                                        <span className="text-2xl font-black font-mono tabular-nums">${fmt(pnl?.netProfit || 0)}</span>
                                    </div>
                                </div>
                            </Card>

                            <p className="text-xs text-muted-foreground text-center italic">
                                Note: Cash Flow from Investing and Financing activities will auto-populate as transactions are recorded.
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

/* ─── Cash Flow Section ─── */
function CashFlowSection({ title, items, total }: {
    title: string;
    items: TItem[];
    total: number;
}) {
    return (
        <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h4>
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center justify-between py-1.5 px-3 rounded-lg",
                            item.isGroupHeader && "mt-2",
                            item.isBold && "bg-slate-50"
                        )}
                        style={{ paddingLeft: `${12 + (item.indent || 0) * 16}px` }}
                    >
                        <span className={cn(
                            "text-sm",
                            item.isBold ? "font-bold text-slate-900" :
                                item.isGroupHeader ? "font-bold text-slate-700 text-xs uppercase tracking-wider" :
                                    "text-slate-600"
                        )}>
                            {item.label}
                        </span>
                        {!item.isGroupHeader && (
                            <span className={cn(
                                "font-mono tabular-nums text-sm",
                                item.isBold ? "font-bold text-slate-900" : "text-slate-600"
                            )}>
                                {item.amount !== 0 ? `${item.amount < 0 ? '(' : ''}$${fmt(Math.abs(item.amount))}${item.amount < 0 ? ')' : ''}` : '—'}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-border/40 mt-2">
                <span className="text-sm font-bold text-slate-900">Net Cash from {title.split('. ')[1] || title}</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">${fmt(total)}</span>
            </div>
        </div>
    );
}

/* ─── Empty Report ─── */
function EmptyReport({ label }: { label: string }) {
    return (
        <Card className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-200" />
            <p className="font-bold text-slate-400">{label} report is empty</p>
            <p className="text-xs text-slate-300 mt-1">Post journal entries to generate this report</p>
        </Card>
    );
}
