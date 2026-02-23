'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import {
    DollarSign,
    Activity,
    Landmark,
    FileText,
    Receipt,
    Calculator,
    BarChart3,
    ArrowRightLeft,
    CreditCard,
    Shield,
    PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';

// Content Components
import { CashFlowContent } from './_components/cash-flow-content';
import { UnifiedEntriesContent } from './_components/unified-entries-content';
import { BankingContent } from './_components/banking-content';
import { ReconciliationContent } from './_components/reconciliation-content';
import { GeneralLedgerContent } from './_components/general-ledger-content';
import { FinancialReportingContent } from './_components/financial-reporting-content';
import { TaxContent } from './_components/tax-content';
import { BudgetingContent } from './_components/budget-content';
import { ControlsContent } from './_components/controls-content';
import { ReceivablesContent } from './_components/receivables-content';
import { PayablesContent } from './_components/payables-content';
import { CreditNotesContent } from './_components/credit-notes-content';
import { DebitNotesContent } from './_components/debit-notes-content';
import { AssetsContent } from './_components/assets-content';
import { StockJournalContent } from './_components/stock-journal-content';

type FinanceMode = 'overview' | 'ledger' | 'banking' | 'receivables' | 'payables' | 'compliance' | 'assets';

export default function FinancePage() {
    const { getModuleLabel, checkAccess } = useTenant();
    const [activeMode, setActiveMode] = useState<FinanceMode>('overview');

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="finance">
                <div className="space-y-6">
                    {/* Industrial Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 bg-card -mx-4 px-4 sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">{getModuleLabel('finance')}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fiscal Control</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Hub Launchpads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <HubCard
                            title="Banking & Treasury"
                            desc="Manage accounts, cash flow, and reconciliation."
                            icon={Landmark}
                            href="/admin/finance/banking"
                            color="blue"
                        />
                        <HubCard
                            title="Tax & Compliance"
                            desc="VAT returns, tax rates, and official filings."
                            icon={Shield}
                            href="/admin/finance/taxes"
                            color="emerald"
                        />
                        <HubCard
                            title="Invoices & Billing"
                            desc="Customer invoices and vendor bill tracking."
                            icon={Receipt}
                            href="/admin/finance/invoices"
                            color="indigo"
                        />
                        <HubCard
                            title="Expenses"
                            desc="Company spending and reimbursement control."
                            icon={CreditCard}
                            href="/admin/finance/expenses"
                            color="rose"
                        />
                    </div>

                    <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as FinanceMode)} className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <TabsList className="bg-muted/50 border h-10 p-0.5 w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                                <TabsTrigger value="overview" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Executive Overview</TabsTrigger>
                                <TabsTrigger value="ledger" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">General Ledger</TabsTrigger>
                                <TabsTrigger value="receivables" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Receivables</TabsTrigger>
                                <TabsTrigger value="payables" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Payables</TabsTrigger>
                                {checkAccess('inventory').accessible && (
                                    <TabsTrigger value="assets" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Assets & Stock</TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* Dynamic Content Body */}
                        <div className="animate-in fade-in duration-500 min-h-[60vh]">
                            {activeMode === 'overview' && <CashFlowContent />}

                            {activeMode === 'ledger' && (
                                <Tabs defaultValue="vouchers" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 justify-start">
                                        <TabsTrigger value="vouchers" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Voucher Entries</TabsTrigger>
                                        <TabsTrigger value="chart" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Chart of Accounts</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="vouchers" className="m-0 animate-in fade-in duration-500">
                                        <UnifiedEntriesContent />
                                    </TabsContent>
                                    <TabsContent value="chart" className="m-0 animate-in fade-in duration-500">
                                        <GeneralLedgerContent />
                                    </TabsContent>
                                </Tabs>
                            )}

                            {activeMode === 'receivables' && (
                                <Tabs defaultValue="receivables" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 justify-start">
                                        <TabsTrigger value="receivables" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Receivables</TabsTrigger>
                                        <TabsTrigger value="credit-notes" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Credit Notes</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="receivables" className="m-0 animate-in fade-in duration-500">
                                        <ReceivablesContent />
                                    </TabsContent>
                                    <TabsContent value="credit-notes" className="m-0 animate-in fade-in duration-500">
                                        <CreditNotesContent />
                                    </TabsContent>
                                </Tabs>
                            )}

                            {activeMode === 'payables' && (
                                <Tabs defaultValue="payables" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 justify-start">
                                        <TabsTrigger value="payables" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Payables</TabsTrigger>
                                        <TabsTrigger value="debit-notes" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Debit Notes</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="payables" className="m-0 animate-in fade-in duration-500">
                                        <PayablesContent />
                                    </TabsContent>
                                    <TabsContent value="debit-notes" className="m-0 animate-in fade-in duration-500">
                                        <DebitNotesContent />
                                    </TabsContent>
                                </Tabs>
                            )}

                            {activeMode === 'assets' && (
                                <Tabs defaultValue="assets" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 justify-start">
                                        <TabsTrigger value="assets" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Fixed Assets</TabsTrigger>
                                        <TabsTrigger value="stock-journal" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Stock Journal</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="assets" className="m-0 animate-in fade-in duration-500">
                                        <AssetsContent />
                                    </TabsContent>
                                    <TabsContent value="stock-journal" className="m-0 animate-in fade-in duration-500">
                                        <StockJournalContent />
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

import Link from 'next/link';
function HubCard({ title, desc, icon: Icon, href, color }: { title: string, desc: string, icon: any, href: string, color: string }) {
    const variants: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50",
        emerald: "text-emerald-600 bg-emerald-50",
        indigo: "text-indigo-600 bg-indigo-50",
        rose: "text-rose-600 bg-rose-50",
    };
    return (
        <Link href={href}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full group">
                <CardHeader className="p-4 pb-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110", variants[color])}>
                        <Icon size={18} />
                    </div>
                    <CardTitle className="text-sm font-bold">{title}</CardTitle>
                    <CardContent className="p-0 pt-1">
                        <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
                    </CardContent>
                </CardHeader>
            </Card>
        </Link>
    );
}
