'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import {
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Zap,
  FileText,
  Settings2,
  LayoutDashboard,
  Fingerprint,
  Activity,
  RefreshCcw as LucideRefresh
} from 'lucide-react';
import {
  getEmployees,
  getAttendance,
  getPayrolls,
  getDepartments,
  getHRRoles,
  getLeaves,
  getLeaveTypes,
  getHolidays,
  getSalaryStructures,
  getHREvents
} from '@/lib/api';
import { HRDashboard } from './_components/hr-dashboard';
import { EmployeeDirectory } from './_components/employee-directory';
import { AttendanceLeave } from './_components/attendance-leave';
import { PayrollContent, PayslipBrowser } from './_components/payroll-content';
import { HREvents } from './_components/hr-events';
import { HRMSSettings } from './_components/hrms-settings';
import type { Employee, Attendance, Payroll, Leave, LeaveType, Holiday, SalaryStructure, HREvent, HRDepartment, HRRole } from '@/lib/db/types';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/lib/tenant-context';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type HRMode = 'dashboard' | 'staff' | 'operations' | 'finance' | 'payslips' | 'setup';

export default function HRPage() {
  const { getModuleLabel } = useTenant();
  const [activeMode, setActiveMode] = useState<HRMode>('dashboard');
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
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('none');

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

      setEmployees((emps as Employee[]) || []);
      setAttendance(att || []);
      setPayrolls((pays as Payroll[]) || []);

      const postedBatch = ((pays as Payroll[]) || []).find(p => p.status === 'posted');
      if (postedBatch) setSelectedPayrollId(postedBatch.id);

      setDepartments(depts || []);
      setRoles(rls || []);
      setLeaves(lvs || []);
      setLeaveTypes(lvTypes || []);
      setHolidays(hols || []);
      setSalaryStructures(sals || []);
      setHrEvents(evts || []);
    } catch (err) {
      console.error('[HR Hub Data Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <LucideRefresh className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">Syncing Personnel Grid</p>
        </div>
      </DashboardShell>
    );
  }

  const activePayroll = payrolls.find(p => p.id === selectedPayrollId);

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">{getModuleLabel('hr')}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Personnel Management Hub</span>
                <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                  Worker Context
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as HRMode)} className="w-full flex-grow flex flex-col">
          <TabsList className="bg-muted p-1 w-full flex justify-start pl-2 rounded-lg gap-1 border-b mb-6 overflow-x-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Dashboard</TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Registry</TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Field Ops</TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Payroll</TabsTrigger>
            <TabsTrigger value="payslips" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Payslips</TabsTrigger>
            <TabsTrigger value="setup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium">Configuration</TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in duration-500">
            <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
              <HRDashboard employees={employees} attendance={attendance} payrolls={payrolls} leaves={leaves} holidays={holidays} />
            </TabsContent>
            <TabsContent value="staff" className="m-0 focus-visible:outline-none space-y-6">
              <EmployeeDirectory employees={employees} departments={departments} roles={roles} onRefresh={fetchAll} />
              <HREvents employees={employees} events={hrEvents} onRefresh={fetchAll} />
            </TabsContent>
            <TabsContent value="operations" className="m-0 focus-visible:outline-none">
              <AttendanceLeave employees={employees} leaves={leaves} leaveTypes={leaveTypes} holidays={holidays} onRefresh={fetchAll} />
            </TabsContent>
            <TabsContent value="finance" className="m-0 focus-visible:outline-none">
              <PayrollContent employees={employees} salaryStructures={salaryStructures} payrolls={payrolls} onRefresh={fetchAll} />
            </TabsContent>
            <TabsContent value="payslips" className="m-0 focus-visible:outline-none space-y-6">
              <Card className="border shadow-none bg-muted/40 border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Disbursement Archive</p>
                      <p className="text-sm text-muted-foreground">Select a payroll cycle to view its corresponding payslips.</p>
                    </div>
                  </div>
                  <Select value={selectedPayrollId} onValueChange={setSelectedPayrollId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {payrolls.filter(p => p.status === 'processed' || p.status === 'posted' || p.status === 'approved').length === 0 ? (
                        <SelectItem value="none" disabled>No Cycles Available</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none" disabled>Select a Cycle</SelectItem>
                          {payrolls.filter(p => p.status === 'processed' || p.status === 'posted' || p.status === 'approved').map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.month} Cycle ({p.status})</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              {activePayroll ? <PayslipBrowser payroll={activePayroll} /> : (
                <div className="py-20 text-center border-2 border-dashed rounded-md border-border bg-muted/20">
                  <p className="text-sm font-medium text-muted-foreground">
                    {payrolls.filter(p => p.status === 'processed' || p.status === 'posted' || p.status === 'approved').length === 0
                      ? 'No payroll cycles available. Go to Payroll tab to run your first cycle.'
                      : 'Select a cycle above to view payslips'}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="setup" className="m-0 focus-visible:outline-none">
              <HRMSSettings roles={roles} departments={departments} onRefresh={fetchAll} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
