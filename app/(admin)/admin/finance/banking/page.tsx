'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Building2, Search, ArrowUpRight, ArrowDownRight,
  Loader2, Wallet, Landmark, ArrowRightLeft, CheckCircle2,
  Lock, ShieldCheck, ScrollText, BarChart3, AlertCircle, Calendar, RefreshCcw, FileText,
  Download, Upload, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/hooks/use-currency';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancePageHeader } from '@/components/finance/FinancePageHeader';

import type { BankAccount, BankTransaction, BankTransfer, BankReconciliation, AuditLog } from '@/lib/db/types';

const STORAGE_KEY = 'bb_enterprise_banking_v1';

export default function BankingEnterprisePage() {
  const { user } = useAuth();
  const { format: fmtCurrency } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  // Core Data States
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState('accounts');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setAccounts(parsed.accounts || []);
        setTransactions(parsed.transactions || []);
        setTransfers(parsed.transfers || []);
        setReconciliations(parsed.reconciliations || []);
        setAuditLogs(parsed.auditLogs || []);
      } catch (e) { console.error('Failed to parse banking data', e); }
    }
  }, []);

  const saveState = (newState: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setAccounts(newState.accounts);
    setTransactions(newState.transactions);
    setTransfers(newState.transfers);
    setReconciliations(newState.reconciliations);
    setAuditLogs(newState.auditLogs);
  };

  const addAuditLog = (action: string, entity_type: string, entity_id: string, state: any) => {
    const log: AuditLog = {
      id: `adt-${Date.now()}`,
      action: action as any,
      entity_type,
      entity_id,
      user_id: user?.id || 'sys-user',
      user_name: user?.full_name || 'System Admin',
      user_role: user?.role || 'admin',
      created_at: new Date().toISOString()
    };
    state.auditLogs = [log, ...(state.auditLogs || [])];
  };

  // --- ACTIONS ---

  const handleAddAccount = (acc: Partial<BankAccount>) => {
    const newAcc: BankAccount = {
      ...acc,
      id: `acc-${Date.now()}`,
      current_balance: Number(acc.current_balance || 0),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    } as BankAccount;

    const state = { accounts, transactions, transfers, reconciliations, auditLogs };
    state.accounts = [...accounts, newAcc];

    // Auto-generate opening balance journal entry mock
    if (newAcc.current_balance > 0) {
      const obTx: BankTransaction = {
        id: `tx-ob-${Date.now()}`,
        bank_account_id: newAcc.id,
        transaction_date: acc.opening_balance_date || new Date().toISOString().split('T')[0],
        amount: newAcc.current_balance,
        type: 'deposit',
        category: 'Opening Balance',
        status: 'posted',
        posting_status: 'posted',
        notes: 'Initial Opening Balance Entry',
        created_at: new Date().toISOString(),
      };
      state.transactions = [obTx, ...state.transactions];
      addAuditLog('post', 'BankTransaction', obTx.id, state);
    }

    addAuditLog('create', 'BankAccount', newAcc.id, state);
    saveState(state);
    toast.success('Enterprise Account Created');
    setIsAccountOpen(false);
  };

  const handleAddTransaction = (tx: Partial<BankTransaction>) => {
    const newTx: BankTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      amount: Number(tx.amount || 0),
      created_at: new Date().toISOString(),
      status: tx.posting_status === 'posted' ? 'posted' : 'draft',
    } as BankTransaction;

    const state = { accounts: [...accounts], transactions, transfers, reconciliations, auditLogs };

    // If posting immediately, update balance
    if (newTx.posting_status === 'posted') {
      const idx = state.accounts.findIndex(a => a.id === newTx.bank_account_id);
      if (idx !== -1) {
        if (newTx.type === 'deposit') state.accounts[idx].current_balance += newTx.amount;
        else {
          if (state.accounts[idx].current_balance - newTx.amount < 0) {
            toast.error('Negative balance not allowed. Transaction failed.');
            return;
          }
          state.accounts[idx].current_balance -= newTx.amount;
        }
      }
    }

    state.transactions = [newTx, ...state.transactions];
    addAuditLog('create', 'BankTransaction', newTx.id, state);
    if (newTx.posting_status === 'posted') addAuditLog('post', 'BankTransaction', newTx.id, state);

    saveState(state);
    toast.success(`Transaction ${newTx.posting_status === 'posted' ? 'Posted' : 'Drafted'}`);
    setIsTxOpen(false);
  };

  const handlePostTransaction = (id: string) => {
    const state = { accounts: [...accounts], transactions: [...transactions], transfers, reconciliations, auditLogs };
    const txMatch = state.transactions.find(t => t.id === id);
    if (!txMatch || txMatch.posting_status === 'posted') return;

    const accMatch = state.accounts.find(a => a.id === txMatch.bank_account_id);
    if (!accMatch) return;

    if (txMatch.type === 'withdrawal' && accMatch.current_balance - txMatch.amount < 0) {
      toast.error('Negative balance not allowed. Transaction cannot be posted.');
      return;
    }

    txMatch.posting_status = 'posted';
    txMatch.status = 'posted';
    txMatch.posting_date = new Date().toISOString().split('T')[0];

    if (txMatch.type === 'deposit') accMatch.current_balance += txMatch.amount;
    else accMatch.current_balance -= txMatch.amount;

    addAuditLog('post', 'BankTransaction', txMatch.id, state);
    saveState(state);
    toast.success('Transaction successfully posted');
  };

  // --- COMPUTATIONS ---
  const totalLiquidity = useMemo(() => accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0), [accounts]);

  const inflow = useMemo(() => transactions.filter(t => t.type === 'deposit' && t.posting_status === 'posted').reduce((s, t) => s + t.amount, 0), [transactions]);
  const outflow = useMemo(() => transactions.filter(t => t.type === 'withdrawal' && t.posting_status === 'posted').reduce((s, t) => s + t.amount, 0), [transactions]);
  const pendingTxs = useMemo(() => transactions.filter(t => t.posting_status === 'draft').length, [transactions]);

  if (!isMounted) return null;

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 pb-8 max-w-[1400px] mx-auto">
        <FinancePageHeader
          title="Enterprise Banking & Cash"
          subtitle="IFRS/GAAP Compliant Accounting Module"
          icon={Landmark}
          actions={
            <div className="flex items-center gap-2">
              <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-[11px] h-8 border-red-200 hover:bg-red-50 text-red-700">
                    <Building2 className="h-3.5 w-3.5" /> New Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <EnterpriseAccountForm onSuccess={handleAddAccount} />
                </DialogContent>
              </Dialog>
              <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-[11px] h-8 shadow-sm">
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Record Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <EnterpriseTransactionForm accounts={accounts} onSuccess={handleAddTransaction} />
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {/* Global KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Total Liquidity" value={fmtCurrency(totalLiquidity)} />
          <KpiCard label="Total Accounts" value={String(accounts.length)} />
          <KpiCard label="MTD Inflow" value={fmtCurrency(inflow)} delta="Trending" positive={true} />
          <KpiCard label="MTD Outflow" value={fmtCurrency(outflow)} delta="Trending" positive={false} />
          <Card className="border-red-100 bg-red-50/50 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <span className="text-[11px] font-medium text-red-600 mb-1">Draft Entries</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-red-900">{pendingTxs}</span>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-xl shadow-sm border p-1 border-muted">
          <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none mb-4 gap-4 overflow-x-auto">
            <TabsTrigger value="accounts" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-xs gap-2">
              <Wallet className="h-4 w-4" /> Master Accounts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-xs gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-xs gap-2">
              <ShieldCheck className="h-4 w-4" /> Reconciliation
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-xs gap-2">
              <ScrollText className="h-4 w-4" /> Audit Trail
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md px-4 py-2 text-xs gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <div className="p-4 pt-0">
            {/* ACCOUNTS TAB */}
            <TabsContent value="accounts" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accounts.length === 0 ? (
                  <div className="col-span-full py-20 text-center border rounded-xl bg-muted/20 border-dashed">
                    <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium">No Master Accounts Found</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Configure an Enterprise bank account to begin tracking.</p>
                  </div>
                ) : accounts.map(acc => (
                  <Card key={acc.id} className="border hover:border-red-200 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                            {acc.type === 'petty_cash' ? <Wallet className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{acc.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{acc.bank_name || 'Cash Equivalent'} • {acc.currency}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] uppercase",
                          acc.status === 'active' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                            acc.status === 'frozen' ? "border-amber-200 text-amber-700 bg-amber-50" : "border-slate-200"
                        )}>
                          {acc.status}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end p-3 rounded-lg bg-slate-50 border">
                          <span className="text-[11px] text-slate-500 font-medium">Book Balance</span>
                          <span className="text-lg font-black text-slate-900">{fmtCurrency(Number(acc.current_balance))}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white border rounded p-2">
                            <p className="text-slate-400 mb-0.5">Account / IBAN</p>
                            <p className="font-mono text-slate-700 truncate">{acc.iban_swift || acc.account_number || 'N/A'}</p>
                          </div>
                          <div className="bg-white border rounded p-2">
                            <p className="text-slate-400 mb-0.5">GL Mapping</p>
                            <p className="font-mono text-slate-700 truncate">{acc.gl_bank_account_id || 'Pending Config'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TRANSACTIONS TAB */}
            <TabsContent value="transactions" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by reference, category or notes..."
                    className="pl-9 h-8 text-xs bg-slate-50"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2"><Download className="h-3 w-3" /> Export CSV</Button>
              </div>

              <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {transactions
                      .filter(t => (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.reference_no || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{tx.transaction_date}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{tx.category || 'Uncategorized'}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{tx.notes}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px]">{tx.reference_no || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {accounts.find(a => a.id === tx.bank_account_id)?.name || 'Unknown'}
                          </td>
                          <td className={cn("px-4 py-3 text-right font-bold", tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-800')}>
                            {tx.type === 'deposit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {tx.posting_status === 'posted' ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] gap-1">
                                <Lock className="h-2.5 w-2.5" /> Posted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] gap-1">
                                <AlertCircle className="h-2.5 w-2.5" /> Draft
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {tx.posting_status !== 'posted' && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                onClick={() => handlePostTransaction(tx.id)}
                              >
                                Post Entry
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-500">No transactions recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* RECONCILIATION TAB */}
            <TabsContent value="reconciliation" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="border rounded-xl border-dashed bg-slate-50/50 p-16 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                  <RefreshCcw className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Bank Reconciliation Engine</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 mb-6">Upload an MT940 or CSV bank statement to automatically match against your internal book ledger.</p>
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 h-9 text-xs shadow-sm">
                  <Upload className="h-3.5 w-3.5" /> Import Statement
                </Button>
              </div>
            </TabsContent>

            {/* AUDIT TAB */}
            <TabsContent value="audit" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Entity ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono">
                        <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{log.user_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[9px] uppercase",
                            log.action === 'create' ? "border-blue-200 text-blue-700 bg-blue-50" :
                              log.action === 'post' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                "border-slate-200"
                          )}>{log.action}</Badge>
                        </td>
                        <td className="px-4 py-3">{log.entity_type}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400">{log.entity_id}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-500">No audit logs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="p-4 border-b bg-slate-50/50">
                    <CardTitle className="text-sm font-bold text-slate-800">Inflow vs Outflow Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 flex items-center justify-center min-h-[250px] text-slate-400 text-xs">
                    <div className="flex flex-col items-center">
                      <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                      Chart Rendering Pending Real Data
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="p-4 border-b bg-slate-50/50">
                    <CardTitle className="text-sm font-bold text-slate-800">Cash Position Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 flex items-center justify-center min-h-[250px] text-slate-400 text-xs">
                    <div className="flex flex-col items-center">
                      <Activity className="h-10 w-10 mb-3 opacity-20" />
                      Chart Rendering Pending Real Data
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </div>
        </Tabs>

      </div>
    </DashboardShell>
  );
}

// ==========================================
// ENTERPRISE FORMS
// ==========================================

function EnterpriseAccountForm({ onSuccess }: { onSuccess: (data: Partial<BankAccount>) => void }) {
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    name: '', type: 'current', currency: 'AED', status: 'active', current_balance: 0,
    gl_bank_account_id: 'GL-BANK-1000'
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.gl_bank_account_id) {
      toast.error("Account Name and GL Mapping are required.");
      return;
    }
    onSuccess(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">Master Bank Account</h3>
        <p className="text-[11px] text-slate-500 mt-2">Create a new GAAP compliant master account record.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Core Info */}
        <div className="col-span-2 space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Account Name (Description) <span className="text-red-500">*</span></Label>
          <Input className="h-9 text-xs bg-slate-50" placeholder="e.g. Emirates NBD Corporate Current" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Account Type</Label>
          <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current (Checking)</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="petty_cash">Petty Cash</SelectItem>
              <SelectItem value="credit_card">Credit Card Facility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Currency</Label>
          <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Banking Specifics */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">IBAN / SWIFT Code</Label>
          <Input className="h-9 text-xs font-mono bg-slate-50" placeholder="AE0000..." value={formData.iban_swift || ''} onChange={e => setFormData({ ...formData, iban_swift: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Bank Name</Label>
          <Input className="h-9 text-xs bg-slate-50" placeholder="e.g. ENBD" value={formData.bank_name || ''} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
        </div>

        {/* GL Configuration */}
        <div className="col-span-2 border-t pt-4 mt-2">
          <Label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Accounting & Control</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700">GL Account Mapping <span className="text-red-500">*</span></Label>
              <Input className="h-9 text-xs font-mono" placeholder="1000-XX" value={formData.gl_bank_account_id || ''} onChange={e => setFormData({ ...formData, gl_bank_account_id: e.target.value })} />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <Button variant="secondary" className="h-9 text-xs gap-2 justify-start bg-slate-100 text-slate-700 w-full" type="button">
                <Search className="h-3 w-3" /> Select from Chart of Accounts
              </Button>
            </div>
          </div>
        </div>

        {/* Opening Balance */}
        <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-xl">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-700">Opening Balance</Label>
            <Input type="number" className="h-9 text-xs text-right font-bold" value={formData.current_balance} onChange={e => setFormData({ ...formData, current_balance: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-700">As Of Date</Label>
            <Input type="date" className="h-9 text-xs" value={formData.opening_balance_date || ''} onChange={e => setFormData({ ...formData, opening_balance_date: e.target.value })} />
          </div>
          <div className="col-span-2 mt-1">
            <p className="text-[10px] text-slate-500 flex gap-1 items-start">
              <AlertCircle className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
              Entering an opening balance will automatically post an initial Journal Entry locked to this date. Cannot modify after period closes.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold h-10">
        Create Enterprise Account
      </Button>
    </div>
  );
}

function EnterpriseTransactionForm({ accounts, onSuccess }: { accounts: BankAccount[], onSuccess: (data: Partial<BankTransaction>) => void }) {
  const [formData, setFormData] = useState<Partial<BankTransaction>>({
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'deposit',
    amount: 0,
    posting_status: 'draft',
    payment_method: 'bank_transfer',
    category: 'General'
  });

  const handleSubmit = (action: 'draft' | 'posted') => {
    if (!formData.bank_account_id || !formData.amount || !formData.notes) {
      toast.error('Account, Amount, and Notes are strictly required for audit.');
      return;
    }
    const payload = { ...formData, posting_status: action };
    onSuccess(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">Record Payment / Receipt</h3>
        <p className="text-[11px] text-slate-500 mt-2">Structured entry requiring audit compliance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button className={cn("flex-1 text-xs font-bold py-2 rounded-md transition-all", formData.type === 'deposit' ? "bg-white shadow-sm text-emerald-700" : "text-slate-500")} onClick={() => setFormData({ ...formData, type: 'deposit' })}>Receipt (Inflow)</button>
            <button className={cn("flex-1 text-xs font-bold py-2 rounded-md transition-all", formData.type === 'withdrawal' ? "bg-white shadow-sm text-amber-700" : "text-slate-500")} onClick={() => setFormData({ ...formData, type: 'withdrawal' })}>Payment (Outflow)</button>
          </div>
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label className="text-[11px] font-bold text-slate-700">Bank / Cash Account <span className="text-red-500">*</span></Label>
          <Select value={formData.bank_account_id} onValueChange={v => setFormData({ ...formData, bank_account_id: v })}>
            <SelectTrigger className="h-9 text-xs bg-slate-50"><SelectValue placeholder="Select Ledger Account" /></SelectTrigger>
            <SelectContent>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} (Bal: {a.current_balance})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Date <span className="text-red-500">*</span></Label>
          <Input type="date" className="h-9 text-xs" value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Amount <span className="text-red-500">*</span></Label>
          <Input type="number" className="h-9 text-xs text-right font-bold text-lg text-slate-900" placeholder="0.00" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Payment Method</Label>
          <Select value={formData.payment_method} onValueChange={(v: any) => setFormData({ ...formData, payment_method: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank Transfer / Wire</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Corporate Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Reference / Cheque No.</Label>
          <Input className="h-9 text-xs font-mono" placeholder="TRX-1029..." value={formData.reference_no || ''} onChange={e => setFormData({ ...formData, reference_no: e.target.value })} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Counterparty (Vendor/Customer)</Label>
          <Input className="h-9 text-xs bg-slate-50" placeholder="Required for compliance..." value={formData.counterparty || ''} onChange={e => setFormData({ ...formData, counterparty: e.target.value })} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Narration / Notes <span className="text-red-500">*</span></Label>
          <Input className="h-9 text-xs" placeholder="Explanation for audit log..." value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => handleSubmit('draft')} className="flex-1 text-xs h-10 border-slate-300 text-slate-700 font-bold hover:bg-slate-50">
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit('posted')} className={cn("flex-1 text-xs h-10 text-white font-bold shadow-sm gap-2", formData.type === 'deposit' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
          <Lock className="h-3.5 w-3.5" /> Post Immediately
        </Button>
      </div>
      <p className="text-[9px] text-center text-slate-400 mt-2">Posted entries immediately affect account balances and generate Journal Entries.</p>
    </div>
  );
}
