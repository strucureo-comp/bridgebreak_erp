'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getSupportRequests } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Search, 
    RefreshCcw, 
    ChevronRight, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck,
    LifeBuoy,
    Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SupportRequest } from '@/lib/db/types';
import { Button } from '@/components/ui/button';

export default function AdminSupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
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
      const data = await getSupportRequests();
      setRequests(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
        r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const stats = useMemo(() => ({
    total: requests.length,
    open: requests.filter(r => r.status === 'open' || r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved' || r.status === 'closed').length
  }), [requests]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Connecting to Help Desk...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Service & Support</h1>
            <p className="text-slate-500 font-medium">Manage client inquiries and technical assistance.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <SupportKPI title="Total Inquiries" value={stats.total} icon={MessageSquare} color="slate" />
            <SupportKPI title="Awaiting Response" value={stats.open} icon={Clock} color="amber" />
            <SupportKPI title="Resolved" value={stats.resolved} icon={CheckCircle2} color="emerald" />
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Ticket Registry</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search tickets..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6">
                {filteredRequests.map(r => (
                    <Card key={r.id} onClick={() => router.push(`/admin/support/${r.id}`)} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer">
                        <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className={cn(
                                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-all duration-500 group-hover:bg-slate-900 group-hover:text-white",
                                    r.status === 'open' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-300"
                                )}>
                                    <LifeBuoy size={32} />
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge className={cn(
                                            "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none",
                                            r.priority === 'high' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                                        )}>
                                            {r.priority} priority
                                        </Badge>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 truncate group-hover:text-primary transition-colors">{r.subject}</h3>
                                    <p className="text-sm font-medium text-slate-400 line-clamp-1">{r.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <Badge className={cn(
                                    "rounded-xl px-4 py-1.5 border-none font-black text-[10px] uppercase tracking-widest",
                                    r.status === 'resolved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {r.status.replace('_', ' ')}
                                </Badge>
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredRequests.length === 0 && (
                    <div className="py-24 text-center bg-white rounded-[3rem] shadow-sm">
                        <MessageSquare size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No active tickets</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SupportKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
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