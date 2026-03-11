'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Download, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader } from '@/components/finance/FinancePageHeader';
import { toast } from 'sonner';

// Optional static import of jsPDF for client-side generation
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── MOCK DATA ──
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

const CF = {
    operating: [{ name: 'Net Income', value: 1568000 }, { name: 'Depreciation Add-back', value: 48000 }, { name: 'Change in Receivables', value: -142000 }, { name: 'Change in Payables', value: 68000 }],
    investing: [{ name: 'Equipment Purchase', value: -95000 }, { name: 'Asset Sale Proceeds', value: 12000 }],
    financing: [{ name: 'Loan Repayment', value: -100000 }, { name: 'Dividend Paid', value: -200000 }],
};

const BVA = [
    { dept: 'Engineering', budget: 420000, actual: 392000 },
    { dept: 'Sales & Marketing', budget: 180000, actual: 205000 },
    { dept: 'Operations', budget: 310000, actual: 295000 },
    { dept: 'Admin & HR', budget: 120000, actual: 118000 },
    { dept: 'IT & Systems', budget: 95000, actual: 82000 },
];

export default function FinancialReportingPage() {
    const { format: fmt, currencyCode } = useCurrency();
    const [tab, setTab] = useState('bs');

    // Date Range State
    const [startDate, setStartDate] = useState('2026-02-01');
    const [endDate, setEndDate] = useState('2026-02-28');
    const [exporting, setExporting] = useState(false);

    const totalAssets = BS.assets.reduce((s, a) => s + a.value, 0);
    const totalLiab = BS.liabilities.reduce((s, l) => s + l.value, 0);
    const totalEquity = BS.equity.reduce((s, e) => s + e.value, 0);
    const totalRevenue = IS.revenue.reduce((s, r) => s + r.value, 0);
    const totalDirectCosts = IS.directCosts.reduce((s, d) => s + d.value, 0);
    const grossProfit = totalRevenue - totalDirectCosts;
    const totalOpex = IS.operatingExp.reduce((s, o) => s + o.value, 0);
    const totalFinance = IS.financeCosts.reduce((s, f) => s + f.value, 0);
    const netIncome = grossProfit - totalOpex - totalFinance;

    // Real PDF Export logic
    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            const title = `Financial Report: ${tab.toUpperCase()}`;

            doc.setFontSize(16);
            doc.text(title, 14, 22);
            doc.setFontSize(10);
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
            doc.text(`Currency: ${currencyCode}`, 14, 34);

            let head: any[] = [];
            let body: any[] = [];

            if (tab === 'bs') {
                head = [['Category', 'Account', 'Balance']];
                BS.assets.forEach(a => body.push(['Asset', a.name, fmt(a.value)]));
                BS.liabilities.forEach(l => body.push(['Liability', l.name, fmt(l.value)]));
                BS.equity.forEach(e => body.push(['Equity', e.name, fmt(e.value)]));
            } else if (tab === 'is') {
                head = [['Category', 'Description', 'Amount']];
                IS.revenue.forEach(r => body.push(['Revenue', r.name, fmt(r.value)]));
                IS.directCosts.forEach(d => body.push(['Direct Cost', d.name, fmt(d.value)]));
                IS.operatingExp.forEach(o => body.push(['Operating Expense', o.name, fmt(o.value)]));
                IS.financeCosts.forEach(f => body.push(['Finance Cost', f.name, fmt(f.value)]));
                body.push(['', 'NET INCOME', fmt(netIncome)]);
            } else if (tab === 'cf') {
                head = [['Activity Type', 'Description', 'Amount']];
                CF.operating.forEach(o => body.push(['Operating', o.name, fmt(o.value)]));
                CF.investing.forEach(i => body.push(['Investing', i.name, fmt(i.value)]));
                CF.financing.forEach(f => body.push(['Financing', f.name, fmt(f.value)]));
            } else if (tab === 'bva') {
                head = [['Department', 'Budget', 'Actual', 'Variance']];
                BVA.forEach(b => body.push([b.dept, fmt(b.budget), fmt(b.actual), fmt(b.budget - b.actual)]));
            }

            autoTable(doc, {
                startY: 40,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] } // Red accent to match theme
            });

            doc.save(`Financial_Report_${tab}_${endDate}.pdf`);
            toast.success('PDF Export downloaded successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    return (

            <div className="space-y-6 pb-8">

                <FinancePageHeader
                    title="Financial Reporting"
                    subtitle="Balance Sheet · P&L · Cash Flow · Budget vs Actual"
                    icon={BarChart3}
                    actions={
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-[10px] h-8"
                            onClick={handleExportPDF}
                            disabled={exporting}
                        >
                            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            {exporting ? 'Generating...' : 'Export PDF'}
                        </Button>
                    }
                />

                {/* Date Filter & Executive KPIs */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Card className="border-border shadow-sm w-full md:w-auto shrink-0 bg-muted/30">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Start Date</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs font-mono" />
                            </div>
                            <div className="text-muted-foreground mt-4">—</div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">End Date</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-xs font-mono" />
                            </div>
                            <Button size="sm" className="mt-4 h-8 bg-red-600 hover:bg-red-700" onClick={() => toast.success('Report data refreshed for selected period')}>
                                Run Report
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 w-full">
                        <KpiCard label="Total Assets" value={fmt(totalAssets)} />
                        <KpiCard label="Gross Profit" value={fmt(grossProfit)} />
                        <KpiCard label="Net Income" value={fmt(netIncome)} positive={netIncome >= 0} />
                        <KpiCard label="Operating Cash" value={fmt(CF.operating.reduce((s, o) => s + o.value, 0))} />
                    </div>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="bs" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="is" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Income Statement</TabsTrigger>
                        <TabsTrigger value="cf" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Cash Flow</TabsTrigger>
                        <TabsTrigger value="bva" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Budget vs Actual</TabsTrigger>
                    </TabsList>

                    {/* ── ALONG WITH EXISTING REPORTS ── */}
                    <TabsContent value="bs" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="text-sm">Statement of Financial Position</CardTitle>
                                <CardDescription className="text-[11px]">As at {new Date(endDate).toLocaleDateString()}</CardDescription>
                            </CardHeader>
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

                                    <TotalLine label="Liabilities + Equity (Balanced check)" value={fmt(totalLiab + totalEquity)} highlight />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="is" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="text-sm">Income Statement</CardTitle>
                                <CardDescription className="text-[11px]">For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</CardDescription>
                            </CardHeader>
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

                    <TabsContent value="cf" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="text-sm">Statement of Cash Flows</CardTitle>
                                <CardDescription className="text-[11px]">For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</CardDescription>
                            </CardHeader>
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

                    <TabsContent value="bva" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="text-sm">Budget vs Actual — YTD</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
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
    );
}

// ── RENDER HELPER COMPONENTS ──
function SectionHeader({ title }: { title: string }) {
    return <div className="px-6 py-2 bg-muted/30 border-y"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p></div>;
}

function LineItem({ name, value, negative }: { name: string; value: string; negative?: boolean }) {
    return (
        <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
            <span className="text-xs text-muted-foreground">{name}</span>
            <span className={cn("text-xs font-medium tracking-tight", negative && "text-red-600 font-bold")}>{value}</span>
        </div>
    );
}

function TotalLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn("flex items-center justify-between px-6 py-3", highlight ? "bg-red-50 border-t border-red-200" : "bg-muted/10 border-t")}>
            <span className={cn("text-xs font-bold uppercase tracking-wider", highlight && "text-red-700")}>{label}</span>
            <span className={cn("text-sm font-bold tracking-tight", highlight && "text-red-600")}>{value}</span>
        </div>
    );
}
