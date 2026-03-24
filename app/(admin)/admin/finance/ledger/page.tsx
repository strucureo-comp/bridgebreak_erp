'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAccounts, getJournalEntries, createAccount, createJournalEntry, deleteAccount, deleteJournalEntry } from '@/lib/api';
import { useCurrency } from '@/lib/hooks/use-currency';
import { toast } from 'sonner';

type AccountForm = { code: string; name: string; type: string };
type JournalForm = { description: string; accountCode: string; debit: number; credit: number };

export default function FinanceLedgerPage() {
  const { format: fmt } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [accountForm, setAccountForm] = useState<AccountForm>({ code: '', name: '', type: 'asset' });
  const [journalForm, setJournalForm] = useState<JournalForm>({ description: '', accountCode: '', debit: 0, credit: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const [acc, je] = await Promise.all([getAccounts(), getJournalEntries()]);
      setAccounts(Array.isArray(acc) ? acc : []);
      setJournals(Array.isArray(je) ? je : []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totals = useMemo(() => {
    const assets = accounts.filter((a) => a.type === 'asset').length;
    const liabilities = accounts.filter((a) => a.type === 'liability').length;
    const equity = accounts.filter((a) => a.type === 'equity').length;
    const entries = journals.length;
    return { assets, liabilities, equity, entries };
  }, [accounts, journals]);

  const submitAccount = async () => {
    if (!accountForm.code || !accountForm.name) {
      toast.error('Account code and name are required');
      return;
    }

    try {
      await createAccount(accountForm);
      toast.success('Account created');
      setAccountForm({ code: '', name: '', type: 'asset' });
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create account');
    }
  };

  const submitJournal = async () => {
    if (!journalForm.description || !journalForm.accountCode) {
      toast.error('Description and account are required');
      return;
    }

    if (Number(journalForm.debit) <= 0 && Number(journalForm.credit) <= 0) {
      toast.error('Enter debit or credit amount');
      return;
    }

    try {
      await createJournalEntry({
        description: journalForm.description,
        lines: [
          {
            accountCode: journalForm.accountCode,
            description: journalForm.description,
            debit: Number(journalForm.debit || 0),
            credit: Number(journalForm.credit || 0),
          },
        ],
      });
      toast.success('Journal entry posted');
      setJournalForm({ description: '', accountCode: '', debit: 0, credit: 0 });
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post journal entry');
    }
  };

  const removeAccount = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    try {
      const ok = await deleteAccount(id);
      if (!ok) {
        toast.error('Failed to delete account');
        return;
      }
      toast.success('Account deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete account');
    }
  };

  const removeJournal = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      const ok = await deleteJournalEntry(id);
      if (!ok) {
        toast.error('Failed to delete journal entry');
        return;
      }
      toast.success('Journal entry deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete journal entry');
    }
  };

  return (
    <DashboardShell requireAdmin>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <div className="border-b pb-5">
          <h1 className="text-2xl font-semibold">General Ledger</h1>
          <p className="text-sm text-muted-foreground">Live chart of accounts and journal entries from backend APIs.</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Asset Accounts</p><p className="text-2xl font-semibold">{totals.assets}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Liability Accounts</p><p className="text-2xl font-semibold">{totals.liabilities}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Equity Accounts</p><p className="text-2xl font-semibold">{totals.equity}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Journal Entries</p><p className="text-2xl font-semibold">{totals.entries}</p></CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Add Account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Code</Label><Input value={accountForm.code} onChange={(e) => setAccountForm((p) => ({ ...p, code: e.target.value }))} /></div>
                <div className="col-span-2"><Label>Name</Label><Input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} /></div>
              </div>
              <div><Label>Type</Label><Input value={accountForm.type} onChange={(e) => setAccountForm((p) => ({ ...p, type: e.target.value }))} /></div>
              <Button onClick={submitAccount}>Create Account</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Post Journal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Description</Label><Input value={journalForm.description} onChange={(e) => setJournalForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Account Code</Label><Input value={journalForm.accountCode} onChange={(e) => setJournalForm((p) => ({ ...p, accountCode: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Debit</Label><Input type="number" value={journalForm.debit} onChange={(e) => setJournalForm((p) => ({ ...p, debit: Number(e.target.value || 0) }))} /></div>
                <div><Label>Credit</Label><Input type="number" value={journalForm.credit} onChange={(e) => setJournalForm((p) => ({ ...p, credit: Number(e.target.value || 0) }))} /></div>
              </div>
              <Button onClick={submitJournal}>Post Entry</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts found.</p>
            ) : (
              <div className="space-y-2">
                {accounts.slice(0, 20).map((a) => (
                  <div key={a.id || a._id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{a.code} - {a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeAccount(a.id || a._id)}>Delete</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Journal Entries</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : journals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No journal entries found.</p>
            ) : (
              <div className="space-y-2">
                {journals.slice(0, 20).map((j) => (
                  <div key={j.id || j._id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{j.description || 'Journal Entry'}</p>
                      <p className="text-xs text-muted-foreground">{j.date || j.createdAt || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{fmt(Number(j.amount || j.total || 0))}</p>
                      <Button variant="outline" size="sm" onClick={() => removeJournal(j.id || j._id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
