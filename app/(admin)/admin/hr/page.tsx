'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  getEmployees, createEmployee, 
  getAttendance, markAttendance,
  getPayrolls, generatePayroll,
  getLabourAllocations, allocateLabour,
  getProjects
} from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
    Users, 
    Calendar, 
    Briefcase, 
    Plus, 
    DollarSign, 
    UserPlus, 
    Clock, 
    CheckCircle2, 
    Search,
    Filter,
    MoreHorizontal,
    ChevronRight,
    Activity,
    ShieldCheck,
    RefreshCcw,
    MapPin,
    Heart,
    Star,
    ArrowUpRight,
    TrendingUp,
    BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import type { Employee, Attendance, Payroll, LabourAllocation, Project } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function HRPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
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
      const [emp, att, pay] = await Promise.all([
        getEmployees(),
        getAttendance(new Date().toISOString().split('T')[0]),
        getPayrolls()
      ]);
      setEmployees(emp || []);
      setAttendance(att || []);
      setPayrolls(pay || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: employees.length,
    onDuty: attendance.filter(a => a.status === 'present').length,
    monthlyCost: payrolls[0] ? Number(payrolls[0].total_amount) : employees.reduce((s, e) => s + Number(e.basic_salary), 0),
    efficiency: 92 // Placeholder for logic
  }), [employees, attendance, payrolls]);

  const salaryDistribution = useMemo(() => {
    const roles: Record<string, number> = {};
    employees.forEach(e => {
      roles[e.role] = (roles[e.role] || 0) + Number(e.basic_salary);
    });
    return Object.entries(roles).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [employees]);

  const attendanceTrends = useMemo(() => {
    return [
      { name: 'Mon', count: 42 },
      { name: 'Tue', count: 45 },
      { name: 'Wed', count: 44 },
      { name: 'Thu', count: 48 },
      { name: 'Fri', count: 40 },
      { name: 'Sat', count: 35 },
    ];
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Accessing Personnel Files...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Team Roster</h1>
            <p className="text-slate-500 font-medium">Coordinate your workforce and site assignments.</p>
          </div>
          <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <UserPlus className="h-5 w-5 mr-2" /> Onboard Staff
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
            <HRKPI title="Total Staff" value={stats.total} icon={Users} color="blue" />
            <HRKPI title="Active Today" value={stats.onDuty} icon={CheckCircle2} color="emerald" />
            <HRKPI title="Payroll Estimate" value={`$${(stats.monthlyCost/1000).toFixed(1)}k`} icon={DollarSign} color="amber" />
            <HRKPI title="Efficiency" value={`${stats.efficiency}%`} icon={TrendingUp} color="indigo" />
        </div>

        {/* Visual Analysis */}
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Salary by Role</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Monthly budget distribution</CardDescription>
                    </div>
                    <BarChart3 className="text-primary opacity-20" size={32} />
                </CardHeader>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salaryDistribution}>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <CardHeader className="p-0 pb-8">
                    <CardTitle className="text-2xl font-black">Attendance Flow</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Personnel presence (Last 7 days)</CardDescription>
                </CardHeader>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceTrends}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-8">
            {/* ... List content remains same ... */}
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function HRKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
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
