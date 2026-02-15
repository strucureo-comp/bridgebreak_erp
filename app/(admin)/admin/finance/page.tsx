'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CashFlowContent } from '@/components/finance/cash-flow-content';
import { BankingContent } from '@/components/finance/banking-content';
import { AssetsContent } from '@/components/finance/assets-content';
import { ControlsContent } from '@/components/finance/controls-content';
import { TaxContent } from '@/components/finance/tax-content';
import { GeneralLedgerContent } from '@/components/finance/general-ledger-content';
import { FinancialReportingContent } from '@/components/finance/financial-reporting-content';
import { BudgetingContent } from '@/components/finance/budget-content';
import { ReceivablesContent } from '@/components/finance/receivables-content';
import { PayablesContent } from '@/components/finance/payables-content';
import { CreditNotesContent } from '@/components/finance/credit-notes-content';
import { DebitNotesContent } from '@/components/finance/debit-notes-content';
import { StockJournalContent } from '@/components/finance/stock-journal-content';
import { ReconciliationContent } from '@/components/finance/reconciliation-content';
import { UnifiedEntriesContent } from '@/components/finance/unified-entries-content';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, TrendingUp, BookOpen, Shield,
  Calculator, Scale, BarChart3, PiggyBank,
  Landmark, Building2, FileText, Receipt,
  ArrowRightLeft, CreditCard, Package,
  LayoutGrid, ArrowDownLeft, ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { ModuleGuard } from '@/components/layout/module-guard';

export default function FinancePage() {
  return (
    <DashboardShell requireAdmin>
      <ModuleGuard module="finance">
        <div className="space-y-8 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance Hub</h1>
                <p className="text-sm text-slate-500 font-medium">
                  Centralized Ledger, Banking, and Financial Compliance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full text-[10px] font-black px-3 py-1">
                DOUBLE-ENTRY ENABLED
              </Badge>
            </div>
          </div>

          {/* Logical Lifecycle Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto pb-2">
              <TabsList className="rounded-2xl bg-white border shadow-sm p-1 h-auto flex gap-1 min-w-max">
                <TabsTrigger value="overview" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <LayoutGrid className="h-3.5 w-3.5" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="daily" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <BookOpen className="h-3.5 w-3.5" /> 1. Entries & Banking
                </TabsTrigger>
                <TabsTrigger value="revenue" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <ArrowDownLeft className="h-3.5 w-3.5" /> 2. Revenue (AR)
                </TabsTrigger>
                <TabsTrigger value="expenses" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> 3. Expenses (AP)
                </TabsTrigger>
                <TabsTrigger value="assets" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <Package className="h-3.5 w-3.5" /> 4. Assets & Stock
                </TabsTrigger>
                <TabsTrigger value="compliance" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                  <ClipboardList className="h-3.5 w-3.5" /> 5. Compliance
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ═══ Dashboard ═══ */}
            <TabsContent value="overview">
              <CashFlowContent />
            </TabsContent>

            {/* ═══ 1. Entries & Banking (Merged) ═══ */}
            <TabsContent value="daily">
              <Tabs defaultValue="vouchers" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-11 inline-flex">
                  <TabsTrigger value="vouchers" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Journal Vouchers
                  </TabsTrigger>
                  <TabsTrigger value="banking" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Landmark className="h-3.5 w-3.5" /> Cash & Bank
                  </TabsTrigger>
                  <TabsTrigger value="coa" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Scale className="h-3.5 w-3.5" /> Chart of Accounts
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="vouchers"><UnifiedEntriesContent /></TabsContent>
                <TabsContent value="banking"><CashBankMerged /></TabsContent>
                <TabsContent value="coa"><GeneralLedgerContent /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ═══ 2. Revenue (AR) ═══ */}
            <TabsContent value="revenue">
              <Tabs defaultValue="invoices" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-11 inline-flex">
                  <TabsTrigger value="invoices" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Customer Invoices
                  </TabsTrigger>
                  <TabsTrigger value="credits" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Credit Notes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="invoices"><ReceivablesContent /></TabsContent>
                <TabsContent value="credits"><CreditNotesContent /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ═══ 3. Expenses (AP) ═══ */}
            <TabsContent value="expenses">
              <Tabs defaultValue="bills" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-11 inline-flex">
                  <TabsTrigger value="bills" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Vendor Bills
                  </TabsTrigger>
                  <TabsTrigger value="debits" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Debit Notes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="bills"><PayablesContent /></TabsContent>
                <TabsContent value="debits"><DebitNotesContent /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ═══ 4. Assets & Stock ═══ */}
            <TabsContent value="assets">
              <Tabs defaultValue="fixed" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-11 inline-flex">
                  <TabsTrigger value="fixed" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Fixed Assets
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Stock Journals
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="fixed"><AssetsContent /></TabsContent>
                <TabsContent value="stock"><StockJournalContent /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ═══ 5. Compliance & Reporting ═══ */}
            <TabsContent value="compliance">
              <Tabs defaultValue="reports" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-11 inline-flex">
                  <TabsTrigger value="reports" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> Financial Reports
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Calculator className="h-3.5 w-3.5" /> Tax Center
                  </TabsTrigger>
                  <TabsTrigger value="budget" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <PiggyBank className="h-3.5 w-3.5" /> Budgeting
                  </TabsTrigger>
                  <TabsTrigger value="controls" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Approval Workflows
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="reports"><FinancialReportingContent /></TabsContent>
                <TabsContent value="tax"><TaxContent /></TabsContent>
                <TabsContent value="budget"><BudgetingContent /></TabsContent>
                <TabsContent value="controls"><ControlsContent /></TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </ModuleGuard>
    </DashboardShell>
  );
}

function CashBankMerged() {
  return (
    <Tabs defaultValue="accounts" className="space-y-6">
      <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-11 inline-flex">
        <TabsTrigger value="accounts" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
          <Landmark className="h-3.5 w-3.5" /> Accounts & Transactions
        </TabsTrigger>
        <TabsTrigger value="reconciliation" className="rounded-xl h-9 px-5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Reconciliation
        </TabsTrigger>
      </TabsList>
      <TabsContent value="accounts" className="outline-none"><BankingContent /></TabsContent>
      <TabsContent value="reconciliation" className="outline-none"><ReconciliationContent /></TabsContent>
    </Tabs>
  );
}
