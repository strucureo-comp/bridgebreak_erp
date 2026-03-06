'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, DollarSign, TrendingUp, Calendar, Clock, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import type { Employee, Attendance, Payroll, Leave, Holiday } from '@/lib/db/types';

interface HRDashboardProps {
  employees: Employee[];
  attendance: Attendance[];
  payrolls: Payroll[];
  leaves: Leave[];
  holidays: Holiday[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0
  }).format(n);
}

export function HRDashboard({ employees, attendance, payrolls, leaves, holidays }: HRDashboardProps) {
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onDuty: attendance.filter(a => a.status === 'present').length,
    pendingLeaves: leaves.filter(l => l.status === 'pending').length,
    monthlyCost: payrolls[0] ? Number(payrolls[0].total_amount) : employees.reduce((s, e) => s + Number(e.basic_salary || 0), 0),
    upcomingHolidays: holidays.filter(h => new Date(h.date) >= new Date()).length,
    growth: 4.2,
  }), [employees, attendance, payrolls, leaves, holidays]);

  const deptDistribution = useMemo(() => {
    const depts: Record<string, number> = {};
    employees.forEach(e => {
      const dept = e.dept?.name || e.department || 'Unassigned';
      depts[dept] = (depts[dept] || 0) + 1;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [employees]);

  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    employees.forEach(e => { types[e.employment_type] = (types[e.employment_type] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

  const attendanceTrends = useMemo(() => [
    { name: 'Mon', present: 42 }, { name: 'Tue', present: 45 },
    { name: 'Wed', present: 44 }, { name: 'Thu', present: 48 },
    { name: 'Fri', present: 40 }, { name: 'Sat', present: 35 },
  ], []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Workforce Size"
          value={stats.total}
          icon={Users}
          trend={`+${stats.growth}%`}
          trendUp={true}
          description="Active employees"
        />
        <MetricCard
          title="Attendance"
          value={`${((stats.onDuty / (stats.active || 1)) * 100).toFixed(0)}%`}
          icon={CheckCircle2}
          trend="Daily"
          description={`${stats.onDuty} staff on-site`}
        />
        <MetricCard
          title="Monthly Payroll"
          value={fmt(stats.monthlyCost)}
          icon={DollarSign}
          trend="Est."
          description="Current cycle"
        />
        <MetricCard
          title="Leave Requests"
          value={stats.pendingLeaves}
          icon={AlertTriangle}
          trend="Pending"
          trendUp={false}
          description="Requires review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-sm rounded-md">
          <CardHeader className="border-b bg-muted/50 py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Attendance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={attendanceTrends}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#09090b"
                    strokeWidth={2}
                    fill="#09090b"
                    fillOpacity={0.05}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-md">
          <CardHeader className="border-b bg-muted/50 py-4">
            <CardTitle className="text-sm font-medium">Department Matrix</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {deptDistribution.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{dept.name}</span>
                  <span>{dept.value} Units</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${(dept.value / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border shadow-sm rounded-md overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="divide-y">
            {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 4).map(h => (
              <div key={h.id} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                <span className="text-xs font-medium text-foreground">{h.name}</span>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {new Date(h.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border shadow-sm rounded-md overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="divide-y">
            {leaves.filter(l => l.status === 'pending').slice(0, 4).map(l => (
              <div key={l.id} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
                <div>
                  <p className="text-xs font-medium text-foreground">{l.employee?.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{l.leave_type} · {l.days} days</p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </div>
            ))}
            {leaves.filter(l => l.status === 'pending').length === 0 && (
              <div className="p-8 text-center text-xs font-medium text-muted-foreground/60 italic">Clear Pipeline</div>
            )}
          </div>
        </Card>

        <Card className="border shadow-sm rounded-md overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4">
            <CardTitle className="text-sm font-medium">Workforce Mix</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    dataKey="value"
                    paddingAngle={4}
                    stroke="none"
                  >
                    {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full">
              {typeDistribution.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-medium text-muted-foreground">{t.name} ({t.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, description }: any) {
  return (
    <Card className="border shadow-sm rounded-md">
      <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          "text-xs font-semibold px-1.5 py-0.5 rounded",
          trendUp ? "bg-emerald-50 text-emerald-600" : trendUp === false ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground"
        )}>
          {trend}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="text-xl font-medium text-foreground">{value}</div>
        </div>
        <p className="text-xs text-muted-foreground font-medium mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}