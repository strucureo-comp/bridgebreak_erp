'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, ChevronLeft, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

// ── Balance Sheet ──
const BS = {
    assets: [
        { name: 'Cash & Bank', value: 1840000 }, { name: 'Accounts Receivable', value: 542000 },
        { name: 'Inventory', value: 380000 }, { name: 'Prepaid Expenses', value: 45000 },
        { name: 'Property, Plant & Equipment (Net)', value: 960000 },
    ],
    liabilities: [
        { name: 'Accounts Payable', value: 218000 }, { name: 'Accrued Expenses', value: 67000 },
        { name: 'VAT Payable', value: 123000 }, { name: 'Unearned Revenue', value: 89000 },
        { name: 'Long-term Loan', value: 500000 },
    ],
    equity: [
        { name: 'Share Capital', value: 1000000 }, { name: 'Retained Earnings', value: 850000 },
        { name: 'Current Year P&L', value: 860000 },
    ],
};

// ── Income Statement ──
const IS = {
    revenue: [{ name: 'Sales Revenue', value: 2460000 }, { name: 'Service Revenue', value: 340000 }, { name: 'Other Income', value: 28000 }],
    directCosts: [{ name: 'Cost of Goods Sold', value: 412000 }, { name: 'Direct Labour', value: 180000 }],
    operatingExp: [
        { name: 'Salaries & Wages', value: 156000 }, { name: 'Rent', value: 72000 },
        { name: 'Utilities', value: 18500 }, { name: 'Depreciation', value: 48000 },
        { name: 'Insurance', value: 24000 },
    ],
    financeCosts: [{ name: 'Interest Expense', value: 32000 }, { name: 'FX Loss', value: 8400 }],
};

// ── Cash Flow ──
const CF = {
    operating: [{ name: 'Net Income', value: 1568000 }, { name: 'Depreciation Add-back', value: 48000 }, { name: 'Change in Receivables', value: -142000 }, { name: 'Change in Payables', value: 68000 }],
    investing: [{ name: 'Equipment Purchase', value: -95000 }, { name: 'Asset Sale Proceeds', value: 12000 }],
    financing: [{ name: 'Loan Repayment', value: -100000 }, { name: 'Dividend Paid', value: -200000 }],
};

// ── Budget vs Actual ──
const BVA = [
    { dept: 'Engineering', budget: 420000, actual: 392000 },
    { dept: 'Sales & Marketing', budget: 180000, actual: 205000 },
    { dept: 'Operations', budget: 310000, actual: 295000 },
    { dept: 'Admin & HR', budget: 120000, actual: 118000 },
    { dept: 'IT & Systems', budget: 95000, actual: 82000 },
];

export default function FinancialReportingPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('bs');

    const totalAssets = BS.assets.reduce((s, a) => s + a.value, 0);
    const totalLiab = BS.liabilities.reduce((s, l) => s + l.value, 0);
    const totalEquity = BS.equity.reduce((s, e) => s + e.value, 0);
    const totalRevenue = IS.revenue.reduce((s, r) => s + r.value, 0);
    const totalDirectCosts = IS.directCosts.reduce((s, d) => s + d.value, 0);
    const grossProfit = totalRevenue - totalDirectCosts;
    const totalOpex = IS.operatingExp.reduce((s, o) => s + o.value, 0);
    const totalFinance = IS.financeCosts.reduce((s, f) => s + f.value, 0);
    const netIncome = grossProfit - totalOpex - totalFinance;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><BarChart3 className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Financial Reporting</h1>
                            <p className="text-[11px] text-muted-foreground">Balance Sheet · P&L · Cash Flow · Budget vs Actual</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Export PDF</Button>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="bs" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="is" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Income Statement</TabsTrigger>
                        <TabsTrigger value="cf" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Cash Flow</TabsTrigger>
                        <TabsTrigger value="bva" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Budget vs Actual</TabsTrigger>
                    </TabsList>

                    {/* ── BALANCE SHEET ── */}
                    <TabsContent value="bs" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Statement of Financial Position</CardTitle><CardDescription className="text-[11px]">As at 28 February 2026</CardDescription></CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <SectionHeader title="ASSETS" />
                                    {BS.assets.map(a => <LineItem key={a.name} name={a.name} value={fmt(a.value)} />)}
                                    <TotalLine label="Total Assets" value={fmt(totalAssets)} />
                                    <SectionHeader title="LIABILITIES" />
                                    {BS.liabilities.map(l => <LineItem key={l.name} name={l.name} value={fmt(l.value)} />)}
                                    <TotalLine label="Total Liabilities" value={fmt(totalLiab)} />
                                    <SectionHeader title="EQUITY" />
                                    {BS.equity.map(e => <LineItem key={e.name} name={e.name} value={fmt(e.value)} />)}
                                    <TotalLine label="Total Equity" value={fmt(totalEquity)} />
                                    <TotalLine label="Liabilities + Equity" value={fmt(totalLiab + totalEquity)} highlight />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── INCOME STATEMENT ── */}
                    <TabsContent value="is" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Income Statement</CardTitle><CardDescription className="text-[11px]">For the period ending 28 February 2026</CardDescription></CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <SectionHeader title="REVENUE" />
                                    {IS.revenue.map(r => <LineItem key={r.name} name={r.name} value={fmt(r.value)} />)}
                                    <TotalLine label="Total Revenue" value={fmt(totalRevenue)} />
                                    <SectionHeader title="DIRECT COSTS" />
                                    {IS.directCosts.map(d => <LineItem key={d.name} name={d.name} value={`(${fmt(d.value)})`} negative />)}
                                    <TotalLine label="Gross Profit" value={fmt(grossProfit)} highlight />
                                    <SectionHeader title="OPERATING EXPENSES" />
                                    {IS.operatingExp.map(o => <LineItem key={o.name} name={o.name} value={`(${fmt(o.value)})`} negative />)}
                                    <TotalLine label="Operating Income" value={fmt(grossProfit - totalOpex)} />
                                    <SectionHeader title="FINANCE COSTS" />
                                    {IS.financeCosts.map(f => <LineItem key={f.name} name={f.name} value={`(${fmt(f.value)})`} negative />)}
                                    <TotalLine label="Net Income" value={fmt(netIncome)} highlight />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── CASH FLOW ── */}
                    <TabsContent value="cf" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Statement of Cash Flows</CardTitle><CardDescription className="text-[11px]">For the period ending 28 February 2026</CardDescription></CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <SectionHeader title="OPERATING ACTIVITIES" />
                                    {CF.operating.map(o => <LineItem key={o.name} name={o.name} value={fmt(o.value)} negative={o.value < 0} />)}
                                    <TotalLine label="Net Operating Cash" value={fmt(CF.operating.reduce((s, o) => s + o.value, 0))} />
                                    <SectionHeader title="INVESTING ACTIVITIES" />
                                    {CF.investing.map(i => <LineItem key={i.name} name={i.name} value={fmt(i.value)} negative={i.value < 0} />)}
                                    <TotalLine label="Net Investing Cash" value={fmt(CF.investing.reduce((s, i) => s + i.value, 0))} />
                                    <SectionHeader title="FINANCING ACTIVITIES" />
                                    {CF.financing.map(f => <LineItem key={f.name} name={f.name} value={fmt(f.value)} negative={f.value < 0} />)}
                                    <TotalLine label="Net Financing Cash" value={fmt(CF.financing.reduce((s, f) => s + f.value, 0))} />
                                    <TotalLine label="Net Change in Cash" value={fmt([...CF.operating, ...CF.investing, ...CF.financing].reduce((s, c) => s + c.value, 0))} highlight />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── BUDGET VS ACTUAL ── */}
                    <TabsContent value="bva" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Budget vs Actual — YTD</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-3">Department</span><span className="col-span-2 text-right">Budget</span>
                                        <span className="col-span-2 text-right">Actual</span><span className="col-span-2 text-right">Variance</span>
                                        <span className="col-span-3">Utilization</span>
                                    </div>
                                    {BVA.map(b => {
                                        const variance = b.budget - b.actual;
                                        const pct = Math.round((b.actual / b.budget) * 100);
                                        const over = b.actual > b.budget;
                                        return (
                                            <div key={b.dept} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                                <span className="col-span-3 text-xs font-medium">{b.dept}</span>
                                                <span className="col-span-2 text-right text-xs">{fmt(b.budget)}</span>
                                                <span className="col-span-2 text-right text-xs font-bold">{fmt(b.actual)}</span>
                                                <span className={cn("col-span-2 text-right text-xs font-bold flex items-center justify-end gap-0.5", over ? "text-red-600" : "text-emerald-600")}>
                                                    {over ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {fmt(Math.abs(variance))}
                                                </span>
                                                <span className="col-span-3 flex items-center gap-2 pl-2">
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                    </div>
                                                    <span className={cn("text-[10px] font-bold w-8 text-right", over ? "text-red-600" : "text-emerald-600")}>{pct}%</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <div className="px-6 py-2 bg-muted/30"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p></div>;
}

function LineItem({ name, value, negative }: { name: string; value: string; negative?: boolean }) {
    return (
        <div className="flex items-center justify-between px-6 py-2 hover:bg-muted/20 transition-colors">
            <span className="text-xs">{name}</span>
            <span className={cn("text-xs font-medium", negative && "text-red-600")}>{value}</span>
        </div>
    );
}

function TotalLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn("flex items-center justify-between px-6 py-2.5", highlight ? "bg-red-50 border-t-2 border-red-200" : "bg-muted/50 border-t")}>
            <span className="text-xs font-bold">{label}</span>
            <span className={cn("text-sm font-bold", highlight && "text-red-600")}>{value}</span>
        </div>
    );
}
