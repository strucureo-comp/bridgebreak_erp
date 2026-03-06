'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Users,
  Fingerprint,
  LayoutTemplate
} from 'lucide-react';
import { toast } from 'sonner';
import { createEmployee, updateEmployee } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Employee, HRDepartment, HRRole } from '@/lib/db/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/lib/tenant-context';

interface EmployeeDirectoryProps {
  employees: Employee[];
  departments: HRDepartment[];
  roles: HRRole[];
  onRefresh: () => void;
}

export function EmployeeDirectory({ employees, departments, roles, onRefresh }: EmployeeDirectoryProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [adjustSalaryOpen, setAdjustSalaryOpen] = useState(false);
  const [newSalary, setNewSalary] = useState('');

  const filtered = employees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.employee_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter !== 'all' && (e.dept?.name || e.department) !== deptFilter) return false;
    return true;
  });

  const { companyProfile } = useTenant();
  const currency = companyProfile?.baseCurrency || 'AED';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const empData = {
        employee_id: fd.get('employee_id') as string,
        name: fd.get('name') as string,
        hr_role_id: (fd.get('role') as string) || undefined,
        employment_type: fd.get('employment_type') as string,
        department_id: (fd.get('department_id') as string) || undefined,
        joining_date: fd.get('joining_date') as string,
        basic_salary: parseFloat(fd.get('basic_salary') as string) || 0,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
        status: 'active'
      };

      const result = await createEmployee(empData);
      if (result) {
        toast.success('Employee onboarded successfully');
        form.reset();
        setOpen(false);
        setTimeout(() => onRefresh(), 500);
      } else {
        toast.error('Failed to save employee');
      }
    } catch (err) {
      console.error('Employee creation error:', err);
      toast.error('Onboarding failed. Check if roles/departments exist.');
    }
  };

  const handleAdjustSalary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    const salary = parseFloat(newSalary);
    if (isNaN(salary) || salary < 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    try {
      await updateEmployee(selectedEmployee.id, { basic_salary: salary });
      toast.success('Salary adjusted successfully');
      setAdjustSalaryOpen(false);
      setNewSalary('');
      setTimeout(() => onRefresh(), 500);
    } catch (err) {
      console.error('Salary update error:', err);
      toast.error('Failed to adjust salary');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find staff member..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 border-border text-sm"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full md:w-44 h-10 border-border text-xs font-medium">
              <SelectValue placeholder="All Depts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 px-6 gap-2 bg-primary hover:bg-primary/90 font-medium text-xs shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Onboard Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className=" text-foreground">New Staff Entry</DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground">Initialize Identity & Core Role</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-8 pt-4">
              <div className="space-y-4">
                <Label className="text-xs font-semibold text-primary">1. Personal Identity</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Employee ID</Label>
                    <Input name="employee_id" placeholder="SSE-000" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Full Legal Name</Label>
                    <Input name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Corporate Email</Label>
                    <Input name="email" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Joining Date</Label>
                    <Input name="joining_date" type="date" required />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-semibold text-primary">2. Role & Compensation</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Designation (Role)</Label>
                    <select
                      name="role"
                      required
                      className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs font-medium tracking-wide outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Select Role...</option>
                      {roles && roles.length > 0 ? (
                        roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)
                      ) : (
                        <option value="">No roles available</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Base Salary ({currency})</Label>
                    <Input name="basic_salary" type="number" required placeholder="0.00" className="font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Work Unit</Label>
                    <select
                      name="department_id"
                      className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs font-medium tracking-wide outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Select Dept...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Employment Type</Label>
                    <select
                      name="employment_type"
                      required
                      className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs font-medium tracking-wide outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="contract">Contract</option>
                      <option value="part-time">Part-Time</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary h-12 font-medium text-xs">Commit Personnel Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(emp => (
          <Card
            key={emp.id || (emp as any)._id}
            onClick={() => setSelectedEmployee(emp)}
            className="border shadow-sm rounded-md hover:border-primary/50 transition-colors cursor-pointer group bg-card"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-medium text-xs shadow-lg">
                  {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs font-semibold",
                  emp.status === 'active' ? "border-emerald-100 text-emerald-700 bg-emerald-50" : "text-muted-foreground"
                )}>
                  {emp.status}
                </Badge>
              </div>

              <div className="space-y-0.5 mb-4">
                <h3 className="text-sm font-medium text-foreground truncate">{emp.name}</h3>
                <p className="text-xs font-medium text-muted-foreground">{emp.role || '—'}</p>
                <p className="text-xs font-medium text-muted-foreground">{emp.dept?.name || emp.department || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Fingerprint className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium">{emp.employee_id}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground justify-end">
                  <span className="text-xs font-semibold text-emerald-500">{currency}</span>
                  <span className="text-xs font-semibold text-foreground">{Number(emp.basic_salary).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <SheetContent className="sm:max-w-xl p-0">
          {selectedEmployee && (
            <div className="flex flex-col h-full bg-card">
              <div className="p-6 bg-primary/10 text-primary">
                <div className="flex items-start justify-between mb-8">
                  <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-primary text-card-foreground border-none font-medium text-xs px-3 py-1">{selectedEmployee.status}</Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-primary text-xs font-medium">{selectedEmployee.employee_id}</p>
                  <h2 className="text-3xl font-medium">{selectedEmployee.name}</h2>
                  <p className="text-muted-foreground font-medium text-sm">{selectedEmployee.role} · {selectedEmployee.dept?.name || selectedEmployee.department}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="bg-muted/50 border h-10 p-0.5 w-full">
                    <TabsTrigger value="profile" className="flex-1 text-xs font-medium h-full data-[state=active]:bg-white">Identity</TabsTrigger>
                    <TabsTrigger value="compensation" className="flex-1 text-xs font-medium h-full data-[state=active]:bg-white">Compensation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailBox icon={Briefcase} label="Designation" value={selectedEmployee.role || '—'} />
                      <DetailBox icon={Users} label="Department" value={selectedEmployee.dept?.name || selectedEmployee.department || '—'} />
                      <DetailBox icon={Mail} label="Email" value={selectedEmployee.email || '—'} />
                      <DetailBox icon={Phone} label="Phone" value={selectedEmployee.phone || '—'} />
                      <DetailBox icon={Calendar} label="Joined" value={new Date(selectedEmployee.joining_date).toLocaleDateString('en-AE')} />
                      <DetailBox icon={Briefcase} label="Employment Type" value={selectedEmployee.employment_type} />
                    </div>
                  </TabsContent>

                  <TabsContent value="compensation" className="space-y-6 animate-in fade-in duration-300">
                    <Card className="border-border shadow-none bg-muted border-dashed">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                              <span className="h-5 w-5 font-bold flex items-center justify-center">{currency}</span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Base Rate</p>
                              <p className="text-xl font-semibold text-foreground">{currency} {Number(selectedEmployee.basic_salary || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs font-medium" onClick={() => setAdjustSalaryOpen(true)}>Adjust</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={adjustSalaryOpen} onOpenChange={setAdjustSalaryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Salary</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Update {selectedEmployee?.name}'s base salary
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustSalary} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Current Salary ({currency})</Label>
              <p className="text-sm font-semibold text-foreground bg-muted/50 rounded-md p-3">
                {currency} {Number(selectedEmployee?.basic_salary || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">New Salary ({currency})</Label>
              <Input 
                type="number" 
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="Enter new salary amount"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary h-10 font-medium text-xs">
              Confirm Adjustment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailBox({ icon: Icon, label, value }: any) {
  return (
    <div className="space-y-1.5 p-3 rounded-md border border-border bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={12} className="text-primary" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
