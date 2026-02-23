'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  getBankAccounts,
  createBankAccount,
  getBankTransactions,
  createBankTransaction
} from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Building2, Search, ArrowUpRight, ArrowDownRight,
  Loader2, Wallet, Landmark, ArrowRightLeft, CheckCircle2, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import type { BankAccount, BankTransaction } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/hooks/use-currency';

export default function BankingPage() {
  const { user } = useAuth();
  const { format: fmtCurrency } = useCurrency();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accData, txData] = await Promise.all([
        getBankAccounts(),
        getBankTransactions()
      ]);
      setAccounts(accData || []);
      setTransactions(txData || []);
    } catch (error) {
      console.error('Banking Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLiquidity = useMemo(() => accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.bank_account?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading bank data...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Banking & Cash</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Landmark className="h-3.5 w-3.5" />
              Manage bank accounts and cash movements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <AccountForm onSuccess={() => { setIsAccountOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
            <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <ArrowRightLeft className="h-3.5 w-3.5" /> New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <TransactionForm accounts={accounts} onSuccess={() => { setIsTxOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Balance</p>
                  <p className="text-2xl font-bold">{fmtCurrency(totalLiquidity)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Cash in hand across all accounts</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accounts</p>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Active bank & cash accounts</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Total movements recorded</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Cards */}
        {accounts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {accounts.map(acc => (
              <Card key={acc.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      {acc.type === 'cash' ? <Wallet className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <Badge variant="secondary" className="text-[9px] uppercase">{acc.type}</Badge>
                  </div>
                  <h3 className="text-sm font-bold">{acc.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">{acc.bank_name || 'Cash Account'}</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-[11px] text-muted-foreground">Balance</span>
                    <span className="text-sm font-bold">{fmtCurrency(Number(acc.current_balance))}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transactions Table */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-[15px] font-bold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" /> Transactions
              </CardTitle>
              <CardDescription className="text-[12px]">{filteredTransactions.length} movement{filteredTransactions.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-8 w-48 text-xs"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <ArrowRightLeft className="h-10 w-10 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No transactions</p>
                    <p className="text-[11px] text-muted-foreground">Record a new entry to get started.</p>
                  </div>
                </div>
              ) : filteredTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {tx.type === 'deposit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{tx.bank_account?.name}</span>
                        <span>·</span>
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={cn(
                      "text-sm font-bold",
                      tx.type === 'deposit' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.type === 'deposit' ? '+' : '-'}{fmtCurrency(Number(tx.amount))}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

// --- Forms ---
function AccountForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', account_number: '', bank_name: '', currency: 'AED', current_balance: '0', type: 'bank'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name) { toast.error('Enter account name'); return; }
    setSubmitting(true);
    try {
      await createBankAccount(formData);
      toast.success('Account added');
      onSuccess();
    } catch { toast.error('Failed'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold">Add Account</h3>
        <p className="text-sm text-muted-foreground">Link a bank or cash account.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Account Name *</Label>
          <Input placeholder="e.g. Corporate Current" className="h-9" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Bank Name</Label>
            <Input placeholder="HSBC / Cash" className="h-9" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Account No.</Label>
            <Input placeholder="XXXX-XXXX" className="h-9 font-mono" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Opening Balance</Label>
            <Input type="number" placeholder="0.00" className="h-9" value={formData.current_balance} onChange={e => setFormData({ ...formData, current_balance: e.target.value })} />
          </div>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {submitting ? 'Adding...' : 'Add Account'}
      </Button>
    </div>
  );
}

function TransactionForm({ accounts, onSuccess }: { accounts: BankAccount[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    bank_account_id: '', date: new Date().toISOString().split('T')[0],
    description: '', amount: '', type: 'deposit', reference: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.bank_account_id || !formData.amount) { toast.error('Fill required fields'); return; }
    setSubmitting(true);
    try {
      await createBankTransaction(formData);
      toast.success('Entry recorded');
      onSuccess();
    } catch { toast.error('Failed'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold">New Transaction</h3>
        <p className="text-sm text-muted-foreground">Record a money movement.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Account *</Label>
          <Select value={formData.bank_account_id} onValueChange={v => setFormData({ ...formData, bank_account_id: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Direction</Label>
            <div className="flex p-0.5 bg-muted rounded-md">
              <button className={cn("flex-1 py-1.5 text-xs font-medium rounded-sm transition-all", formData.type === 'deposit' ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground")} onClick={() => setFormData({ ...formData, type: 'deposit' })}>In</button>
              <button className={cn("flex-1 py-1.5 text-xs font-medium rounded-sm transition-all", formData.type === 'withdrawal' ? "bg-background shadow-sm text-rose-600" : "text-muted-foreground")} onClick={() => setFormData({ ...formData, type: 'withdrawal' })}>Out</button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Amount *</Label>
            <Input type="number" placeholder="0.00" className="h-9" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Input placeholder="e.g. Client payment" className="h-9" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
        {submitting ? 'Recording...' : 'Record Entry'}
      </Button>
    </div>
  );
}
