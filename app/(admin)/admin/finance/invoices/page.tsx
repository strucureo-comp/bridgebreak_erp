'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Trash2, Plus, FileText, Search, CreditCard, ChevronRight } from 'lucide-react';
import { getInvoices, deleteInvoice } from '@/lib/api';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/db/types';

export default function AdminInvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently delete this invoice?')) {
      try {
        await deleteInvoice(id);
        toast.success('Invoice deleted');
        fetchData();
      } catch { toast.error('Delete failed'); }
    }
  };

  if (loading) return null;

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage client billing and receivables.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-9 h-10 w-64 border-border bg-background"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={() => router.push('/admin/finance/invoices/new')} size="sm" className="h-10 gap-2 font-bold shadow-sm">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-card border border-border rounded-lg shadow-sm divide-y divide-border">
          {filteredInvoices.map(inv => (
            <div key={inv.id} onClick={() => router.push(`/admin/finance/invoices/${inv.id}`)} className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-foreground">{inv.invoice_number}</h3>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      inv.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-none" :
                        inv.status === 'overdue' ? "bg-rose-50 text-rose-600 border-none" :
                          "bg-amber-50 text-amber-600 border-none"
                    )}>
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inv.project?.title || 'General Service'} • Due {new Date(inv.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDelete(e, inv.id)}>
                    <Trash2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="py-16 text-center">
              <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-bold text-foreground">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-1">Create a new invoice to get started.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}