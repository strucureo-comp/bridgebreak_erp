'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getUsers } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Lock
} from 'lucide-react';
import type { User } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length
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
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Loading Access Directory...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">User Permissions</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Manage administrative access and client portal accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="rounded-2xl bg-slate-900 h-12 px-8 font-bold shadow-xl shadow-slate-200">
              <UserPlus className="h-5 w-5 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Visual Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Users className="h-6 w-6" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Accounts</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.totalUsers}</h3>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Shield className="h-6 w-6" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admins</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.admins}</h3>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <UserCheck className="h-6 w-6" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Portals</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.clients}</h3>
            </Card>
        </div>

        {/* User Registry */}
        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Access Directory</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map(u => (
                    <Card key={u.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner font-black text-xl">
                                    {u.full_name.charAt(0).toUpperCase()}
                                </div>
                                <Badge className={cn(
                                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                    u.role === 'admin' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {u.role}
                                </Badge>
                            </div>
                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-black text-slate-900 truncate">{u.full_name}</h3>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                    <Mail size={14} />
                                    <span className="truncate">{u.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Lock size={14} className="text-slate-300" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Access</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}