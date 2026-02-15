'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, DollarSign, TrendingUp, Calendar, Clock, UserPlus, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import type { Employee, Attendance, Payroll, Leave, Holiday } from '@/lib/db/types';

interface HRDashboardProps {
    employees: Employee[];
    attendance: Attendance[];
    payrolls: Payroll[];
    leaves: Leave[];
    holidays: Holiday[];
}

export function HRDashboard({ employees, attendance, payrolls, leaves, holidays }: HRDashboardProps) {
    const stats = useMemo(() => ({
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onDuty: attendance.filter(a => a.status === 'present').length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        monthlyCost: payrolls[0] ? Number(payrolls[0].total_amount) : employees.reduce((s, e) => s + Number(e.basic_salary), 0),
        upcomingHolidays: holidays.filter(h => new Date(h.date) >= new Date()).length,
    }), [employees, attendance, payrolls, leaves, holidays]);

    const deptDistribution = useMemo(() => {
        const depts: Record<string, number> = {};
        employees.forEach(e => {
            const dept = e.dept?.name || e.department || 'Unassigned';
            depts[dept] = (depts[dept] || 0) + 1;
        });
        return Object.entries(depts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, [employees]);

    const typeDistribution = useMemo(() => {
        const types: Record<string, number> = {};
        employees.forEach(e => { types[e.employment_type] = (types[e.employment_type] || 0) + 1; });
        return Object.entries(types).map(([name, value]) => ({ name, value }));
    }, [employees]);

    const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

    const attendanceTrends = useMemo(() => [
        { name: 'Mon', present: 42, absent: 3 }, { name: 'Tue', present: 45, absent: 1 },
        { name: 'Wed', present: 44, absent: 2 }, { name: 'Thu', present: 48, absent: 0 },
        { name: 'Fri', present: 40, absent: 5 }, { name: 'Sat', present: 35, absent: 0 },
    ], []);

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                <KPI title="Total Employees" value={stats.total} icon={Users} color="indigo" subtitle={`${stats.active} active`} />
                <KPI title="Present Today" value={stats.onDuty} icon={CheckCircle2} color="emerald" subtitle={`of ${stats.active}`} />
                <KPI title="Monthly Payroll" value={`₹${(stats.monthlyCost / 1000).toFixed(0)}k`} icon={DollarSign} color="amber" subtitle="Estimated" />
                <KPI title="Pending Leaves" value={stats.pendingLeaves} icon={AlertTriangle} color="rose" subtitle="Awaiting approval" />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-lg font-bold">Department Headcount</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400">Employee distribution by department</CardDescription>
                    </CardHeader>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptDistribution}>
                                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-lg font-bold">Attendance Trend</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400">Weekly presence overview</CardDescription>
                    </CardHeader>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceTrends}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Quick Info Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" /> Upcoming Holidays</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2">
                        {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 4).map(h => (
                            <div key={h.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <span className="text-sm font-medium text-slate-700">{h.name}</span>
                                <Badge variant="outline" className="text-xs">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Badge>
                            </div>
                        ))}
                        {holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">No upcoming holidays</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending Leave Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2">
                        {leaves.filter(l => l.status === 'pending').slice(0, 4).map(l => (
                            <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{l.employee?.name || 'Employee'}</p>
                                    <p className="text-xs text-slate-400">{l.leave_type?.name} · {l.days} day(s)</p>
                                </div>
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
                            </div>
                        ))}
                        {leaves.filter(l => l.status === 'pending').length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">No pending requests</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2"><UserPlus className="h-4 w-4 text-emerald-500" /> Employment Types</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[160px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4} stroke="none">
                                        {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {typeDistribution.map((t, i) => (
                                <span key={t.name} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    {t.name} ({t.value})
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPI({ title, value, icon: Icon, color, subtitle }: { title: string; value: any; icon: any; color: string; subtitle?: string }) {
    const variants: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
    };
    return (
        <Card className="rounded-3xl border-none shadow-sm bg-white p-6 group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform', variants[color])}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                    {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
                </div>
            </div>
        </Card>
    );
}
