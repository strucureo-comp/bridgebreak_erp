'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle, XCircle, CalendarDays, TreePalm, ChevronRight, MessageSquare, User, Search } from 'lucide-react';
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
        employee_id: fd.get('employee_id') as string,
        leave_type_id: fd.get('leave_type_id') as string,
        from_date: fd.get('from_date') as string,
        to_date: fd.get('to_date') as string,
        days: fd.get('days') as string,
        reason: fd.get('reason') as string,
      });
      toast.success('Leave application submitted successfully');
      setLeaveOpen(false);
      onRefresh();
    } catch { toast.error('Failed to apply leave'); }
  };

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave request ${status}`);
      onRefresh();
    } catch { toast.error('Failed to update leave status'); }
  };

  const handleCreateHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createHoliday({ 
        name: fd.get('name') as string, 
        date: fd.get('date') as string, 
        type: fd.get('type') as string 
      });
      toast.success('Holiday added to calendar');
      setHolidayOpen(false);
      onRefresh();
    } catch { toast.error('Failed to add holiday'); }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="leaves" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 border h-10 p-0.5">
            <TabsTrigger value="leaves" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Leave Pipeline
            </TabsTrigger>
            <TabsTrigger value="holidays" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Company Calendar
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 gap-2">
                  <Plus className="h-3.5 w-3.5" /> Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Leave Application</DialogTitle>
                  <DialogDescription>Submit a formal request for time off.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Employee</Label>
                    <select name="employee_id" required className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
                      <option value="">Select Architect</option>
                      {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
                      <Input name="from_date" type="date" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
                      <Input name="to_date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Reason</Label>
                    <Input name="reason" placeholder="Medical, Annual, etc." />
                  </div>
                  <Button type="submit" className="w-full bg-primary h-10 font-medium text-xs">Submit Request</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                  <CalendarDays className="h-3.5 w-3.5" /> Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Configure Holiday</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateHoliday} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                    <Input name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                    <Input name="date" type="date" required />
                  </div>
                  <Button type="submit" className="w-full bg-primary h-10 font-medium text-xs">Save Holiday</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="leaves" className="mt-0">
          <Card className="border shadow-sm rounded-md overflow-hidden">
            <CardHeader className="border-b bg-muted/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Filter..." className="h-8 pl-7 w-40 text-xs rounded-md" />
              </div>
            </CardHeader>
            <div className="divide-y">
              {leaves.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="text-xs font-medium italic">All caught up. No pending requests.</p>
                </div>
              ) : (
                leaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs">
                        {leave.employee?.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{leave.employee?.name}</p>
                          <Badge variant="outline" className={cn(
                           "text-xs font-semibold",
                            leave.status === 'approved' ?"border-emerald-100 text-emerald-700 bg-emerald-50" :
                            leave.status === 'pending' ?"border-amber-100 text-amber-700 bg-amber-50" :
                           "border-border text-muted-foreground"
                          )}>{leave.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {leave.leave_type?.name} · {new Date(leave.from_date).toLocaleDateString()} to {new Date(leave.to_date).toLocaleDateString()} ({leave.days}d)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {leave.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                            onClick={() => handleLeaveAction(leave.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full"
                            onClick={() => handleLeaveAction(leave.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-zinc-900 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {holidays.map(h => (
              <Card key={h.id} className="border shadow-sm rounded-md overflow-hidden bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex flex-col items-center justify-center leading-none">
                      <span className="text-xs font-semibold opacity-60">
                        {new Date(h.date).toLocaleDateString('en-AE', { month: 'short' })}
                      </span>
                      <span className="text-lg font-medium">
                        {new Date(h.date).getDate()}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold bg-muted text-muted-foreground border-none px-2 py-0.5">
                      {h.type}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-foreground">{h.name}</h4>
                    <p className="text-xs font-medium text-muted-foreground">
                      {new Date(h.date).toLocaleDateString('en-AE', { weekday: 'long' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}