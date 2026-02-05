'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects, getInvoices } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    FolderKanban, 
    FileText, 
    MessageSquare, 
    Plus, 
    ChevronRight, 
    ArrowUpRight, 
    Box, 
    Clock, 
    CheckCircle2, 
    ShieldCheck, 
    Activity,
    Star,
    Calendar,
    RefreshCcw,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import type { Project, Invoice } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [projectsData, invoicesData] = await Promise.all([
        getProjects(user?.id),
        getInvoices(user?.id)
      ]);
      setProjects(projectsData || []);
      setInvoices(invoicesData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    active: projects.filter(p => ['accepted', 'in_progress', 'testing'].includes(p.status)).length,
    pendingPayments: invoices.filter(inv => inv.status === 'pending').length,
    paidPayments: invoices.filter(inv => inv.status === 'paid').length
  }), [projects, invoices]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Loading Your Portal...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Hello, {user?.full_name?.split(' ')[0]}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              Your project environment is secure and up to date.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/projects/new')} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="grid gap-6 md:grid-cols-4">
            <ClientKPI title="All Projects" value={stats.totalProjects} icon={Box} color="slate" />
            <ClientKPI title="In Progress" value={stats.active} icon={Zap} color="blue" />
            <ClientKPI title="Unpaid Bills" value={stats.pendingPayments} icon={Clock} color="amber" />
            <ClientKPI title="Settled" value={stats.paidPayments} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Main View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Project Timeline */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-900">Recent Deployments</h2>
                    <Link href="/projects" className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                        View All <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="grid gap-6">
                    {projects.slice(0, 3).map(p => (
                        <Card key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer">
                            <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <Box size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{p.title}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} />
                                            Updated {new Date(p.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="space-y-2 text-right hidden md:block">
                                        <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Progress</span>
                                            <span className="text-slate-900">65%</span>
                                        </div>
                                        <div className="h-1.5 w-32 bg-slate-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[65%] rounded-full" />
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {projects.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No projects registered</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions & Finance */}
            <div className="lg:col-span-4 space-y-8">
                <Card className="rounded-[3rem] border-none shadow-sm bg-slate-900 text-white p-8 overflow-hidden relative group">
                    <Star className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Service Center</p>
                            <h3 className="text-2xl font-black">Need Assistance?</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/support/new" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors">
                                <MessageSquare size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                            </Link>
                            <Link href="/meetings/new" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors">
                                <Calendar size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Meeting</span>
                            </Link>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <FileText className="text-primary" size={20} />
                            Settlements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        {invoices.slice(0, 3).map(inv => (
                            <div key={inv.id} className="flex items-center justify-between group/inv">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black text-slate-900">#{inv.invoice_number}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">${Number(inv.amount).toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Amount Due</p>
                                </div>
                            </div>
                        ))}
                        {invoices.length === 0 && <p className="text-center py-4 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No pending bills</p>}
                        <Button variant="outline" className="w-full rounded-2xl border-slate-100 h-12 font-bold text-slate-500 hover:text-slate-900" onClick={() => router.push('/invoices')}>
                            Billing History
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ClientKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
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