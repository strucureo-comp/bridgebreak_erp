'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { getInvoices, getTransactions, createTransaction, deleteTransaction, getSystemSetting, setSystemSetting } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/common/stats-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileUploader } from '@/components/common/file-uploader';
import { DollarSign, TrendingUp, TrendingDown, Users, Plus, Paperclip, Trash2, Calendar as CalendarIcon, FileText, ExternalLink, Pencil, LayoutDashboard, List, FileDown, ClipboardCheck, Clock, Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Transaction, TransactionType } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { TallyEngine, TallyEngineWithAudit } from '@/lib/tally-engine';
import { AuditReportDashboard } from '@/components/admin/audit-report-dashboard';
import { TermHelp } from '@/components/common/term-help';
import { getCOATemplate } from '@/lib/coa-templates';
import { StatutoryReportGenerator } from '@/lib/statutory-reports';
import type { FinanceConfiguration, CurrencyCode } from '@/lib/finance-config';
import { formatCurrency, calculateTax, CURRENCY_SYMBOLS } from '@/lib/finance-config';

export default function AdminFinancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBalanceEditOpen, setIsBalanceEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');
  const [startingBalance, setStartingBalance] = useState(0);
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const [auditEngine, setAuditEngine] = useState<TallyEngineWithAudit | null>(null);
  const [financeConfig, setFinanceConfig] = useState<Partial<FinanceConfiguration> | null>(null);
  const [reportGenerator, setReportGenerator] = useState<StatutoryReportGenerator | null>(null);

  const [newTransaction, setNewTransaction] = useState<{
    amount: string;
    description: string;
    category: string;
    type: TransactionType;
    date: string;
    attachment_url: string;
    tax_rate_id?: string;
    currency?: string;
    exchange_rate?: string;
  }>({
    amount: '',
    description: '',
    category: 'General',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    attachment_url: '',
    tax_rate_id: undefined,
    currency: 'USD',
    exchange_rate: '1',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      const allowedFinanceEmails = [
        'viyasramachandran@gmail.com',
        'aathish@systemsteel.ae',
        'aathihacker2004@gmail.com',
        'admin@example.com',
      ];

      if (user.email && !allowedFinanceEmails.includes(user.email.toLowerCase())) {
        toast.error('You are not authorized to view this page.');
        router.push('/admin/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [invoicesData, transactionsData, balanceSetting, configData] = await Promise.all([
        getInvoices(),
        getTransactions(),
        getSystemSetting('finance_starting_balance'),
        getSystemSetting('finance_config')
      ]);
      setInvoices(invoicesData);
      setTransactions(transactionsData);
      setStartingBalance(balanceSetting ? parseFloat(balanceSetting) : 0);
      setNewStartingBalance(balanceSetting ? balanceSetting.toString() : '0');
      setFinanceConfig(configData || null);
      if (configData?.currency_config?.base_currency) {
        setNewTransaction((prev) => ({
          ...prev,
          currency: configData.currency_config.base_currency,
        }));
      }

      // Initialize Audit Engine with configured COA
      const accounts = configData?.accounting_standard 
        ? getCOATemplate(configData.accounting_standard)
        : undefined;
      const auditEngineInstance = new TallyEngineWithAudit(accounts);
      const auditBankAccount = auditEngineInstance.getAllAccounts().find(a => 
        a.id === 'acc_bank' || a.code === '1020' || a.code === '1010'
      );
      if (auditBankAccount) {
        auditBankAccount.opening_balance = balanceSetting ? parseFloat(balanceSetting) : 0;
      }

      transactionsData.forEach(t => {
        if (t.type === 'income') {
          auditEngineInstance.recordIncome(t.amount, t.date, t.description, t.id, 'acc_bank', {
            currency: t.currency as CurrencyCode | undefined,
            exchange_rate: t.exchange_rate,
            tax_rate_id: t.tax_rate_id,
          });
        } else {
          auditEngineInstance.recordExpense(t.amount, t.date, t.description, t.id, 'acc_supplies', {
            currency: t.currency as CurrencyCode | undefined,
            exchange_rate: t.exchange_rate,
            tax_rate_id: t.tax_rate_id,
          });
        }
      });

      invoicesData.filter(inv => inv.status === 'paid').forEach(inv => {
        auditEngineInstance.recordIncome(inv.amount, inv.paid_at || inv.updated_at, `Invoice #${inv.invoice_number}`, inv.id);
      });

      setAuditEngine(auditEngineInstance);

      // Initialize Statutory Report Generator
      if (configData && configData.enable_statutory_reports) {
        const generator = new StatutoryReportGenerator(auditEngineInstance, configData as FinanceConfiguration);
        setReportGenerator(generator);
      }
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    const balance = parseFloat(newStartingBalance);
    if (isNaN(balance)) {
      toast.error('Invalid balance amount');
      return;
    }
    setSaving(true);
    const success = await setSystemSetting('finance_starting_balance', balance);
    if (success) {
      setStartingBalance(balance);
      setIsBalanceEditOpen(false);
      toast.success('Starting balance updated');
    } else {
      toast.error('Failed to update balance');
    }
    setSaving(false);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const success = await createTransaction({
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category,
        type: newTransaction.type,
        date: newTransaction.date,
        attachment_url: newTransaction.attachment_url || undefined,
        tax_rate_id: newTransaction.tax_rate_id && newTransaction.tax_rate_id !== 'none'
          ? newTransaction.tax_rate_id
          : undefined,
        currency: newTransaction.currency || financeConfig?.currency_config?.base_currency || 'USD',
        exchange_rate: newTransaction.exchange_rate ? parseFloat(newTransaction.exchange_rate) : undefined,
        created_by: user!.id,
      });

      if (success) {
        toast.success('Transaction added successfully');
        setIsAddOpen(false);
        setNewTransaction({
          amount: '',
          description: '',
          category: 'General',
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          attachment_url: '',
          tax_rate_id: undefined,
          currency: financeConfig?.currency_config?.base_currency || 'USD',
          exchange_rate: '1',
        });
        fetchData();
      } else {
        toast.error('Failed to add transaction');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      const success = await deleteTransaction(id);
      if (success) {
        toast.success('Transaction deleted');
        fetchData();
      } else {
        toast.error('Failed to delete transaction');
      }
    }
  };

  const downloadStatutoryReport = (type: 'GSTR1' | 'GSTR3B' | 'VAT') => {
    if (!reportGenerator || !auditEngine) {
      toast.error('Report generator not initialized');
      return;
    }

    const from = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    try {
      let report;
      let filename;
      let content;

      switch (type) {
        case 'GSTR1':
          report = reportGenerator.generateGSTR1(from, to);
          filename = `GSTR1_${from}_${to}.json`;
          content = reportGenerator.exportJSON(report);
          break;
        case 'GSTR3B':
          report = reportGenerator.generateGSTR3B(from, to);
          filename = `GSTR3B_${from}_${to}.json`;
          content = reportGenerator.exportJSON(report);
          break;
        case 'VAT':
          report = reportGenerator.generateVATReturn(from, to);
          filename = `VAT_Return_${from}_${to}.json`;
          content = reportGenerator.exportJSON(report);
          break;
      }

      const element = document.createElement('a');
      element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success(`${type} report downloaded successfully`);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handleExportAudit = () => {
    if (!auditEngine) return;

    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    const from = fromDate.toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    const report = auditEngine.generateAuditReport(from, to);
    const jsonString = auditEngine.exportAuditReportJSON(report);
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));
    element.setAttribute('download', `audit-report-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Audit report exported successfully');
  };

  const baseCurrency = (financeConfig?.currency_config?.base_currency || 'USD') as CurrencyCode;
  const getBaseAmount = (t: Transaction) => t.exchange_rate ? t.amount * t.exchange_rate : t.amount;
  const totalInvoiceRevenue = useMemo(() => (invoices ?? [])
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0), [invoices]);

  const manualIncome = useMemo(() => (transactions ?? [])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + getBaseAmount(t), 0), [transactions]);

  const totalExpenses = useMemo(() => (transactions ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + getBaseAmount(t), 0), [transactions]);

  const totalRevenue = useMemo(() => totalInvoiceRevenue + manualIncome, [totalInvoiceRevenue, manualIncome]);

  const currentBalance = useMemo(() => startingBalance + totalRevenue - totalExpenses, [startingBalance, totalRevenue, totalExpenses]);

  const pendingRevenue = useMemo(() => (invoices ?? [])
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0), [invoices]);

  const combinedTransactions = useMemo(() => {
    const combined = [...transactions];
    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        combined.push({
          id: inv.id,
          amount: inv.amount,
          type: 'income',
          description: `Invoice #${inv.invoice_number}`,
          category: 'Project Revenue',
          date: inv.paid_at || inv.updated_at,
          created_by: 'system',
          created_at: inv.created_at,
          updated_at: inv.updated_at
        } as Transaction);
      }
    });
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, invoices]);

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
              {financeConfig?.accounting_standard && (
                <Badge variant="outline">
                  {financeConfig.accounting_standard}
                </Badge>
              )}
              {financeConfig?.tax_config?.regime && financeConfig.tax_config.regime !== 'NONE' && (
                <Badge variant="outline">
                  {financeConfig.tax_config.regime}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Manage company cash flow and records</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/admin/finance/settings">
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Dialog open={isBalanceEditOpen} onOpenChange={setIsBalanceEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Pencil className="h-4 w-4 mr-2" />
                  Set Balance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Starting Account Balance</DialogTitle>
                  <DialogDescription>
                    This amount will be added to your calculated revenue to determine the current balance.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startingBalance">Starting Balance ($)</Label>
                    <Input
                      id="startingBalance"
                      type="number"
                      step="0.01"
                      value={newStartingBalance}
                      onChange={(e) => setNewStartingBalance(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBalanceEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateBalance} disabled={saving}>Save Balance</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new income or expense entry.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(val: TransactionType) => setNewTransaction({ ...newTransaction, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income (+)</SelectItem>
                        <SelectItem value="expense">Expense (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Server Costs, Project Payment"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Details about this transaction"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                  </div>

                  {/* Tax Rate Selection */}
                  {(financeConfig?.tax_config?.enable_tax_tracking ?? financeConfig?.features?.enable_tax_tracking) && (
                    <div className="grid gap-2">
                      <Label htmlFor="tax_rate">Tax Rate (Optional)</Label>
                      <Select
                        value={newTransaction.tax_rate_id}
                        onValueChange={(val) => setNewTransaction({ ...newTransaction, tax_rate_id: val })}
                      >
                        <SelectTrigger id="tax_rate">
                          <SelectValue placeholder="No tax" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Tax</SelectItem>
                          {financeConfig.tax_config?.rates?.map(rate => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {rate.name} ({rate.rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const rate = financeConfig.tax_config?.rates?.find(r => r.id === newTransaction.tax_rate_id);
                        if (!rate || !newTransaction.amount || newTransaction.tax_rate_id === 'none') return null;
                        return (
                          <p className="text-xs text-muted-foreground">
                            Tax Amount: {financeConfig.currency_config?.base_currency ?
                              CURRENCY_SYMBOLS[financeConfig.currency_config.base_currency] : '$'}
                            {calculateTax(parseFloat(newTransaction.amount), rate).toFixed(2)}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* Currency Selection */}
                  {(financeConfig?.currency_config?.enable_multi_currency ?? financeConfig?.features?.enable_multi_currency) && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={newTransaction.currency}
                          onValueChange={(val) => setNewTransaction({ ...newTransaction, currency: val })}
                        >
                          <SelectTrigger id="currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">🇺🇸 USD</SelectItem>
                            <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                            <SelectItem value="INR">🇮🇳 INR</SelectItem>
                            <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                            <SelectItem value="AUD">🇦🇺 AUD</SelectItem>
                            <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                            <SelectItem value="JPY">🇯🇵 JPY</SelectItem>
                            <SelectItem value="CNY">🇨🇳 CNY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newTransaction.currency !== financeConfig.currency_config?.base_currency && (
                        <div className="grid gap-2">
                          <Label htmlFor="exchange_rate">Exchange Rate</Label>
                          <Input
                            id="exchange_rate"
                            type="number"
                            step="0.0001"
                            value={newTransaction.exchange_rate}
                            onChange={(e) => setNewTransaction({ ...newTransaction, exchange_rate: e.target.value })}
                            placeholder="1.0000"
                          />
                          <p className="text-xs text-muted-foreground">
                            1 {newTransaction.currency} = {newTransaction.exchange_rate} {financeConfig.currency_config?.base_currency}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label>Attachment (Receipt/Invoice)</Label>
                    <FileUploader
                      bucket="finance"
                      path={`transactions/${user?.id}`}
                      onUploadComplete={(url) => setNewTransaction({ ...newTransaction, attachment_url: url })}
                    />
                    {newTransaction.attachment_url && (
                      <p className="text-xs text-green-600 flex items-center">
                        <Paperclip className="h-3 w-3 mr-1" />
                        Attached Successfully
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddTransaction} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Transaction'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Current Balance"
            value={formatCurrency(currentBalance, baseCurrency)}
            description="Net Cash on Hand"
            icon={DollarSign}
            iconColor={currentBalance >= 0 ? "text-green-600" : "text-red-600"}
            iconBgColor={currentBalance >= 0 ? "bg-green-100" : "bg-red-100"}
            helpTerm="current_balance"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue, baseCurrency)}
            description="Invoices + Manual Income"
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            helpTerm="total_revenue"
          />
          <StatsCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses, baseCurrency)}
            description="Operational Costs"
            icon={TrendingDown}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            helpTerm="total_expenses"
          />
          <StatsCard
            title="Pending Revenue"
            value={formatCurrency(pendingRevenue, baseCurrency)}
            description="Awaiting Payment"
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
            helpTerm="pending_revenue"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full ${reportGenerator ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Financial Intelligence Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Transaction Ledger</span>
              <span className="sm:hidden">Ledger</span>
              <TermHelp term="transaction_ledger" />
            </TabsTrigger>
            {reportGenerator && (
              <TabsTrigger value="statutory" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Statutory Reports</span>
                <span className="sm:hidden">Reports</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Memoized Audit Report Generation */}
          {useMemo(() => {
            if (!auditEngine) return null;
            
            const from = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
            const to = new Date().toISOString().split('T')[0];
            
            return (
              <>
                {/* Audit Report Tab - Comprehensive Financial Audit */}
                <TabsContent value="audit" className="space-y-4">
                  <AuditReportDashboard 
                    report={auditEngine.generateAuditReport(from, to)}
                    chartData={auditEngine.generateChartData(from, to)}
                    onExport={handleExportAudit}
                  />
                </TabsContent>
              </>
            );
          }, [auditEngine, handleExportAudit])}

          {/* Fallback Audit Report Tab - Comprehensive Financial Audit */}
          {!auditEngine && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Loading intelligence engine...
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Original placeholder removed - now using condition above */}

          {/* Transactions Tab - Traditional view */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Transactions</CardTitle>
                <CardDescription>
                  Manual income and expense records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {combinedTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No transactions yet</p>
                    <p className="mb-4 text-sm">Add your first income or expense to get started.</p>
                    <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                      Schedule Transaction
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                Category <TermHelp term="transaction_category" />
                              </div>
                            </TableHead>
                            {(financeConfig?.tax_config?.enable_tax_tracking ?? financeConfig?.features?.enable_tax_tracking) && (
                              <TableHead className="hidden lg:table-cell">Tax Rate</TableHead>
                            )}
                            {(financeConfig?.tax_config?.enable_tax_tracking ?? financeConfig?.features?.enable_tax_tracking) && (
                              <TableHead className="hidden xl:table-cell text-right">Tax Amount</TableHead>
                            )}
                            {(financeConfig?.currency_config?.enable_multi_currency ?? financeConfig?.features?.enable_multi_currency) && (
                              <TableHead className="hidden lg:table-cell">Currency</TableHead>
                            )}
                            <TableHead className="hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                Type <TermHelp term="transaction_type" />
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {combinedTransactions.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="font-medium">{t.description}</div>
                                <div className="text-xs text-muted-foreground md:hidden">{t.category}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{t.category}</TableCell>
                              {(financeConfig?.tax_config?.enable_tax_tracking ?? financeConfig?.features?.enable_tax_tracking) && (
                                <TableCell className="hidden lg:table-cell">
                                  {t.tax_rate_id ? t.tax_rate_id.replace('_', ' ').toUpperCase() : '—'}
                                </TableCell>
                              )}
                              {(financeConfig?.tax_config?.enable_tax_tracking ?? financeConfig?.features?.enable_tax_tracking) && (
                                <TableCell className="hidden xl:table-cell text-right text-muted-foreground">
                                  {(() => {
                                    if (!t.tax_rate_id) return '—';
                                    const rate = financeConfig?.tax_config?.rates?.find(r => r.id === t.tax_rate_id);
                                    if (!rate) return '—';
                                    return formatCurrency(
                                      calculateTax(t.amount, rate),
                                      (t.currency || baseCurrency) as CurrencyCode
                                    );
                                  })()}
                                </TableCell>
                              )}
                              {(financeConfig?.currency_config?.enable_multi_currency ?? financeConfig?.features?.enable_multi_currency) && (
                                <TableCell className="hidden lg:table-cell">
                                  {t.currency || baseCurrency}
                                </TableCell>
                              )}
                              <TableCell className="hidden sm:table-cell">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium uppercase",
                                  t.type === 'income' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                  {t.type}
                                </span>
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-bold whitespace-nowrap",
                                t.type === 'income' ? "text-green-600" : "text-red-600"
                              )}>
                                {t.type === 'income' ? '+' : '-'}
                                {formatCurrency(t.amount, (t.currency || baseCurrency) as CurrencyCode)}
                                {t.currency && t.currency !== baseCurrency && t.exchange_rate && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(t.amount * t.exchange_rate, baseCurrency)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {t.attachment_url && (
                                    <Button variant="ghost" size="icon" asChild title="View Attachment">
                                      <a href={t.attachment_url} target="_blank" rel="noopener noreferrer">
                                        <Paperclip className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  )}
                                  {/* Only allow deleting manual transactions, not invoices mapped as transactions */}
                                  {!t.description.startsWith('Invoice #') && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)} title="Delete">
                                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {reportGenerator && (
            <TabsContent value="statutory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statutory Reports</CardTitle>
                  <CardDescription>
                    Generate compliant filings based on your configured tax regime.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {financeConfig?.accounting_standard && (
                      <Badge variant="secondary">Standard: {financeConfig.accounting_standard}</Badge>
                    )}
                    {financeConfig?.tax_config?.regime && (
                      <Badge variant="secondary">Tax: {financeConfig.tax_config.regime}</Badge>
                    )}
                    {financeConfig?.currency_config?.base_currency && (
                      <Badge variant="secondary">Base: {financeConfig.currency_config.base_currency}</Badge>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {financeConfig?.tax_config?.regime === 'GST_INDIA' && (
                      <>
                        <Button onClick={() => downloadStatutoryReport('GSTR1')} className="justify-start gap-2">
                          <FileDown className="h-4 w-4" />
                          Download GSTR-1
                        </Button>
                        <Button onClick={() => downloadStatutoryReport('GSTR3B')} className="justify-start gap-2">
                          <FileDown className="h-4 w-4" />
                          Download GSTR-3B
                        </Button>
                      </>
                    )}
                    {financeConfig?.tax_config?.regime === 'VAT_EU' && (
                      <Button onClick={() => downloadStatutoryReport('VAT')} className="justify-start gap-2">
                        <FileDown className="h-4 w-4" />
                        Download VAT Return
                      </Button>
                    )}
                    {financeConfig?.tax_config?.regime === 'SALES_TAX_US' && (
                      <div className="text-sm text-muted-foreground">
                        Sales tax reporting is not configured yet for automated exports.
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reports are generated from current ledger data and exported as JSON.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardShell>
  );
}
