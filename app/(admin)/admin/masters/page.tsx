'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Database, 
    Settings, 
    Layers, 
    Tags, 
    ChevronRight, 
    Box,
    Truck,
    Users,
    Zap,
    Globe2,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MastersPage() {
  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">System Registry</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Manage core business categories and system lists.
            </p>
          </div>
        </div>

        {/* High-Impact Stat Strip */}
        <div className="grid gap-6 md:grid-cols-3">
            <MasterKPI title="Data Categories" value="12" icon={Layers} color="blue" />
            <MasterKPI title="Verified Lists" value="Active" icon={ShieldCheck} color="emerald" />
            <MasterKPI title="System Integrity" value="100%" icon={Zap} color="indigo" />
        </div>

        {/* Master Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MasterCard title="Business Units" desc="Define company branches and operational units." icon={Box} />
            <MasterCard title="Resource Types" desc="Categorize staff skills and material groups." icon={Users} />
            <MasterCard title="Logistics Masters" desc="Manage shipping methods and vendor zones." icon={Truck} />
            <MasterCard title="Tax Categories" desc="Statutory tax groupings and regional codes." icon={Globe2} />
            <MasterCard title="Lead Sources" desc="Configure where your customers come from." icon={Tags} />
            <MasterCard title="System Labels" desc="Customize status labels and drop-down menus." icon={Settings} />
        </div>

        {/* Informational Section */}
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-4 border-white shadow-inner text-center space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center text-slate-200 shadow-sm">
                <Database size={40} strokeWidth={1.5} />
            </div>
            <div className="max-w-md space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Registry Engine</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                    The core data engine is being optimized to support custom fields and dynamic list management. 
                </p>
            </div>
            <Button className="rounded-2xl px-10 h-12 font-black bg-slate-900 text-white shadow-xl shadow-slate-200 uppercase tracking-widest text-xs">
                Launch Configurator
            </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function MasterKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-slate-900 transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}

function MasterCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
    return (
        <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer p-10">
            <div className="flex flex-col h-full justify-between">
                <div className="space-y-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Icon size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 line-clamp-1">{title}</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                </div>
                <div className="mt-10 flex items-center justify-between group-hover:text-primary transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Open Registry</span>
                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Card>
    );
}