'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare, ShieldCheck, Clock, Activity, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ApprovalsPage() {
  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Approvals & Audit</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Centralized authority for project and finance changes
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <ApprovalKPI title="Pending Review" value="0" icon={Clock} color="amber" />
            <ApprovalKPI title="System Logs" value="Active" icon={Activity} color="blue" />
            <ApprovalKPI title="Security Status" value="Locked" icon={ShieldCheck} color="emerald" />
        </div>

        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] shadow-sm space-y-8 text-center border-4 border-slate-50">
            <div className="relative">
                <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                    <CheckSquare size={64} strokeWidth={1.5} />
                </div>
                <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg animate-pulse">
                    <ShieldCheck size={24} />
                </div>
            </div>
            <div className="max-w-md space-y-3 px-6">
                <h3 className="text-3xl font-black text-slate-900">Governance Console</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                    The automated approval workflow engine is being synchronized with your enterprise policies. 
                </p>
                <div className="pt-4 flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                    <span>Audit Ready</span>
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span>Compliance Verified</span>
                </div>
            </div>
            <Button className="rounded-2xl px-12 h-14 font-black bg-slate-900 text-white shadow-2xl shadow-slate-200 uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform">
                Configure Policies
            </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function ApprovalKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
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