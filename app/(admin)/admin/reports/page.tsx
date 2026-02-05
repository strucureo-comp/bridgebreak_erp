'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart3, 
    PieChart, 
    FileCheck, 
    TrendingUp, 
    Activity, 
    ShieldCheck, 
    ChevronRight, 
    FileText, 
    ArrowUpRight,
    Zap,
    Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Intelligence & Reports</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Aggregate data and operational performance analytics
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <ReportKPI title="Data Points" value="12.4k" icon={Activity} color="blue" />
            <ReportKPI title="Audit Status" value="Passed" icon={ShieldCheck} color="emerald" />
            <ReportKPI title="System Growth" value="+18%" icon={TrendingUp} color="indigo" />
        </div>

        <Tabs defaultValue="financial" className="space-y-10">
          <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <TabsTrigger value="financial" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                <Scale className="h-4 w-4"/> Financials
            </TabsTrigger>
            <TabsTrigger value="operational" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                <BarChart3 className="h-4 w-4"/> Operations
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                <FileCheck className="h-4 w-4"/> Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ReportCard title="P&L Statement" desc="Monthly profit and loss analysis." icon={FileText} />
                <ReportCard title="Balance Sheet" desc="Snapshot of company assets and debt." icon={Scale} />
                <ReportCard title="Cash Flow" desc="Real-time tracking of money movements." icon={Activity} />
            </div>
          </TabsContent>

          <TabsContent value="operational">
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-sm space-y-6 text-center">
                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                    <BarChart3 size={40} />
                </div>
                <div className="max-w-sm space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Efficiency Analytics</h3>
                    <p className="text-slate-500 font-medium">Detailed tracking of project timelines and resource deployment coming soon.</p>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-sm space-y-6 text-center">
                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                    <FileCheck size={40} />
                </div>
                <div className="max-w-sm space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Regulatory Audit</h3>
                    <p className="text-slate-500 font-medium">Automatic generation of compliance logs and tax reports is being initialized.</p>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function ReportKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
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
                <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-slate-900 transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}

function ReportCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Generate Analysis</span>
                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Card>
    );
}