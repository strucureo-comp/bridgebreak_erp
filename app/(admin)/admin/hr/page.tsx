'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
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
import { HRDashboard } from '@/components/hr/hr-dashboard';
import { EmployeeDirectory } from '@/components/hr/employee-directory';
import { AttendanceLeave } from '@/components/hr/attendance-leave';
import { PayrollContent, PayslipBrowser } from '@/components/hr/payroll-content';
import { HREvents } from '@/components/hr/hr-events';
import { HRMSSettings } from '@/components/hr/hrms-settings';
import type { Employee, Attendance, Payroll, Leave, LeaveType, Holiday, SalaryStructure, HREvent, HRDepartment, HRRole } from '@/lib/db/types';
import { ModuleGuard } from '@/components/layout/module-guard';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/lib/tenant-context';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
      
      setEmployees(emps || []);
      setAttendance(att || []);
      setPayrolls(pays || []);
      
      const postedBatch = (pays || []).find(p => p.status === 'posted');
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing Personnel Grid</p>
        </div>
      </DashboardShell>
    );
  }

  const activePayroll = payrolls.find(p => p.id === selectedPayrollId);

  return (
    <DashboardShell requireAdmin>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 bg-card -mx-4 px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">{getModuleLabel('hr')}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Operational Hub</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-4 hidden lg:flex text-right">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Management Mode</span>
                    <span className="text-xs font-black text-foreground uppercase mt-1">{activeMode} Control</span>
                </div>
                <Select value={activeMode} onValueChange={(v) => setActiveMode(v as HRMode)}>
                    <SelectTrigger className="w-full md:w-56 h-10 border-primary bg-card shadow-lg shadow-primary/5 rounded-md text-xs font-black uppercase tracking-widest">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border">
                        <SelectItem value="dashboard" className="text-xs font-bold uppercase tracking-wide">Overview</SelectItem>
                        <SelectItem value="staff" className="text-xs font-bold uppercase tracking-wide">Registry</SelectItem>
                        <SelectItem value="operations" className="text-xs font-bold uppercase tracking-wide">Field Ops</SelectItem>
                        <SelectItem value="finance" className="text-xs font-bold uppercase tracking-wide">Payroll</SelectItem>
                        <SelectItem value="payslips" className="text-xs font-bold uppercase tracking-wide">Payslips</SelectItem>
                        <SelectItem value="setup" className="text-xs font-bold uppercase tracking-wide">Config</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="animate-in fade-in duration-500 pt-2">
            {activeMode === 'dashboard' && <HRDashboard employees={employees} attendance={attendance} payrolls={payrolls} leaves={leaves} holidays={holidays} />}
            {activeMode === 'staff' && (
                <div className="space-y-6">
                    <EmployeeDirectory employees={employees} departments={departments} roles={roles} onRefresh={fetchAll} />
                    <HREvents employees={employees} events={hrEvents} onRefresh={fetchAll} />
                </div>
            )}
            {activeMode === 'operations' && <AttendanceLeave employees={employees} leaves={leaves} leaveTypes={leaveTypes} holidays={holidays} onRefresh={fetchAll} />}
            {activeMode === 'finance' && <PayrollContent employees={employees} salaryStructures={salaryStructures} payrolls={payrolls} onRefresh={fetchAll} />}
            {activeMode === 'payslips' && (
                <div className="space-y-6">
                    <Card className="border shadow-none bg-muted border-border">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-foreground text-card-foreground flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Disbursement Archive</p>
                            </div>
                            <Select value={selectedPayrollId} onValueChange={setSelectedPayrollId}>
                                <SelectTrigger className="w-48 h-8 text-[10px] font-black uppercase border-border bg-card">
                                    <SelectValue placeholder="Select Batch..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled className="text-[10px] font-bold uppercase">No Cycles Found</SelectItem>
                                    {payrolls.filter(p => p.status === 'posted').map(p => (
                                        <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase">{p.month} Batch</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    {activePayroll ? <PayslipBrowser payroll={activePayroll} /> : (
                        <div className="py-20 text-center border-2 border-dashed rounded-md bg-muted">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Select a verified cycle to access digital payslips</p>
                        </div>
                    )}
                </div>
            )}
            {activeMode === 'setup' && <HRMSSettings />}
          </div>
        </div>
    </DashboardShell>
  );
}
