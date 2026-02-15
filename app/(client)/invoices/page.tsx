'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getInvoices } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  RefreshCcw,
  ChevronRight,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/db/types';

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices(user?.id);
      setInvoices(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i =>
      i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-accent-purple" />
          <p className="font-bold text-muted-foreground">Syncing Ledger...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Settlements</h1>
            <p className="text-muted-foreground font-medium">Review your project invoices and payment history.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100/20 shadow-sm">
              <Lock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Secure Portal</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-2xl font-bold text-foreground">Records</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium placeholder:text-muted-foreground/50 focus-visible:ring-accent-purple/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredInvoices.map(inv => (
              <Card key={inv.id} className="rounded-4xl border-border/60 shadow-sm bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="p-8 md:w-1/4 bg-primary/5 flex flex-col justify-center border-r border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Invoice Number</p>
                    <p className="text-2xl font-bold text-foreground mt-1">#{inv.invoice_number}</p>
                    <Badge className={cn(
                      "w-fit mt-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-none",
                      inv.status === 'paid' ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"
                    )}>
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Project: {inv.project?.title || 'System Service'}</p>
                      <p className="text-xs text-muted-foreground">Issued on {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Amount</p>
                      <p className="text-3xl font-black text-foreground tracking-tight">${Number(inv.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-xl border-border font-bold h-10 hover:bg-muted">
                        Download PDF
                      </Button>
                      {inv.status !== 'paid' && (
                        <Button className="rounded-xl bg-primary text-primary-foreground font-bold h-10 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredInvoices.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-4xl bg-muted/20">
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No invoices found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}