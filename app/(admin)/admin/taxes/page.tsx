'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getSystemSetting, getInvoices, getTaxDatabaseStatus, getTaxJobHistory, triggerTaxDataCollection } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Percent, 
    ShieldCheck, 
    RefreshCcw, 
    FileText, 
    Clock, 
    Calendar,
    Settings,
    CheckCircle2,
    Scale,
    Info
} from 'lucide-react';
import type { FinanceConfiguration } from '@/lib/finance-config';
import { DEFAULT_MULTI_ENGINE_CONFIG } from '@/lib/finance-config';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TaxesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<Partial<FinanceConfiguration> | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configData, invoicesData, statusData, historyData] = await Promise.all([
        getSystemSetting('finance_config'),
        getInvoices(),
        getTaxDatabaseStatus(),
        getTaxJobHistory()
      ]);
      setConfig(configData || DEFAULT_MULTI_ENGINE_CONFIG);
      setInvoices(invoicesData || []);
      setJobHistory(historyData || []);
    } catch (error) {
      console.error('Taxes Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSync = async () => {
    try {
      setSyncing(true);
      toast.info('Updating tax rates...');
      await triggerTaxDataCollection();
      toast.success('Tax rates updated');
      fetchData();
    } catch {
      toast.error('Update failed');
    } finally {
      setSyncing(false);
    }
  };

  const taxLiability = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalTaxable = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    return totalTaxable * 0.05; // 5% estimate
  }, [invoices]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Calculating Tax Records...</p>
        </div>
      </DashboardShell>
    );
  }

  const taxConfig = config?.tax_config;

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Tax Center</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Monitor your VAT, GST and official filings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-2xl border-slate-200 h-12 px-6 font-bold shadow-sm"
              onClick={handleRunSync}
              disabled={syncing}
            >
              <RefreshCcw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
              Update Rates
            </Button>
            <Link href="/admin/finance/settings">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200">
                    <Settings className="h-5 w-5" />
                </Button>
            </Link>
          </div>
        </div>

        {/* High Impact KPIs */}
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden p-10 relative group">
                <Percent className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Estimated Tax Due</p>
                    <h2 className="text-5xl font-black tracking-tighter">${taxLiability.toLocaleString()}</h2>
                    <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[65%] rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Q1 Progress</span>
                    </div>
                </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-14 w-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">Secure</Badge>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Regime</p>
                <h3 className="text-2xl font-black text-slate-900">{taxConfig?.regime?.replace(/_/g, ' ') || 'Generic VAT'}</h3>
                <p className="text-xs font-bold text-slate-400 pt-2 font-mono uppercase truncate">{taxConfig?.tax_id || 'ID NOT SET'}</p>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-14 w-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Clock className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">Upcoming</Badge>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Filing</p>
                <h3 className="text-2xl font-black text-slate-900">31 Mar 2026</h3>
                <div className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-400">
                    <Calendar size={14} /> 57 Days Remaining
                </div>
            </Card>
        </div>

        {/* Details Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Rates Table */}
            <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Official Rates</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Current percentages for your region</CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <Info size={20} />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Label</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Rate</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {taxConfig?.rates?.map((rate: any) => (
                                <tr key={rate.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                {rate.name.charAt(0)}
                                            </div>
                                            <span className="text-base font-bold text-slate-900">{rate.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <Badge variant="secondary" className="rounded-lg px-3 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] uppercase border-none">
                                            {rate.type}
                                        </Badge>
                                    </td>
                                    <td className="p-8 text-right font-black text-xl">{rate.rate}%</td>
                                    <td className="p-8 text-center">
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                            <CheckCircle2 size={12} /> Active
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!taxConfig?.rates || taxConfig.rates.length === 0) && (
                                <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-black uppercase tracking-widest italic text-[10px]">No rates identified</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Side Logs */}
            <div className="space-y-6">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-10 group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="h-14 w-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <RefreshCcw className="h-7 w-7" strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                    <div className="space-y-2 mb-8">
                        <h3 className="text-2xl font-black text-slate-900">Updates</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">Tax rates are automatically synchronized every 10 days.</p>
                    </div>
                    <div className="space-y-4">
                        {jobHistory.slice(0, 3).map((job, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{new Date(job.timestamp).toLocaleDateString()}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{job.countriesCollected} Countries</p>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50 p-10 flex flex-col items-center justify-center text-center space-y-4">
                    <FileText className="h-10 w-10 text-slate-200" />
                    <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900">Official Reports</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Download return summaries and liability history.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-11">Open Archive</Button>
                </Card>
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}