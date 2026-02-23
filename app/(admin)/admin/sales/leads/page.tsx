'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getLeads, createLead, updateLead, deleteLead } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Plus, DollarSign, Search, Zap, Loader2, Mail, Phone, Building2, User, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TenantSetupStatus } from '@/lib/module-gate';
import { useTenant } from '@/lib/tenant-context';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import type { Lead } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { ModuleGuard } from '@/components/shared/layout/module-guard';

export default function AdminLeadsPage() {
    const { user } = useAuth();
    const { companyProfile } = useTenant();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Feature gate check for B2B/B2C
    const isRetail = companyProfile?.businessType === 'b2c_retail';

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', company: '', phone: '', potential_value: 0, notes: ''
    });

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getLeads();
            setLeads(data as any || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        totalValue: leads.reduce((s, l) => s + (l.potential_value || 0), 0),
        activeLeads: leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length,
    }), [leads]);

    const PIPELINE_STAGES = [
        { id: 'new', label: 'New/Inbound', color: 'bg-blue-500' },
        { id: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
        { id: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
        { id: 'lost', label: 'Lost', color: 'bg-red-500' },
        { id: 'converted', label: 'Converted', color: 'bg-emerald-500' },
    ];

    const getStageLeads = (stageId: string) => leads.filter(l =>
        l.status === stageId &&
        ((l.first_name + ' ' + l.last_name).toLowerCase().includes(searchQuery.toLowerCase()) || l.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = async () => {
        if (!formData.first_name || !formData.last_name || !formData.email) return toast.error('Required fields missing');
        try {
            if (editingId) {
                await updateLead(editingId, formData);
                toast.success('Lead updated successfully');
            } else {
                await createLead(formData);
                toast.success('Lead added to pipeline');
            }
            setIsCreateOpen(false);
            setEditingId(null);
            fetchData();
            setFormData({ first_name: '', last_name: '', email: '', company: '', phone: '', potential_value: 0, notes: '' });
        } catch { toast.error(editingId ? 'Update failed' : 'Failed to create lead'); }
    };

    const handleEdit = (lead: Lead) => {
        setFormData({
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            company: lead.company || '',
            phone: lead.phone || '',
            potential_value: lead.potential_value || 0,
            notes: lead.notes || ''
        });
        setEditingId(lead.id);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            await deleteLead(id);
            toast.success('Lead deleted');
            fetchData();
        } catch { toast.error('Failed to delete lead'); }
    };

    if (loading) return null;

    if (isRetail) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold">Not Applicable</h2>
                    <p className="text-muted-foreground mt-2">Leads management is disabled for Retail/B2C operations.</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-6 max-w-7xl mx-auto pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">Lead Management</h1>
                            <p className="text-muted-foreground mt-1">Organize and track new prospects.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search records..." className="pl-9 h-10 w-64 border-border bg-background" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>

                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-10 gap-2 font-bold shadow-sm">
                                        <Plus className="h-4 w-4" /> New Lead
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-0 border-none shadow-2xl">
                                    <div className="bg-background">
                                        <div className="p-6 border-b border-border">
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{editingId ? 'Edit Lead' : 'Register Lead'}</h3>
                                            <p className="text-muted-foreground text-xs mt-0.5">{editingId ? 'Update lead details' : 'Add a new potential client.'}</p>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold font-bold ml-1">First Name</Label>
                                                    <Input placeholder="John" className="h-10 bg-background" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold font-bold ml-1">Last Name</Label>
                                                    <Input placeholder="Doe" className="h-10 bg-background" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold ml-1">Email Address</Label>
                                                    <Input placeholder="john@example.com" className="h-10 bg-background" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold ml-1">Company</Label>
                                                    <Input placeholder="Acme Corp" className="h-10 bg-background" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold ml-1">Potential Value</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input type="number" className="h-10 pl-8 bg-background" value={formData.potential_value || ''} onChange={e => setFormData({ ...formData, potential_value: parseInt(e.target.value) })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold ml-1">Notes</Label>
                                                <Textarea placeholder="What are they looking for?" className="bg-background min-h-[100px]" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="p-6 border-t border-border flex justify-end">
                                            <Button onClick={handleSubmit} className="h-10 px-8 font-bold">{editingId ? 'Update Lead' : 'Add Lead'}</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {PIPELINE_STAGES.map(stage => {
                            const stageLeads = getStageLeads(stage.id);
                            return (
                                <div key={stage.id} className="w-[300px] flex-shrink-0 flex flex-col gap-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                                            <span className="font-bold text-sm text-foreground">{stage.label}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                                    </div>

                                    <div className="flex flex-col gap-3 min-h-[200px]">
                                        {stageLeads.map(lead => (
                                            <Card key={lead.id} className="border-border shadow-sm bg-card hover:border-primary/40 cursor-pointer transition-colors group">
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="space-y-1 w-full">
                                                        <h4 className="font-bold text-sm text-foreground truncate">{lead.first_name} {lead.last_name}</h4>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Building2 size={12} className="shrink-0" />
                                                            <span className="truncate">{lead.company || 'Private'}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-border mt-3">
                                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}>
                                                                <Edit2 size={12} className="text-muted-foreground hover:text-primary" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleDelete(lead.id, e)}>
                                                                <Trash2 size={12} className="text-muted-foreground hover:text-destructive" />
                                                            </Button>
                                                        </div>
                                                        {(lead.potential_value ?? 0) > 0 && (
                                                            <span className="text-sm font-black text-foreground ml-auto">
                                                                ${(lead.potential_value ?? 0).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {stageLeads.length === 0 && (
                                            <div className="h-24 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
                                                <span className="text-xs text-muted-foreground">Empty</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}