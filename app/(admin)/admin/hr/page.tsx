'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LayoutDashboard, Users, Calendar, DollarSign, Zap } from 'lucide-react';
import { getEmployees, getAttendance, getPayrolls, getDepartments, getHRRoles, getLeaves, getLeaveTypes, getHolidays, getSalaryStructures, getHREvents } from '@/lib/api';
import { HRDashboard } from '@/components/hr/hr-dashboard';
import { EmployeeDirectory } from '@/components/hr/employee-directory';
import { AttendanceLeave } from '@/components/hr/attendance-leave';
import { PayrollContent } from '@/components/hr/payroll-content';
import { HREvents } from '@/components/hr/hr-events';
import type { Employee, Attendance, Payroll, Leave, LeaveType, Holiday, SalaryStructure, HREvent, HRDepartment, HRRole } from '@/lib/db/types';
import { ModuleGuard } from '@/components/layout/module-guard';

export default function HRPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [departments, setDepartments] = useState<HRDepartment[]>([]);
  const [roles, setRoles] = useState<HRRole[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [hrEvents, setHrEvents] = useState<HREvent[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [emps, att, pays, depts, rls, lvs, lvTypes, hols, sals, evts] = await Promise.all([
        getEmployees().catch(() => []),
        getAttendance().catch(() => []),
        getPayrolls().catch(() => []),
        getDepartments().catch(() => []),
        getHRRoles().catch(() => []),
        getLeaves().catch(() => []),
        getLeaveTypes().catch(() => []),
        getHolidays().catch(() => []),
        getSalaryStructures().catch(() => []),
        getHREvents().catch(() => []),
      ]);
      setEmployees(emps);
      setAttendance(att);
      setPayrolls(pays);
      setDepartments(depts);
      setRoles(rls);
      setLeaves(lvs);
      setLeaveTypes(lvTypes);
      setHolidays(hols);
      setSalaryStructures(sals);
      setHrEvents(evts);
    } catch (err) {
      console.error('HR data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <ModuleGuard module="hr">
        <div className="space-y-8 pb-12">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Employees, attendance, payroll, and HR lifecycle
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="rounded-2xl bg-background border shadow-sm p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="dashboard" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="employees" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Users className="h-3.5 w-3.5" /> Employees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Calendar className="h-3.5 w-3.5" /> Attendance & Leave
              </TabsTrigger>
              <TabsTrigger value="payroll" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <DollarSign className="h-3.5 w-3.5" /> Payroll
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Zap className="h-3.5 w-3.5" /> HR Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0">
              <HRDashboard employees={employees} attendance={attendance} payrolls={payrolls} leaves={leaves} holidays={holidays} />
            </TabsContent>

            <TabsContent value="employees" className="mt-0">
              <EmployeeDirectory employees={employees} departments={departments} roles={roles} onRefresh={fetchAll} />
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <AttendanceLeave employees={employees} leaves={leaves} leaveTypes={leaveTypes} holidays={holidays} onRefresh={fetchAll} />
            </TabsContent>

            <TabsContent value="payroll" className="mt-0">
              <PayrollContent employees={employees} salaryStructures={salaryStructures} payrolls={payrolls} onRefresh={fetchAll} />
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <HREvents employees={employees} events={hrEvents} onRefresh={fetchAll} />
            </TabsContent>
          </Tabs>
        </div>
      </ModuleGuard>
    </DashboardShell>
  );
}
