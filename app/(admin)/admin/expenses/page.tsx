'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Receipt, 
    TrendingDown, 
    ArrowDownRight, 
    RefreshCcw, 
    ChevronRight, 
    Box,
    DollarSign,
    Clock,
    Activity,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ExpensesPage() {
  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Money Spent</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Track project costs and operational spending.
            </p>
          </div>
        </div>

        {/* High-Impact Stat Strip */}
        <div className="grid gap-6 md:grid-cols-3">
            <ExpenseKPI title="Quarterly Spend" value="$0.00" icon={Receipt} color="rose" />
            <ExpenseKPI title="Unbilled Costs" value="0" icon={Clock} color="amber" />
            <ExpenseKPI title="Budget Health" value="Stable" icon={Activity} color="emerald" />
        </div>

        {/* Informational Section */}
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-8 text-center px-6">
            <div className="relative">
                <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                    <Receipt size={64} strokeWidth={1.5} />
                </div>
                <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg">
                    <AlertCircle size={24} />
                </div>
            </div>
            <div className="max-w-md space-y-3">
                <h3 className="text-3xl font-black text-slate-900">Cost Engine</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                    The automated expense tracking module is being synchronized with your bank accounts and procurement logs. 
                </p>
                <div className="pt-4 flex items-center justify-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest">
                    <span>Audit Ready</span>
                    <div className="h-1 w-1 rounded-full bg-rose-500" />
                    <span>Real-time Log</span>
                </div>
            </div>
            <Button className="rounded-2xl px-12 h-14 font-black bg-slate-900 text-white shadow-2xl shadow-slate-200 uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform">
                Log New Expense
            </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function ExpenseKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
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
