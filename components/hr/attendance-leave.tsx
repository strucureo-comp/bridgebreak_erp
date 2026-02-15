'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle, XCircle, CalendarDays, TreePalm } from 'lucide-react';
import { toast } from 'sonner';
import { applyLeave, updateLeaveStatus, createHoliday } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Employee, Leave, LeaveType, Holiday } from '@/lib/db/types';

interface AttendanceLeaveProps {
    employees: Employee[];
    leaves: Leave[];
    leaveTypes: LeaveType[];
    holidays: Holiday[];
    onRefresh: () => void;
}

export function AttendanceLeave({ employees, leaves, leaveTypes, holidays, onRefresh }: AttendanceLeaveProps) {
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [holidayOpen, setHolidayOpen] = useState(false);

    const handleApplyLeave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await applyLeave({
                employee_id: fd.get('employee_id'),
                leave_type_id: fd.get('leave_type_id'),
                from_date: fd.get('from_date'),
                to_date: fd.get('to_date'),
                days: fd.get('days'),
                reason: fd.get('reason'),
            });
            toast.success('Leave applied');
            setLeaveOpen(false);
            onRefresh();
        } catch { toast.error('Failed to apply leave'); }
    };

    const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateLeaveStatus(id, status);
            toast.success(`Leave ${status}`);
            onRefresh();
        } catch { toast.error('Failed to update leave'); }
    };

    const handleCreateHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await createHoliday({ name: fd.get('name'), date: fd.get('date'), type: fd.get('type') });
            toast.success('Holiday added');
            setHolidayOpen(false);
            onRefresh();
        } catch { toast.error('Failed to add holiday'); }
    };

    const statusBadge: Record<string, string> = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
        cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
    };

    return (
        <Tabs defaultValue="leaves" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <TabsList className="rounded-xl bg-white/80 border shadow-sm">
                    <TabsTrigger value="leaves" className="rounded-lg text-xs gap-1.5"><Clock className="h-3.5 w-3.5" />Leave Requests</TabsTrigger>
                    <TabsTrigger value="holidays" className="rounded-lg text-xs gap-1.5"><TreePalm className="h-3.5 w-3.5" />Holiday Calendar</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                    <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                        <DialogTrigger asChild><Button size="sm" className="rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs"><Plus className="h-3.5 w-3.5" /> Apply Leave</Button></DialogTrigger>
                        <DialogContent className="max-w-md rounded-3xl">
                            <DialogHeader><DialogTitle>Apply Leave</DialogTitle><DialogDescription>Submit a leave request</DialogDescription></DialogHeader>
                            <form onSubmit={handleApplyLeave} className="space-y-3 mt-2">
                                <select name="employee_id" required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                    <option value="">Select Employee</option>
                                    {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>)}
                                </select>
                                <select name="leave_type_id" required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                    <option value="">Leave Type</option>
                                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.days_per_year} days/yr)</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input name="from_date" type="date" required className="rounded-xl" />
                                    <Input name="to_date" type="date" required className="rounded-xl" />
                                </div>
                                <Input name="days" type="number" step="0.5" placeholder="No. of days" required className="rounded-xl" />
                                <Input name="reason" placeholder="Reason" className="rounded-xl" />
                                <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Submit</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
                        <DialogTrigger asChild><Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs"><CalendarDays className="h-3.5 w-3.5" /> Add Holiday</Button></DialogTrigger>
                        <DialogContent className="max-w-sm rounded-3xl">
                            <DialogHeader><DialogTitle>Add Holiday</DialogTitle><DialogDescription>Add a new holiday to the calendar</DialogDescription></DialogHeader>
                            <form onSubmit={handleCreateHoliday} className="space-y-3 mt-2">
                                <Input name="name" placeholder="Holiday Name" required className="rounded-xl" />
                                <Input name="date" type="date" required className="rounded-xl" />
                                <select name="type" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                    <option value="public">Public</option>
                                    <option value="restricted">Restricted</option>
                                    <option value="optional">Optional</option>
                                </select>
                                <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Add</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <TabsContent value="leaves" className="space-y-4 mt-0">
                {leaves.length === 0 ? (
                    <Card className="rounded-3xl border-none shadow-sm bg-white p-12 text-center"><p className="text-sm text-slate-400">No leave requests found</p></Card>
                ) : (
                    <div className="grid gap-3">
                        {leaves.map(leave => (
                            <Card key={leave.id} className="rounded-2xl border-none shadow-sm bg-white">
                                <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {leave.employee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-slate-800">{leave.employee?.name || 'Employee'}</h4>
                                        <p className="text-[11px] text-slate-400">{leave.leave_type?.name} · {leave.days} day(s) · {new Date(leave.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(leave.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                        {leave.reason && <p className="text-[11px] text-slate-500 mt-0.5">"{leave.reason}"</p>}
                                    </div>
                                    <Badge variant="outline" className={cn('text-[10px]', statusBadge[leave.status])}>{leave.status}</Badge>
                                    {leave.status === 'pending' && (
                                        <div className="flex gap-1.5">
                                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => handleLeaveAction(leave.id, 'approved')}>
                                                <CheckCircle className="h-3.5 w-3.5" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleLeaveAction(leave.id, 'rejected')}>
                                                <XCircle className="h-3.5 w-3.5" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="holidays" className="mt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {holidays.map(h => {
                        const isPast = new Date(h.date) < new Date();
                        return (
                            <Card key={h.id} className={cn('rounded-2xl border-none shadow-sm bg-white', isPast && 'opacity-60')}>
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={cn('h-12 w-12 rounded-xl flex flex-col items-center justify-center text-center shrink-0', isPast ? 'bg-slate-100' : 'bg-indigo-50')}>
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{new Date(h.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                                        <span className="text-lg font-black text-indigo-700 leading-none">{new Date(h.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800">{h.name}</h4>
                                        <p className="text-[11px] text-slate-400">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-auto text-[9px] capitalize">{h.type}</Badge>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {holidays.length === 0 && <p className="text-center text-slate-400 py-12 text-sm col-span-full">No holidays configured</p>}
                </div>
            </TabsContent>
        </Tabs>
    );
}
