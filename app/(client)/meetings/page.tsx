'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getMeetings } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Calendar, 
    Video, 
    Clock, 
    ChevronRight, 
    RefreshCcw, 
    Search, 
    ArrowUpRight,
    Zap,
    CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MeetingRequest } from '@/lib/db/types';

export default function MeetingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) fetchMeetings();
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await getMeetings(user?.id);
      setMeetings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => 
        m.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [meetings, searchQuery]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Accessing Your Calendar...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Your Consultations</h1>
            <p className="text-slate-500 font-medium">Review and schedule briefings with our project team.</p>
          </div>
          <Button onClick={() => router.push('/meetings/new')} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <Plus className="h-5 w-5 mr-2" />
            Request Meeting
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <ClientMeetingKPI title="Total Briefings" value={meetings.length} icon={Calendar} color="slate" />
            <ClientMeetingKPI title="Next Session" value={meetings.filter(m => m.status === 'accepted' && new Date(m.requested_date) > new Date()).length} icon={Zap} color="blue" />
            <ClientMeetingKPI title="Settled" value={meetings.filter(m => m.status === 'completed').length} icon={CheckCircle2} color="emerald" />
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Itinerary</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search purpose..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[300px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredMeetings.map(m => (
                    <Card key={m.id} className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer">
                        <CardHeader className="p-10 pb-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <Video size={32} />
                                </div>
                                <Badge className={cn(
                                    "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none",
                                    m.status === 'accepted' ? "bg-emerald-50 text-emerald-600" : m.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {m.status}
                                </Badge>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{m.purpose}</h3>
                        </CardHeader>
                        <CardContent className="p-10 pt-0 space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                    <p className="text-sm font-black text-slate-900">{new Date(m.requested_date).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                                    <p className="text-sm font-black text-slate-900">{new Date(m.requested_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-slate-300" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.duration_minutes}m Session</span>
                                </div>
                                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredMeetings.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white rounded-[3rem] shadow-sm">
                        <Calendar size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No briefing history</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ClientMeetingKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
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
