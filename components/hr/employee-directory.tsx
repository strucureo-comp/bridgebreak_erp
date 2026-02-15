'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createEmployee } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Employee, HRDepartment, HRRole } from '@/lib/db/types';

interface EmployeeDirectoryProps {
    employees: Employee[];
    departments: HRDepartment[];
    roles: HRRole[];
    onRefresh: () => void;
}

export function EmployeeDirectory({ employees, departments, roles, onRefresh }: EmployeeDirectoryProps) {
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [open, setOpen] = useState(false);

    const filtered = employees.filter(e => {
        if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.employee_id.toLowerCase().includes(search.toLowerCase())) return false;
        if (deptFilter !== 'all' && (e.dept?.name || e.department) !== deptFilter) return false;
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        return true;
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await createEmployee({
                employee_id: fd.get('employee_id'),
                name: fd.get('name'),
                role: fd.get('role'),
                skill_type: fd.get('skill_type') || 'General',
                employment_type: fd.get('employment_type'),
                department: fd.get('department'),
                department_id: fd.get('department_id') || undefined,
                joining_date: fd.get('joining_date'),
                basic_salary: fd.get('basic_salary'),
                email: fd.get('email'),
                phone: fd.get('phone'),
            });
            toast.success('Employee created');
            setOpen(false);
            onRefresh();
        } catch { toast.error('Failed to create employee'); }
    };

    const lifecycleColors: Record<string, string> = {
        probation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        notice_period: 'bg-orange-50 text-orange-700 border-orange-200',
        resigned: 'bg-slate-50 text-slate-500 border-slate-200',
        terminated: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 flex-1 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl h-10 bg-white border-slate-200" />
                    </div>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectTrigger className="w-40 rounded-xl h-10 bg-white"><SelectValue placeholder="Department" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 rounded-xl h-10 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Employee</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg rounded-3xl">
                        <DialogHeader><DialogTitle>New Employee</DialogTitle><DialogDescription>Enter employee details below</DialogDescription></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Input name="employee_id" placeholder="EMP-001" required className="rounded-xl" />
                                <Input name="name" placeholder="Full Name" required className="rounded-xl" />
                                <Input name="email" placeholder="Email" type="email" className="rounded-xl" />
                                <Input name="phone" placeholder="Phone" className="rounded-xl" />
                                <Input name="role" placeholder="Designation" required className="rounded-xl" />
                                <select name="employment_type" required className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                    <option value="">Type</option>
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Daily">Daily</option>
                                </select>
                                <select name="department_id" className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                    <option value="">Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <Input name="joining_date" type="date" required className="rounded-xl" />
                                <Input name="basic_salary" type="number" placeholder="Basic Salary" className="rounded-xl" />
                                <Input name="skill_type" placeholder="Skill Type" className="rounded-xl" />
                            </div>
                            <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Create Employee</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Employee Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map(emp => (
                    <Card key={emp.id} className="rounded-2xl border-none shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-slate-800 truncate">{emp.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-medium">{emp.employee_id}</p>
                                </div>
                                <Badge variant="outline" className={cn('ml-auto text-[9px] shrink-0', emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400')}>
                                    {emp.status}
                                </Badge>
                            </div>
                            <div className="mt-4 space-y-1.5 text-[11px]">
                                <div className="flex justify-between text-slate-500"><span>Role</span><span className="font-semibold text-slate-700">{emp.role}</span></div>
                                <div className="flex justify-between text-slate-500"><span>Dept</span><span className="font-semibold text-slate-700">{emp.dept?.name || emp.department || '—'}</span></div>
                                <div className="flex justify-between text-slate-500"><span>Type</span><span className="font-semibold text-slate-700">{emp.employment_type}</span></div>
                                {emp.lifecycle_status && (
                                    <div className="flex justify-between text-slate-500"><span>Stage</span>
                                        <Badge variant="outline" className={cn('text-[9px]', lifecycleColors[emp.lifecycle_status] || '')}>
                                            {emp.lifecycle_status?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {filtered.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">No employees found</p>}
        </div>
    );
}
