'use client';

import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Building2, 
    MapPin, 
    Globe2, 
    Cpu, 
    ShieldCheck, 
    Settings, 
    Database, 
    Zap, 
    Activity,
    Lock,
    RefreshCcw,
    ChevronRight,
    Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Control Center</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Enterprise-wide configuration and company parameters.
            </p>
          </div>
        </div>

        {/* System Health Strip */}
        <div className="grid gap-6 md:grid-cols-3">
            <SettingKPI title="System Status" value="Online" icon={Activity} color="emerald" />
            <SettingKPI title="Security" value="Encrypted" icon={Lock} color="blue" />
            <SettingKPI title="Environment" value="Live" icon={Zap} color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Company Profile Card */}
            <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden p-10 lg:col-span-2 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Building2 size={32} />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">Verified Profile</Badge>
                </div>
                <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Name</p>
                            <h3 className="text-xl font-black text-slate-900">System Steel Engineering LLC</h3>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ Location</p>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-primary" />
                                <h3 className="text-xl font-black text-slate-900">United Arab Emirates</h3>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Industry</p>
                        <p className="text-lg font-bold text-slate-600 leading-relaxed">Steel Engineering, Structural Fabrication & Project Execution</p>
                    </div>
                </div>
            </Card>

            {/* System Info Card */}
            <Card className="rounded-[3rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden p-10 relative group">
                <Monitor className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 space-y-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Core</p>
                        <h3 className="text-2xl font-black">System Architecture</h3>
                    </div>
                    <div className="space-y-4">
                        <SystemSpec label="Runtime" value="Edge Optimized" />
                        <SystemSpec label="Engine" value="Next.js / Prisma" />
                        <SystemSpec label="Data" value="PostgreSQL Managed" />
                        <SystemSpec label="Security" value="Custom JWT Shield" />
                    </div>
                    <div className="pt-6">
                        <Button variant="outline" className="w-full rounded-2xl border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest h-12">
                            Check for Updates
                        </Button>
                    </div>
                </div>
            </Card>
        </div>

        {/* Maintenance Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-slate-50 rounded-[3rem] border-4 border-white shadow-inner">
            <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <RefreshCcw size={40} />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-900">Database Synchronization</h3>
                <p className="text-slate-500 font-medium">Re-index and synchronize all project deployments and financial records with the cloud core.</p>
            </div>
            <Button className="rounded-2xl px-10 h-14 font-black bg-slate-900 text-white shadow-xl shadow-slate-200 uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all">
                Run Full Sync
            </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function SettingKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="rounded-full border-slate-100 text-slate-300 font-black text-[9px] uppercase">Active</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}

function SystemSpec({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
            <span className="text-sm font-bold text-slate-300">{value}</span>
        </div>
    );
}
