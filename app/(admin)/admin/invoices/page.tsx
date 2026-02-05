'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Trash2, Plus, FileText, Search, Filter, RefreshCcw, CreditCard, Clock, CheckCircle2, AlertCircle, ChevronRight, ArrowUpRight } from 'lucide-react';
import { getInvoices, deleteInvoice } from '@/lib/api';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const stats = useMemo(() => ({
    total: invoices.reduce((s, i) => s + Number(i.amount), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0),
    pending: invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0),
    overdue: invoices.filter(i => i.status === 'overdue').length
  }), [invoices]);

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
        toast.success('Invoice removed');
        fetchData();
      } catch { toast.error('Delete failed'); }
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Accessing Billing Records...</p>
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
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Billing & Invoices</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Manage client settlements and receivables
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/admin/invoices/new')} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
              <Plus className="h-5 w-5 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid gap-6 md:grid-cols-4">
            <InvoiceKPI title="Total Billed" value={`$${(stats.total/1000).toFixed(1)}k`} icon={FileText} color="slate" />
            <InvoiceKPI title="Paid Amount" value={`$${(stats.paid/1000).toFixed(1)}k`} icon={CheckCircle2} color="emerald" />
            <InvoiceKPI title="Outstanding" value={`$${(stats.pending/1000).toFixed(1)}k`} icon={Clock} color="amber" />
            <InvoiceKPI title="Overdue" value={stats.overdue} icon={AlertCircle} color="rose" />
        </div>

        {/* Invoice List */}
        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Registry</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search invoice or project..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6">
                {filteredInvoices.map(inv => (
                    <Card key={inv.id} onClick={() => router.push(`/admin/invoices/${inv.id}`)} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                                <div className="p-8 md:w-1/4 bg-slate-50/50 flex flex-col justify-center border-r border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice No.</p>
                                    <h3 className="text-xl font-black text-slate-900">{inv.invoice_number}</h3>
                                    <Badge className={cn(
                                        "w-fit mt-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                        inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" : inv.status === 'overdue' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                        {inv.status}
                                    </Badge>
                                </div>
                                <div className="p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Project</p>
                                        <h4 className="text-lg font-bold text-slate-900">{inv.project?.title || 'General Service'}</h4>
                                        <p className="text-sm font-medium text-slate-400">Due on {new Date(inv.due_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Due</p>
                                            <p className="text-3xl font-black text-slate-900">${Number(inv.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDelete(e, inv.id)}>
                                                <Trash2 size={20} />
                                            </Button>
                                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredInvoices.length === 0 && (
                    <div className="py-24 text-center bg-white rounded-[3rem] shadow-sm">
                        <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No invoices identified</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function InvoiceKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
        slate: "bg-slate-50 text-slate-600 shadow-slate-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}