'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getLeads, updateLead, createLead } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Target, 
    Plus, 
    DollarSign, 
    TrendingUp, 
    MoreHorizontal, 
    Phone, 
    Mail, 
    Globe, 
    Search, 
    Calendar,
    RefreshCcw,
    Zap,
    ChevronRight,
    ArrowUpRight,
    Activity,
    Briefcase,
    LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Lead } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function AdminLeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [formData, setFormData] = useState<Partial<Lead>>({
        status: 'new',
        probability: 20,
        name: '',
        email: '',
        company: '',
        phone: '',
        potential_value: 0
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getLeads();
            setLeads(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => ({
        totalValue: leads.reduce((s, l) => s + (l.potential_value || 0), 0),
        activeLeads: leads.filter(l => l.status !== 'won' && l.status !== 'lost').length,
        conversion: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0,
        velocity: 14 // Placeholder
    }), [leads]);

    const PIPELINE_STAGES = [
        { id: 'new', label: 'Inbound', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-600' },
        { id: 'contacted', label: 'In Talk', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-600' },
        { id: 'qualified', label: 'Qualified', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-600' },
        { id: 'proposal', label: 'Proposal', color: 'bg-purple-500', light: 'bg-purple-50 text-purple-600' },
        { id: 'negotiation', label: 'Closing', color: 'bg-orange-500', light: 'bg-orange-50 text-orange-600' },
        { id: 'won', label: 'Success', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-600' },
    ];

    const getStageLeads = (stageId: string) => leads.filter(l => 
        l.status === stageId && 
        (l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) return toast.error('Required fields missing');
        try {
            await createLead(formData as any);
            toast.success('Lead added to pipeline');
            setIsCreateOpen(false);
            fetchData();
        } catch { toast.error('Failed to create lead'); }
    };

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-bold text-slate-900">Synchronizing Pipeline...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                
                {/* Visual Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Deal Pipeline</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Manage leads, conversions, and sales opportunities
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                    <Plus className="h-5 w-5 mr-2" /> New Opportunity
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-[2.5rem] p-8">
                                <DialogHeader className="space-y-2">
                                    <DialogTitle className="text-3xl font-black">Register Lead</DialogTitle>
                                    <DialogDescription className="text-base font-medium text-slate-400">Add a new potential client to the sales funnel.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Contact Name</Label>
                                            <Input placeholder="John Doe" className="h-12 rounded-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Email Address</Label>
                                            <Input placeholder="john@example.com" className="h-12 rounded-xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Company</Label>
                                            <Input placeholder="Acme Corp" className="h-12 rounded-xl font-bold" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Potential Value</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                                                <Input type="number" className="h-12 pl-8 rounded-xl font-bold" value={formData.potential_value} onChange={e => setFormData({...formData, potential_value: parseInt(e.target.value)})} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold ml-1">Brief Requirements</Label>
                                        <Textarea placeholder="What are they looking for?" className="rounded-xl min-h-[100px]" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Initialize Deal</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid gap-6 md:grid-cols-4">
                    <LeadKPI title="Pipeline Value" value={`$${(stats.totalValue/1000).toFixed(1)}k`} icon={DollarSign} color="emerald" />
                    <LeadKPI title="Active Deals" value={stats.activeLeads} icon={Activity} color="blue" />
                    <LeadKPI title="Conversion" value={`${stats.conversion}%`} icon={Zap} color="indigo" />
                    <LeadKPI title="Cycle Velocity" value={`${stats.velocity}d`} icon={RefreshCcw} color="slate" />
                </div>

                {/* Pipeline Board */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900">Sales Funnel</h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Find lead or company..." className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    <ScrollArea className="w-full pb-6">
                        <div className="flex gap-6 min-w-max px-2">
                            {PIPELINE_STAGES.map(stage => {
                                const stageLeads = getStageLeads(stage.id);
                                return (
                                    <div key={stage.id} className="w-[320px] flex flex-col gap-6">
                                        <div className="flex items-center justify-between px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{stage.label}</span>
                                            </div>
                                            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-400 font-black border-none px-2">{stageLeads.length}</Badge>
                                        </div>

                                        <div className="space-y-4">
                                            {stageLeads.map(lead => (
                                                <Card key={lead.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1 min-w-0">
                                                                <h4 className="text-base font-black text-slate-900 truncate">{lead.name}</h4>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{lead.company || 'Private Party'}</p>
                                                            </div>
                                                            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 bg-slate-50 text-slate-300")}>
                                                                <Briefcase size={18} />
                                                            </div>
                                                        </div>

                                                        {(lead.potential_value ?? 0) > 0 && (
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Value</span>
                                                                <span className="text-sm font-black text-slate-900">${(lead.potential_value ?? 0).toLocaleString()}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-1.5 w-1.5 rounded-full", (lead.probability ?? 0) > 70 ? 'bg-emerald-500' : (lead.probability ?? 0) > 40 ? 'bg-amber-500' : 'bg-slate-300')} />
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.probability ?? 0}% Prob.</span>
                                                            </div>
                                                            <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {stageLeads.length === 0 && (
                                                <div className="h-32 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center opacity-50">
                                                    <LayoutGrid size={24} className="text-slate-200 mb-2" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Empty Stage</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </DashboardShell>
    );
}

function LeadKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
        slate: "bg-slate-50 text-slate-600 shadow-slate-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}