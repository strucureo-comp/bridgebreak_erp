'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getUsers } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Users, 
    UserPlus, 
    Search, 
    Shield, 
    Mail, 
    Clock, 
    ChevronRight, 
    MoreHorizontal, 
    RefreshCcw,
    ShieldCheck,
    UserCheck,
    Lock,
    Settings2,
    Trash2,
    MoreVertical,
    Activity,
    ShieldAlert,
    Key
} from 'lucide-react';
import type { User } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (currentUser?.role === 'admin') fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Team Fetch Error:', error);
      toast.error('Failed to load access directory');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length,
    activeThisWeek: users.filter(u => (u as any).status === 'active').length
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center shadow-inner">
            <RefreshCcw className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <p className="font-black text-foreground uppercase tracking-widest text-xs">Synchronizing Access Directory...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-card-foreground shadow-lg shadow-indigo-200">
                  <ShieldCheck className="h-6 w-6" />
               </div>
               <h1 className="text-4xl font-black tracking-tight text-foreground">Access Management</h1>
            </div>
            <p className="text-muted-foreground font-bold flex items-center gap-2 ml-1">
              Control administrative privileges and client portal ecosystems
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchData} className="rounded-2xl h-12 w-12 p-0 border-none bg-card shadow-sm hover:bg-slate-50">
                <RefreshCcw className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button className="rounded-2xl bg-slate-900 hover:bg-indigo-600 h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all">
              <UserPlus className="h-5 w-5 mr-3" />
              Invite Architect
            </Button>
          </div>
        </div>

        {/* Visual Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
            <StatCard icon={Users} label="Total Accounts" value={stats.totalUsers} color="blue" />
            <StatCard icon={Shield} label="Admins" value={stats.admins} color="indigo" />
            <StatCard icon={UserCheck} label="Client Portals" value={stats.clients} color="emerald" />
            <StatCard icon={Activity} label="Active Session" value={stats.activeThisWeek} color="rose" />
        </div>

        {/* User Registry */}
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-foreground">Identity Directory</h2>
                    <Badge className="bg-muted text-muted-foreground border-none font-black px-3 py-1">
                        {filteredUsers.length} MEMBERS
                    </Badge>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                        placeholder="Search by identity or mail..." 
                        className="pl-12 rounded-2xl border-none bg-card shadow-sm w-full md:w-[400px] h-12 font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredUsers.map(u => (
                    <Card 
                        key={u.id} 
                        onClick={() => setSelectedUser(u)}
                        className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer relative"
                    >
                        <CardContent className="p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div className="h-20 w-20 rounded-[1.75rem] bg-muted flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-inner font-black text-2xl overflow-hidden relative">
                                    {u.full_name.charAt(0).toUpperCase()}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className={cn(
                                        "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] border-none shadow-sm",
                                        u.role === 'admin' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {u.role}
                                    </Badge>
                                    {u.role === 'admin' && (
                                        <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                                            <ShieldAlert size={12} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-1 mb-8">
                                <h3 className="text-xl font-black text-foreground truncate group-hover:text-indigo-600 transition-colors">{u.full_name}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                    <Mail size={14} className="text-indigo-500/50" />
                                    <span className="truncate">{u.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                        <Lock size={14} />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-slate-900 transition-colors">Access Policy</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* User Detailed Sheet */}
        <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <SheetContent className="sm:max-w-xl p-0 border-none bg-muted">
                {selectedUser && (
                    <div className="flex flex-col h-full relative overflow-hidden">
                        {/* Header Section */}
                        <div className="p-8 pb-24 bg-slate-900 text-card-foreground relative">
                            <div className="flex items-center justify-between mb-8">
                                <Badge className="bg-indigo-600 text-card-foreground border-none font-black text-[10px] px-3 py-1 tracking-widest uppercase">
                                    {selectedUser.role} Account
                                </Badge>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" className="rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-card-foreground">
                                        <Settings2 size={18} />
                                    </Button>
                                    <Button size="icon" variant="outline" className="rounded-xl border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/20 text-rose-500">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-2xl">
                                    <div className="h-full w-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center text-3xl font-black">
                                        {selectedUser.full_name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight">{selectedUser.full_name}</h2>
                                    <p className="text-indigo-400 font-bold flex items-center gap-2">
                                        <Mail size={14} />
                                        {selectedUser.email}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Abstract bg element */}
                            <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12">
                                <ShieldCheck size={240} />
                            </div>
                        </div>

                        {/* Tabs Content */}
                        <div className="px-6 -mt-12 z-10 pb-12">
                            <Card className="rounded-[2rem] border-none shadow-2xl bg-card overflow-hidden">
                                <Tabs defaultValue="permissions" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none bg-muted p-0 h-14 border-b">
                                        <TabsTrigger value="permissions" className="rounded-none h-full px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">Permissions</TabsTrigger>
                                        <TabsTrigger value="activity" className="rounded-none h-full px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">Security Log</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="permissions" className="p-8 space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Module Access Control</h4>
                                            <div className="grid gap-4">
                                                <AccessItem icon={ShieldCheck} label="Global Administrative Rights" active={selectedUser.role === 'admin'} />
                                                <AccessItem icon={Users} label="Human Resources Management" active={true} />
                                                <AccessItem icon={Lock} label="Financial Systems Access" active={selectedUser.role === 'admin'} />
                                                <AccessItem icon={Activity} label="Project Monitoring" active={true} />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-50">
                                            <Button className="w-full rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">
                                                Update Security Policy
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="activity" className="p-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recent Identity Events</h4>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                        <Key size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Successful Login Attempt</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Monday, 16 Feb 2026 • 10:42 AM • IP: 192.168.1.{i}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
        rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
    };

    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-8 group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500", colors[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Icon size={100} strokeWidth={4} />
            </div>
        </Card>
    );
}

function AccessItem({ icon: Icon, label, active }: { icon: any, label: string, active: boolean }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
            <div className="flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", active ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-muted-foreground")}>
                    <Icon size={18} />
                </div>
                <span className="text-sm font-bold text-slate-700">{label}</span>
            </div>
            <div className={cn("h-2 w-10 rounded-full", active ? "bg-emerald-500 shadow-sm shadow-emerald-100" : "bg-slate-300")} />
        </div>
    );
}
