'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getProjects, getInvoices, getTransactions } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import type { Project, Invoice, Transaction } from '@/lib/db/types';
import { adminNavItems } from '@/components/layout/dashboard-nav';
import Link from 'next/link';
import { 
    Activity, 
    ChevronRight, 
    ArrowUpRight, 
    ArrowDownRight, 
    LayoutDashboard, 
    LayoutGrid, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Monitor,
    Cloud,
    Sun,
    Image as ImageIcon,
    Maximize2,
    Minimize2,
    Zap,
    Box,
    FileText,
    Users,
    TrendingUp,
    ShieldCheck,
    Globe2,
    RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BACKGROUNDS = [
  "url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1280&q=60')",
  "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1280&q=60')",
  "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1280&q=60')",
  "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=60')",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bgIndex, setBgIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [proj, inv, tx] = await Promise.all([
        getProjects(),
        getInvoices(),
        getTransactions()
      ]);
      setProjects(proj || []);
      setInvoices(inv || []);
      setTransactions(tx || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    activeProjects: projects.filter(p => ['accepted', 'in_progress'].includes(p.status)).length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0),
    pendingBills: invoices.filter(i => i.status === 'pending').length,
    alerts: projects.filter(p => p.status === 'pending').length
  }), [projects, invoices]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Booting Command Center...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        
        {/* Dynamic OS-Style Header */}
        <div className="relative h-[300px] rounded-[3rem] overflow-hidden shadow-2xl group border-4 border-white">
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-[3000ms] group-hover:scale-110"
                style={{ backgroundImage: BACKGROUNDS[bgIndex] }}
            />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            
            <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
                        <Sun className="h-8 w-8 text-amber-300" />
                        <div>
                            <p className="text-2xl font-black leading-none">24°C</p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Clear Skies</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-6xl font-black tracking-tighter drop-shadow-lg">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80 pt-2">
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight">Welcome, {user?.full_name?.split(' ')[0]}</h1>
                        <p className="text-sm font-bold opacity-80 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" />
                            System active and all systems nominal.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
                            onClick={() => setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)}
                        >
                            <ImageIcon size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid gap-6 md:grid-cols-4">
            <VisualKPI title="Active Projects" value={stats.activeProjects} icon={Zap} color="blue" trend="+2 this week" />
            <VisualKPI title="Total Revenue" value={`$${(stats.revenue/1000).toFixed(1)}k`} icon={TrendingUp} color="emerald" trend="Paid records" />
            <VisualKPI title="Action Items" value={stats.alerts} icon={AlertCircle} color="amber" trend="Needs review" />
            <VisualKPI title="System Status" value="Secure" icon={ShieldCheck} color="indigo" trend="Auto-sync active" />
        </div>

        {/* Modular Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* App Launchpad */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <LayoutGrid size={24} className="text-primary" />
                        Application Suite
                    </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
                    {adminNavItems
                        .filter(
                            (item): item is typeof item & { href: string } =>
                                item.title !== 'Dashboard' && typeof item.href === 'string'
                        )
                        .map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all duration-500"
                            >
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 transition-all duration-500 shadow-inner overflow-hidden relative">
                                    <Icon className="h-7 w-7 text-slate-400 group-hover:text-white group-hover:scale-110 transition-all duration-500" />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-900 uppercase tracking-widest text-center truncate w-full">
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Side Activity Center */}
            <div className="lg:col-span-4 space-y-8">
                <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Activity className="text-primary" size={20} />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        {projects.slice(0, 4).map((p, i) => (
                            <div key={p.id} className="flex items-center gap-4 group/item">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                    <Box size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{p.title}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.status}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300" />
                            </div>
                        ))}
                        <Button variant="outline" className="w-full rounded-2xl border-slate-100 h-12 font-bold text-slate-500 hover:text-slate-900">
                            View All Operations
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[3rem] border-none shadow-sm bg-slate-900 text-white p-10 overflow-hidden relative group">
                    <Globe2 className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Resource Pulse</p>
                            <h3 className="text-2xl font-black">All Sites Online</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500">85% EFFICIENCY</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function VisualKPI({ title, value, icon: Icon, color, trend }: { title: string; value: any; icon: any; color: 'blue' | 'emerald' | 'amber' | 'indigo'; trend: string }) {
    const variants = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
    };

    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{trend}</div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}