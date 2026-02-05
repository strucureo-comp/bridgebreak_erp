'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  getBankAccounts, 
  createBankAccount, 
  getBankTransactions, 
  createBankTransaction 
} from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Building2, 
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    ChevronRight,
    RefreshCcw,
    Wallet,
    Landmark,
    Info,
    ArrowRightLeft,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import type { BankAccount, BankTransaction } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function BankingPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Modal States
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') {
      fetchData();
    }
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

  const totalLiquidity = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  }, [accounts]);

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
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Syncing Bank Balances...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Banks & Cash</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Manage your company bank accounts and physical cash.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl border-slate-200 h-12 px-6 font-bold shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Link Account
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
                <AccountForm onSuccess={() => { setIsAccountOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-slate-900 h-12 px-8 font-bold shadow-xl shadow-slate-200">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Quick Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
                <TransactionForm accounts={accounts} onSuccess={() => { setIsTxOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global KPI Card */}
        <Card className="rounded-[3rem] border-none shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden p-12 relative group">
            <Landmark className="absolute -right-4 -bottom-4 h-48 w-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Total Cash in Hand</p>
                    <h2 className="text-6xl font-black tracking-tighter">${totalLiquidity.toLocaleString()}</h2>
                    <div className="flex items-center gap-3 pt-4">
                        <Badge className="bg-emerald-500 text-white border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">Verified</Badge>
                        <span className="text-sm text-slate-400 font-bold">Updated just now</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-12 md:border-l border-white/10 md:pl-12">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Links</p>
                        <p className="text-3xl font-black">{accounts.length}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Movements</p>
                        <p className="text-3xl font-black">{transactions.length}</p>
                    </div>
                </div>
            </div>
        </Card>

        {/* Account Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {accounts.map(acc => (
            <Card key={acc.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="h-14 w-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            {acc.type === 'cash' ? <Wallet className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
                        </div>
                        <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">{acc.type}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <div className="space-y-1 mb-8">
                        <h3 className="text-2xl font-black text-slate-900">{acc.name}</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">{acc.bank_name || 'Physical'}</p>
                    </div>
                    <div className="flex items-end justify-between p-6 bg-slate-50 rounded-[2rem] group-hover:bg-slate-100 transition-colors">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Balance</p>
                            <p className="text-3xl font-black text-slate-900">${Number(acc.current_balance).toLocaleString()}</p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && (
            <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[300px]">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No accounts linked</p>
                <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsAccountOpen(true)}>Add First Account</Button>
            </Card>
          )}
        </div>

        {/* Movement Table */}
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 ml-2">Record of Movements</h2>
            <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Activity</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Account</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Date</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-right">Value</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-24 text-center text-slate-300 font-bold uppercase tracking-widest italic text-[10px]">No activity identified</td></tr>
                            ) : filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                                                tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {tx.type === 'deposit' ? <ArrowUpRight className="h-6 w-6" strokeWidth={3} /> : <ArrowDownRight className="h-6 w-6" strokeWidth={3} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-slate-900 truncate max-w-[300px]">{tx.description}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.reference || 'INTERNAL'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8 text-sm font-bold text-slate-600">{tx.bank_account?.name}</td>
                                    <td className="p-8 text-sm font-bold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="p-8 text-right font-black text-lg">
                                        {tx.type === 'deposit' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                                    </td>
                                    <td className="p-8 text-center">
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {tx.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

// --- Forms ---

function AccountForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', account_number: '', bank_name: '', currency: 'USD', current_balance: '0', type: 'bank'
  });

  const handleSubmit = async () => {
    try {
      await createBankAccount(formData);
      toast.success('Account Link Established');
      onSuccess();
    } catch { toast.error('Failed to link account'); }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-3xl font-black tracking-tight">Link Account</h3>
        <p className="text-slate-500 font-medium">Add a new bank or cash vault.</p>
      </div>
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="font-bold ml-1">Account Label</Label>
          <Input placeholder="e.g. Corporate Current" className="h-12 rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="font-bold ml-1">Institution</Label>
                <Input placeholder="HSBC / Cash" className="h-12 rounded-2xl font-bold" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label className="font-bold ml-1">Account No.</Label>
                <Input placeholder="XXXX-XXXX" className="h-12 rounded-2xl font-bold font-mono" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
            </div>
        </div>
        <div className="space-y-2">
            <Label className="font-bold ml-1">Vault Type</Label>
            <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="bank">Commercial Bank</SelectItem>
                    <SelectItem value="cash">Physical Cash Reserve</SelectItem>
                    <SelectItem value="credit">Credit Line</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Link Vault</Button>
    </div>
  );
}

function TransactionForm({ accounts, onSuccess }: { accounts: BankAccount[], onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        bank_account_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'deposit',
        reference: ''
    });

    const handleSubmit = async () => {
        if (!formData.bank_account_id || !formData.amount) {
            toast.error('Complete all fields');
            return;
        }
        try {
            await createBankTransaction(formData);
            toast.success('Entry Recorded');
            onSuccess();
        } catch { toast.error('Record failed'); }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight">New Entry</h3>
                <p className="text-slate-500 font-medium">Record a movement of money.</p>
            </div>
            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label className="font-bold ml-1">Select Account</Label>
                    <Select value={formData.bank_account_id} onValueChange={v => setFormData({...formData, bank_account_id: v})}>
                        <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue placeholder="Choose account" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="font-bold ml-1">Direction</Label>
                        <div className="flex p-1 bg-slate-100 rounded-2xl">
                            <button className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all", formData.type === 'deposit' ? "bg-white shadow-sm text-emerald-600" : "text-slate-400")} onClick={() => setFormData({...formData, type: 'deposit'})}>IN</button>
                            <button className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all", formData.type === 'withdrawal' ? "bg-white shadow-sm text-rose-600" : "text-slate-400")} onClick={() => setFormData({...formData, type: 'withdrawal'})}>OUT</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold ml-1">Value</Label>
                        <Input type="number" placeholder="0.00" className="h-12 rounded-2xl font-black text-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="font-bold ml-1">Short Description</Label>
                    <Input placeholder="e.g. Petty cash refill" className="h-12 rounded-2xl font-bold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
            </div>
            <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Process Entry</Button>
        </div>
    );
}
