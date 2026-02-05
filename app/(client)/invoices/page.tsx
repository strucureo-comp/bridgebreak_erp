'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getInvoices } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    FileText, 
    Search, 
    RefreshCcw, 
    CreditCard, 
    Clock, 
    CheckCircle2, 
    ChevronRight, 
    ArrowUpRight,
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
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Syncing Ledger...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Settlements</h1>
            <p className="text-slate-500 font-medium">Review your project invoices and payment history.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100 shadow-sm">
                <Lock size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Secure Portal</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Records</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search invoices..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6">
                {filteredInvoices.map(inv => (
                    <Card key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                                <div className="p-8 md:w-1/4 bg-slate-50/50 flex flex-col justify-center border-r border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                    <h3 className="text-xl font-black text-slate-900">{inv.invoice_number}</h3>
                                    <Badge className={cn(
                                        "w-fit mt-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                        inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                        {inv.status}
                                    </Badge>
                                </div>
                                <div className="p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Project</p>
                                        <h4 className="text-lg font-bold text-slate-900">{inv.project?.title || 'System Service'}</h4>
                                        <p className="text-sm font-medium text-slate-400">Issued on {new Date(inv.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                                            <p className="text-3xl font-black text-slate-900">${Number(inv.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                                            <ChevronRight size={24} />
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
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No settlements found</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}