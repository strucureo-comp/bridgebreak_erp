'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserPlus, Star, ArrowRightLeft, LogOut, AlertCircle, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { createHREvent } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Employee, HREvent } from '@/lib/db/types';

interface HREventsProps {
    employees: Employee[];
    events: HREvent[];
    onRefresh: () => void;
}

const eventIcons: Record<string, any> = {
    hiring: UserPlus, appraisal: Star, promotion: TrendingUp, transfer: ArrowRightLeft,
    warning: AlertCircle, layoff: LogOut, exit: LogOut,
};

const eventColors: Record<string, string> = {
    hiring: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    appraisal: 'bg-amber-50 text-amber-600 border-amber-200',
    promotion: 'bg-blue-50 text-blue-600 border-blue-200',
    transfer: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    warning: 'bg-orange-50 text-orange-600 border-orange-200',
    layoff: 'bg-red-50 text-red-600 border-red-200',
    exit: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function HREvents({ employees, events, onRefresh }: HREventsProps) {
    const [open, setOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');

    const filtered = typeFilter === 'all' ? events : events.filter(e => e.type === typeFilter);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await createHREvent({
                employee_id: fd.get('employee_id'),
                type: fd.get('type'),
                title: fd.get('title'),
                description: fd.get('description'),
                event_date: fd.get('event_date'),
                effective_date: fd.get('effective_date') || undefined,
            });
            toast.success('HR Event recorded');
            setOpen(false);
            onRefresh();
        } catch { toast.error('Failed to create event'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-44 rounded-xl h-10 bg-white"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {['hiring', 'appraisal', 'promotion', 'transfer', 'warning', 'layoff', 'exit'].map(t => (
                            <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-xs"><Plus className="h-3.5 w-3.5" /> Record Event</Button></DialogTrigger>
                    <DialogContent className="max-w-md rounded-3xl">
                        <DialogHeader><DialogTitle>Record HR Event</DialogTitle><DialogDescription>Log a lifecycle event for an employee</DialogDescription></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-3 mt-2">
                            <select name="employee_id" required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>)}
                            </select>
                            <select name="type" required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                <option value="">Event Type</option>
                                {['hiring', 'appraisal', 'promotion', 'transfer', 'warning', 'layoff', 'exit'].map(t => (
                                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                            <Input name="title" placeholder="Title" required className="rounded-xl" />
                            <Input name="description" placeholder="Description (optional)" className="rounded-xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input name="event_date" type="date" required className="rounded-xl" />
                                <Input name="effective_date" type="date" placeholder="Effective Date" className="rounded-xl" />
                            </div>
                            <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Record</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-4">
                    {filtered.map(event => {
                        const Icon = eventIcons[event.type] || Award;
                        return (
                            <div key={event.id} className="relative pl-14">
                                <div className={cn('absolute left-2 top-4 h-8 w-8 rounded-lg flex items-center justify-center z-10 border', eventColors[event.type] || 'bg-slate-50')}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <Card className="rounded-2xl border-none shadow-sm bg-white hover:shadow-lg transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800">{event.title}</h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {event.employee?.name} · {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                {event.description && <p className="text-xs text-slate-500 mt-1">{event.description}</p>}
                                            </div>
                                            <Badge variant="outline" className={cn('text-[10px] capitalize', eventColors[event.type])}>{event.type}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-12 pl-14">No events recorded</p>}
                </div>
            </div>
        </div>
    );
}
