import re

CODE = """
"use client";

import React, { useState, useMemo } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Users, AlertTriangle, ShieldCheck, DollarSign, Activity, Settings, 
  Plus, Briefcase, FileText, CheckCircle2, TrendingUp, UserMinus, 
  Clock, MapPin, BarChart3, Calculator, Building, Play, Info
} from "lucide-react";
import { toast } from "sonner";

// --- ROLE PERMISSIONS ---
type Role = 'Super Admin' | 'HR Manager' | 'Field Supervisor' | 'Finance Controller' | 'Founder';

const PERMISSIONS = {
  'Super Admin': { manageWorkforce: true, approveLeave: true, modifyPayroll: true, modifyAttendance: true, runPayroll: true, viewStrategic: true, manageCompliance: true },
  'HR Manager': { manageWorkforce: true, approveLeave: true, modifyPayroll: true, modifyAttendance: false, runPayroll: false, viewStrategic: false, manageCompliance: true },
  'Field Supervisor': { manageWorkforce: false, approveLeave: false, modifyPayroll: false, modifyAttendance: true, runPayroll: false, viewStrategic: false, manageCompliance: false },
  'Finance Controller': { manageWorkforce: false, approveLeave: false, modifyPayroll: false, modifyAttendance: false, runPayroll: true, viewStrategic: true, manageCompliance: true },
  'Founder': { manageWorkforce: false, approveLeave: false, modifyPayroll: false, modifyAttendance: false, runPayroll: false, viewStrategic: true, manageCompliance: false },
};

// --- MAIN COMPONENT ---
export default function WorkforceOperatingSystem() {
  const [currentRole, setCurrentRole] = useState<Role>('Super Admin');
  const perms = PERMISSIONS[currentRole];

  // --- MOCK DATABASE STATE ---
  const [employees, setEmployees] = useState([
    { id: 'EMP001', name: 'Alice Smith', department: 'Engineering', designation: 'Senior Dev', salary: 15000, contractType: 'Full-time', status: 'Active', joiningDate: '2023-01-15' },
    { id: 'EMP002', name: 'Bob Jones', department: 'Operations', designation: 'Site Lead', salary: 8500, contractType: 'Contract', status: 'Active', joiningDate: '2023-06-20' },
    { id: 'EMP003', name: 'Charlie Brown', department: 'Operations', designation: 'Technician', salary: 5000, contractType: 'Full-time', status: 'Active', joiningDate: '2024-02-10' },
    { id: 'EMP004', name: 'Diana Prince', department: 'Finance', designation: 'Analyst', salary: 12000, contractType: 'Full-time', status: 'Inactive', joiningDate: '2022-11-01' },
    { id: 'EMP005', name: 'Evan Wright', department: 'Engineering', designation: 'Dev', salary: 9000, contractType: 'Full-time', status: 'Active', joiningDate: '2024-08-01' },
    { id: 'EMP006', name: 'Frank Castle', department: 'Security', designation: 'Guard', salary: 4000, contractType: 'Contract', status: 'Active', joiningDate: '2024-09-15' },
  ]);

  const [attendance, setAttendance] = useState([
    { empId: 'EMP001', date: new Date().toISOString().split('T')[0], status: 'present' },
    { empId: 'EMP002', date: new Date().toISOString().split('T')[0], status: 'absent' },
    { empId: 'EMP003', date: new Date().toISOString().split('T')[0], status: 'late' },
    { empId: 'EMP005', date: new Date().toISOString().split('T')[0], status: 'present' },
    { empId: 'EMP006', date: new Date().toISOString().split('T')[0], status: 'present' },
  ]);

  const [leaves, setLeaves] = useState([
    { id: 'L1', empId: 'EMP001', startDate: '2024-10-10', endDate: '2024-10-12', status: 'pending', days: 3 },
    { id: 'L2', empId: 'EMP002', startDate: '2024-10-15', endDate: '2024-10-15', status: 'approved', days: 1 },
    { id: 'L3', empId: 'EMP005', startDate: '2024-11-01', endDate: '2024-11-05', status: 'pending', days: 5 },
  ]);

  const [assignments, setAssignments] = useState([
    { empId: 'EMP002', siteId: 'Site Alpha', utilization: 110 },
    { empId: 'EMP003', siteId: 'Site Bravo', utilization: 50 },
    { empId: 'EMP001', siteId: 'HQ Lab', utilization: 80 },
    { empId: 'EMP005', siteId: 'HQ Tech', utilization: 90 },
    { empId: 'EMP006', siteId: 'Gate 1', utilization: 100 },
  ]);

  const [payrolls, setPayrolls] = useState([
    { id: 'PR-2024-09', month: 'Sept 2024', totalDisbursed: 49000, variance: 2.1, anomaliesCount: 0, status: 'Completed' },
    { id: 'PR-2024-08', month: 'Aug 2024', totalDisbursed: 48000, variance: 0.5, anomaliesCount: 1, status: 'Completed' },
  ]);

  const [statutory, setStatutory] = useState({
    region: 'UAE', taxModel: 'Corporate Tax', gratuityRule: 'Standard 21 Days', contributionPct: 5
  });

  const [simResults, setSimResults] = useState<any>(null);

  const MOCK_REVENUE = 150000;

  // --- CORE COMPUTATIONS ---
  const activeEmployees = employees.filter(e => e.status === 'Active');
  const inactiveEmployees = employees.filter(e => e.status === 'Inactive');
  const totalHeadcount = employees.length;
  const activeCount = activeEmployees.length;
  
  const totalPayrollLoad = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = activeCount ? totalPayrollLoad / activeCount : 0;

  const totalEntries = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  
  const absenteeismRate = totalEntries ? (absentCount / totalEntries) * 100 : 0;
  const lateRatio = totalEntries ? (lateCount / totalEntries) * 100 : 0;
  
  const totalLeaveDays = leaves.reduce((sum, l) => sum + l.days, 0);
  const leavePressure = activeCount ? (totalLeaveDays / (activeCount * 22)) * 100 : 0;
  
  const underutilized = assignments.filter(a => a.utilization < 60).length;
  const overallocated = assignments.filter(a => a.utilization > 100).length;
  const unutilizedPct = assignments.length ? (underutilized / assignments.length) * 100 : 0;
  
  const payrollPctOfRev = (totalPayrollLoad / MOCK_REVENUE) * 100;
  
  const fieldsSet = [statutory.region, statutory.taxModel, statutory.gratuityRule, statutory.contributionPct].filter(Boolean).length;
  const complianceCompleteness = (fieldsSet / 4) * 100;
  
  const attritionRate = totalHeadcount ? (inactiveEmployees.length / totalHeadcount) * 100 : 0;

  // Global Score (0-100)
  const attendanceScore = totalEntries ? (presentCount / totalEntries) * 100 : 100;
  const leaveScore = Math.max(0, 100 - (leavePressure * 5)); 
  const payrollScore = 100 - Math.max(0, (payrollPctOfRev - 25) * 2); 
  
  const healthScore = Math.round(
    (attendanceScore * 0.25) +
    (leaveScore * 0.15) +
    (payrollScore * 0.20) +
    (complianceCompleteness * 0.20) +
    (Math.max(0, 100 - (attritionRate * 3)) * 0.20)
  );

  // --- ACTIONS ---
  const handleToggleStatus = (id: string) => {
    if (!perms.manageWorkforce) return toast.error("Unauthorized");
    setEmployees(employees.map(e => e.id === id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
    toast.success("Employee status updated");
  };

  const [newSalary, setNewSalary] = useState<number>(0);
  const handleUpdateSalary = (id: string) => {
    if (!perms.modifyPayroll) return toast.error("Unauthorized");
    if (newSalary <= 0) return toast.error("Invalid salary");
    setEmployees(employees.map(e => e.id === id ? { ...e, salary: newSalary } : e));
    toast.success("Salary updated");
  };

  const handleUpdateAttendance = (empId: string, status: string) => {
    if (!perms.modifyAttendance) return toast.error("Unauthorized");
    setAttendance(attendance.map(a => a.empId === empId ? { ...a, status } : a));
    toast.success("Attendance marked");
  };

  const handleLeaveAction = (id: string, stat: string) => {
    if (!perms.approveLeave) return toast.error("Unauthorized");
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: stat } : l));
    toast.success(`Leave request ${stat}`);
  };

  const handleRunPayroll = () => {
    if (!perms.runPayroll) return toast.error("Unauthorized");
    const newCycle = {
      id: `PR-${new Date().toISOString().substring(0,7)}`,
      month: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
      totalDisbursed: totalPayrollLoad,
      variance: 0,
      anomaliesCount: 0,
      status: 'Completed'
    };
    setPayrolls([newCycle, ...payrolls]);
    toast.success("Payroll cycle verified and posted");
  };

  // Simulator State
  const [simHires, setSimHires] = useState(0);
  const [simInflRate, setSimInflRate] = useState(0);

  const runSimulation = () => {
    const projHeadcount = activeCount + simHires;
    const projPayroll = (totalPayrollLoad + (simHires * avgSalary)) * (1 + (simInflRate / 100));
    const projMarginImpt = MOCK_REVENUE - projPayroll;
    setSimResults({ projHeadcount, projPayroll, projMarginImpt });
    toast.success("Simulation complete");
  };

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full">
        
        {/* HEADER & ROLE MOCKER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Workforce OS</h1>
              <p className="text-muted-foreground mt-1">Strategic intelligence, compliance, and operations control.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-semibold text-muted-foreground">Simulated Role</p>
               <p className="text-sm font-bold text-foreground">{currentRole}</p>
             </div>
             <Select value={currentRole} onValueChange={(v) => setCurrentRole(v as Role)}>
               <SelectTrigger className="w-[180px] bg-primary/5 text-primary font-semibold border-primary/20">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Super Admin">Super Admin</SelectItem>
                 <SelectItem value="HR Manager">HR Manager</SelectItem>
                 <SelectItem value="Field Supervisor">Field Supervisor</SelectItem>
                 <SelectItem value="Finance Controller">Finance Controller</SelectItem>
                 <SelectItem value="Founder">Founder</SelectItem>
               </SelectContent>
             </Select>
          </div>
        </div>

        {/* GLOBAL HEALTH SCORE */}
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border shadow-sm overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-foreground">Global Workforce Health Output</h2>
                  <span className="text-2xl font-black text-primary">{healthScore} / 100</span>
                </div>
                <Progress value={healthScore} className="h-3 bg-muted w-full" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                  <span>Critical Risk (&lt;40)</span>
                  <span>Stable (40-80)</span>
                  <span>Optimal (&gt;80)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto shrink-0 flex-1 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Absenteeism</p>
                  <p className={`text-base font-bold ${absenteeismRate > 12 ? 'text-destructive' : 'text-foreground'}`}>{absenteeismRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Leave Pressure</p>
                  <p className={`text-base font-bold ${leavePressure > 8 ? 'text-destructive' : 'text-foreground'}`}>{leavePressure.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Payroll Load</p>
                  <p className={`text-base font-bold ${payrollPctOfRev > 35 ? 'text-destructive' : 'text-foreground'}`}>{payrollPctOfRev.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Compliance</p>
                  <p className={`text-base font-bold ${complianceCompleteness < 100 ? 'text-orange-500' : 'text-emerald-500'}`}>{complianceCompleteness.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN MODULE FRAMEWORK */}
        <Tabs defaultValue="operations" className="w-full">
          <TabsList className="bg-muted p-1 border-b mb-6 h-auto flex flex-wrap gap-1">
            <TabsTrigger value="operations" className="px-6 py-2.5 font-semibold">Operations Layer</TabsTrigger>
            <TabsTrigger value="finance" className="px-6 py-2.5 font-semibold">Finance & Compliance</TabsTrigger>
            {(perms.viewStrategic) && <TabsTrigger value="strategic" className="px-6 py-2.5 font-semibold">Strategic Intelligence</TabsTrigger>}
          </TabsList>

          {/* ===================== OPERATIONS LAYER ===================== */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Workforce Registry */}
              <Card className="lg:col-span-2 shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20 border-b">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> Workforce Registry</CardTitle>
                    <CardDescription>Live headcount: {activeCount} Active / {totalHeadcount} Total</CardDescription>
                  </div>
                  <Button size="sm" disabled={!perms.manageWorkforce}><UserMinus className="h-4 w-4 mr-2"/> Add Resource</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(e => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-semibold text-foreground">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.id} • {e.department}</p>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{e.designation}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={e.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                             {perms.modifyPayroll && (
                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button variant="outline" size="sm" className="h-7 text-xs">Salary</Button>
                                 </DialogTrigger>
                                 <DialogContent>
                                   <DialogHeader><DialogTitle>Update Salary structure</DialogTitle></DialogHeader>
                                   <div className="space-y-4 py-4">
                                     <div className="space-y-2">
                                       <Label>New Basic Salary (AED)</Label>
                                       <Input type="number" onChange={(ev) => setNewSalary(Number(ev.target.value))} defaultValue={e.salary} />
                                     </div>
                                   </div>
                                   <DialogFooter><Button onClick={() => handleUpdateSalary(e.id)}>Confirm</Button></DialogFooter>
                                 </DialogContent>
                               </Dialog>
                             )}
                             <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-destructive" onClick={() => handleToggleStatus(e.id)} disabled={!perms.manageWorkforce}>
                               {e.status === 'Active' ? 'Halt' : 'Reactivate'}
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Attendance & Leave Pipelines */}
              <div className="space-y-6">
                <Card className="shadow-sm border-border">
                  <CardHeader className="pb-2 bg-muted/20 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> Attendance Matrix</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {attendance.map(a => (
                        <div key={a.empId} className="flex justify-between items-center p-3">
                          <span className="text-sm font-semibold">{employees.find(e => e.id === a.empId)?.name || a.empId}</span>
                          <div className="flex gap-1">
                            {['present', 'late', 'absent'].map(s => (
                              <Badge 
                                key={s} 
                                variant={a.status === s ? 'default' : 'outline'} 
                                className={`cursor-pointer capitalize text-[10px] ${a.status === s ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                                onClick={() => handleUpdateAttendance(a.empId, s)}
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border">
                  <CardHeader className="pb-2 bg-muted/20 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/> Leave Pressure: {leavePressure.toFixed(1)}%</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {leaves.filter(l => l.status === 'pending').map(l => (
                        <div key={l.id} className="p-3 space-y-2">
                          <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                            <span>{employees.find(e => e.id === l.empId)?.name}</span>
                            <span>{l.days} Days</span>
                          </div>
                          {perms.approveLeave && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleLeaveAction(l.id, 'rejected')}>Deny</Button>
                              <Button size="sm" className="h-6 text-[10px]" onClick={() => handleLeaveAction(l.id, 'approved')}>Authorize</Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {leaves.filter(l => l.status === 'pending').length === 0 && <div className="p-4 text-xs font-medium text-center text-muted-foreground">No pending leaves.</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===================== FINANCE & COMPLIANCE ===================== */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <Card className="shadow-sm border-border">
                <CardHeader className="bg-muted/20 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary"/> Payroll Execution Engine</CardTitle>
                  <CardDescription>Cycle total load: {totalPayrollLoad.toLocaleString()} AED / {payrollPctOfRev.toFixed(1)}% of Revenue (Target 25%)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {payrollStressRisk && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-800 text-sm">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div><strong className="block">High Payroll Load</strong> Payroll represents {payrollPctOfRev.toFixed(1)}% of revenue, causing margin stress.</div>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 border rounded-md bg-muted/10">
                    <div>
                      <h4 className="font-semibold text-sm">Pending Verification</h4>
                      <p className="text-xs text-muted-foreground">{activeCount} active personnel ready for disbursement.</p>
                    </div>
                    <Button onClick={handleRunPayroll} disabled={!perms.runPayroll} className="shadow-sm">Commit Disbursement</Button>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-bold mb-3">Payslip Archive</h4>
                    <div className="space-y-2">
                       {payrolls.map(pr => (
                         <div key={pr.id} className="flex justify-between items-center p-3 border border-border rounded-md bg-white">
                           <div>
                             <p className="font-bold text-sm text-foreground">{pr.month}</p>
                             <p className="text-xs text-muted-foreground">{pr.id}</p>
                           </div>
                           <div className="text-right">
                             <p className="font-bold text-sm">{pr.totalDisbursed.toLocaleString()} AED</p>
                             <Badge variant="outline" className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50">{pr.status}</Badge>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-sm border-border">
                  <CardHeader className="bg-muted/20 border-b">
                     <CardTitle className="text-base font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/> Statutory & Compliance Core</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                     <div className="flex items-center gap-4 border-b border-border pb-4">
                       <Progress value={complianceCompleteness} className="h-2 flex-grow" />
                       <span className="text-sm font-bold w-12 text-right">{complianceCompleteness}%</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <Label className="text-xs text-muted-foreground">Jurisdiction Region</Label>
                         <Input value={statutory.region} readOnly disabled className="bg-muted/30" />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs text-muted-foreground">Tax Model Enforcement</Label>
                         <Input value={statutory.taxModel} readOnly disabled className="bg-muted/30" />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs text-muted-foreground">Gratuity Standard</Label>
                         <Input value={statutory.gratuityRule} readOnly disabled className="bg-muted/30" />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs text-muted-foreground">Pension/Contribution Load</Label>
                         <Input value={`${statutory.contributionPct}%`} readOnly disabled className="bg-muted/30" />
                       </div>
                     </div>
                     {!perms.manageCompliance && <p className="text-xs text-muted-foreground italic mt-2">Only privileged users can mutate statutory logic.</p>}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Cost Simulator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Projected Hires (+)</Label>
                        <Input type="number" value={simHires} onChange={e => setSimHires(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Global Inflation Bump (%)</Label>
                        <Input type="number" value={simInflRate} onChange={e => setSimInflRate(Number(e.target.value))} />
                      </div>
                    </div>
                    <Button variant="secondary" className="w-full font-bold shadow-sm" onClick={runSimulation} disabled={!perms.viewStrategic && !perms.modifyPayroll}>
                      <Play className="h-4 w-4 mr-2" /> Execute Simulation
                    </Button>
                    {simResults && (
                      <div className="p-3 bg-white border border-border rounded-md mt-4 space-y-2 text-sm shadow-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Proj. Headcount</span><span className="font-bold">{simResults.projHeadcount}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Proj. Target Payroll</span><span className="font-bold text-destructive">{simResults.projPayroll.toLocaleString()} AED</span></div>
                        <div className="flex justify-between pt-2 border-t"><span className="text-muted-foreground">Residual Margin Cap</span><span className="font-bold text-emerald-600">{simResults.projMarginImpt.toLocaleString()} AED</span></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* ===================== STRATEGIC INTELLIGENCE ===================== */}
          {perms.viewStrategic && (
            <TabsContent value="strategic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Growth Attrition</p>
                    <p className={`text-2xl font-black ${attritionRate > 10 ? 'text-destructive' : 'text-foreground'}`}>{attritionRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-muted-foreground">System target: &lt;10.0%</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3" /> Average Tenure</p>
                    <p className="text-2xl font-black text-foreground">1.4 yrs</p>
                    <p className="text-[10px] text-muted-foreground">Based on active records</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><DollarSign className="h-3 w-3" /> Avg Cost / Employee</p>
                    <p className="text-2xl font-black text-foreground">{avgSalary.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">AED per current cycle</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                     <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Activity className="h-3 w-3" /> Operations Underutilization</p>
                     <p className={`text-2xl font-black ${unutilizedPct > 20 ? 'text-destructive' : 'text-foreground'}`}>{unutilizedPct.toFixed(1)}%</p>
                     <p className="text-[10px] text-muted-foreground">Employees billing &lt;60% target</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-border h-full">
                  <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Cost Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4">Top Retained Assets (Cost)</h4>
                    <div className="space-y-3">
                      {[...employees].sort((a,b) => b.salary - a.salary).slice(0,3).map((e, idx) => (
                        <div key={e.id} className="flex items-center justify-between border-b pb-2">
                           <div className="flex items-center gap-3">
                             <div className="font-bold text-muted-foreground w-4">{idx+1}.</div>
                             <div>
                               <p className="text-sm font-bold text-foreground">{e.name}</p>
                               <p className="text-[10px] text-muted-foreground">{e.department} / {e.designation}</p>
                             </div>
                           </div>
                           <span className="font-black text-primary">{e.salary.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-border bg-rose-50/30">
                  <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Organization Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-muted-foreground">Attendance Volatility</span>
                       {attendanceRisk ? <Badge variant="destructive">High</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-none">Nominal</Badge>}
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-muted-foreground">Leave Pressure Constraint</span>
                       {leaveRisk ? <Badge variant="destructive">Critical</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-none">Nominal</Badge>}
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-muted-foreground">Payroll/Margin Squeeze</span>
                       {payrollStressRisk ? <Badge variant="destructive">High Load</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-none">Healthy</Badge>}
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-muted-foreground">Compliance Deficit</span>
                       {complianceRisk ? <Badge className="bg-orange-100 text-orange-800 border-none">Flagged</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-none">Verified</Badge>}
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-muted-foreground">Talent Flight Risk (Attrition)</span>
                       {attritionRisk ? <Badge variant="destructive">Critical</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-none">Stable</Badge>}
                     </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

        </Tabs>

      </div>
    </DashboardShell>
  );
}
"""

with open('/Users/user/Workspace/Projects/Strucureo_Projects/erp/new/bridgebreak/app/(admin)/admin/hr/page.tsx', 'w') as f:
    f.write(CODE.strip())
