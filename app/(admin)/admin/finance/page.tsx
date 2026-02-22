'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
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
import { ModuleGuard } from '@/components/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';

// Content Components
import { CashFlowContent } from '@/components/finance/cash-flow-content';
import { UnifiedEntriesContent } from '@/components/finance/unified-entries-content';
import { BankingContent } from '@/components/finance/banking-content';
import { ReconciliationContent } from '@/components/finance/reconciliation-content';
import { GeneralLedgerContent } from '@/components/finance/general-ledger-content';
import { FinancialReportingContent } from '@/components/finance/financial-reporting-content';
import { TaxContent } from '@/components/finance/tax-content';
import { BudgetingContent } from '@/components/finance/budget-content';
import { ControlsContent } from '@/components/finance/controls-content';
import { ReceivablesContent } from '@/components/finance/receivables-content';
import { PayablesContent } from '@/components/finance/payables-content';
import { CreditNotesContent } from '@/components/finance/credit-notes-content';
import { DebitNotesContent } from '@/components/finance/debit-notes-content';
import { AssetsContent } from '@/components/finance/assets-content';
import { StockJournalContent } from '@/components/finance/stock-journal-content';

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

                    <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as FinanceMode)} className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <TabsList className="bg-muted/50 border h-10 p-0.5 w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                                <TabsTrigger value="overview" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                                <TabsTrigger value="ledger" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Journal & GL</TabsTrigger>
                                <TabsTrigger value="banking" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Banking</TabsTrigger>
                                <TabsTrigger value="receivables" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Receivables</TabsTrigger>
                                <TabsTrigger value="payables" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Payables</TabsTrigger>
                                {checkAccess('inventory').accessible && (
                                    <TabsTrigger value="assets" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Assets & Stock</TabsTrigger>
                                )}
                                <TabsTrigger value="compliance" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Compliance</TabsTrigger>
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

                            {activeMode === 'banking' && (
                                <Tabs defaultValue="banking" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 justify-start">
                                        <TabsTrigger value="banking" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Banking & Treasury</TabsTrigger>
                                        <TabsTrigger value="reconciliation" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Reconciliation</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="banking" className="m-0 animate-in fade-in duration-500">
                                        <BankingContent />
                                    </TabsContent>
                                    <TabsContent value="reconciliation" className="m-0 animate-in fade-in duration-500">
                                        <ReconciliationContent />
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

                            {activeMode === 'compliance' && (
                                <Tabs defaultValue="reporting" className="space-y-6">
                                    <TabsList className="bg-muted/50 border h-9 p-0.5 w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                                        <TabsTrigger value="reporting" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Financial Reporting</TabsTrigger>
                                        <TabsTrigger value="tax" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Tax & Duties</TabsTrigger>
                                        <TabsTrigger value="budgeting" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Budgeting</TabsTrigger>
                                        <TabsTrigger value="controls" className="text-xs font-semibold px-4 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Controls</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="reporting" className="m-0 animate-in fade-in duration-500">
                                        <FinancialReportingContent />
                                    </TabsContent>
                                    <TabsContent value="tax" className="m-0 animate-in fade-in duration-500">
                                        <TaxContent />
                                    </TabsContent>
                                    <TabsContent value="budgeting" className="m-0 animate-in fade-in duration-500">
                                        <BudgetingContent />
                                    </TabsContent>
                                    <TabsContent value="controls" className="m-0 animate-in fade-in duration-500">
                                        <ControlsContent />
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
