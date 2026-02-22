'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getUsers, getProjects, createInvoice } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
    Loader2, 
    ChevronLeft, 
    Plus, 
    Trash2, 
    ShieldCheck, 
    Eye, 
    Settings, 
    Hash,
    RefreshCcw,
    User,
    Calendar,
    Briefcase
} from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { BrandedDocumentPreview } from '@/components/common/branded-document-preview';
import { cn } from '@/lib/utils';
import type { User as UserType, Project, InvoiceStatus } from '@/lib/db/types';

export default function NewInvoicePage() {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const { companyProfile } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    
    const [users, setUsers] = useState<UserType[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    
    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: 0,
        due_date: '',
        status: 'pending' as InvoiceStatus,
        description: '',
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, projectsData] = await Promise.all([
                getUsers(),
                getProjects(),
            ]);
            setUsers(usersData.filter(u => u.role === 'client'));
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to synchronize CRM data');
        } finally {
            setLoading(false);
        }
    };

    const totals = useMemo(() => {
        const subtotal = Number(formData.amount);
        const taxRate = 5; // Standard UAE VAT
        const tax = subtotal * (taxRate / 100);
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    }, [formData.amount]);

    const selectedClient = useMemo(() => users.find(u => u.id === formData.client_id), [formData.client_id, users]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.client_id || !formData.project_id || !formData.amount || !formData.due_date || !formData.invoice_number) {
            return toast.error('Required billing data missing');
        }

        setSaving(true);
        try {
            await createInvoice({
                ...formData,
                amount: Number(formData.amount),
            });
            toast.success('Tax Invoice Dispatched');
            router.push('/admin/invoices');
        } catch (error: any) {
            toast.error(error.message || 'Dispatch failed');
        } finally {
            setSaving(false);
        }
    };

    const filteredProjects = projects.filter(p => p.client_id === formData.client_id);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Billing Engine</p>
        </div>
    );

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 bg-card -mx-4 px-4 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-10 w-10 border" onClick={() => router.back()}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-0.5">
                            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">Issue Tax Invoice</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Finance Hub</span>
                                <div className="flex p-0.5 bg-muted rounded-md">
                                    <button onClick={() => setViewMode('edit')} className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", viewMode === 'edit' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>Edit</button>
                                    <button onClick={() => setViewMode('preview')} className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", viewMode === 'preview' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Preview</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-10 px-6 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving} className="h-10 px-8 gap-2 bg-primary font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                            {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Dispatch Invoice
                        </Button>
                    </div>
                </div>

                {viewMode === 'edit' ? (
                    <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-300">
                        <div className="md:col-span-1 space-y-6">
                            {/* Meta */}
                            <Card className="border border-border shadow-sm rounded-md bg-card">
                                <CardHeader className="border-b bg-muted/50 py-3">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Hash size={14} className="text-primary" /> Identification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Number</Label>
                                        <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="h-9 border-border font-mono font-bold uppercase text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Due Date</Label>
                                        <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="h-9 border-border text-xs font-bold" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Entity Linkage */}
                            <Card className="border border-border shadow-sm rounded-md bg-card">
                                <CardHeader className="border-b bg-muted/50 py-3">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <User size={14} className="text-primary" /> Account Mapping
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Target Client</Label>
                                        <Select value={formData.client_id} onValueChange={v => setFormData({...formData, client_id: v, project_id: ''})}>
                                            <SelectTrigger className="h-9 border-border text-xs font-bold uppercase"><SelectValue placeholder="Select Client..." /></SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs uppercase font-bold">{u.full_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Related Project</Label>
                                        <Select value={formData.project_id} onValueChange={v => setFormData({...formData, project_id: v})} disabled={!formData.client_id}>
                                            <SelectTrigger className="h-9 border-border text-xs font-bold uppercase"><SelectValue placeholder="Select Job..." /></SelectTrigger>
                                            <SelectContent>
                                                {filteredProjects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs uppercase font-bold">{p.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Financial Area */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border border-border shadow-sm rounded-md bg-card overflow-hidden">
                                <CardHeader className="border-b bg-muted/50 py-4">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Billing Specifications</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Base Amount ({companyProfile?.baseCurrency || 'AED'})</Label>
                                            <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="h-12 border-border font-black text-xl" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</Label>
                                            <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                                                <SelectTrigger className="h-12 border-border font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending Receipt</SelectItem>
                                                    <SelectItem value="paid">Settled / Paid</SelectItem>
                                                    <SelectItem value="overdue">Overdue Payment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Breakdown</Label>
                                        <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] border-border text-xs uppercase" placeholder="List materials or services delivered..." />
                                    </div>

                                    <div className="pt-6 border-t border-border flex justify-end">
                                        <div className="w-80 space-y-4">
                                            <div className="flex justify-between border-b pb-4">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal Position</span>
                                                <span className="text-sm font-black text-foreground">{companyProfile?.baseCurrency || 'AED'} {totals.subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-foreground text-card-foreground p-6 rounded-md">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Net Receivable</p>
                                                    <p className="text-2xl font-black tracking-tighter">{companyProfile?.baseCurrency || 'AED'} {totals.total.toLocaleString()}</p>
                                                </div>
                                                <ShieldCheck className="h-8 w-8 text-primary opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 duration-300 py-10 bg-muted rounded-md border-2 border-dashed border-border">
                        <BrandedDocumentPreview 
                            type="invoice"
                            number={formData.invoice_number}
                            entityName={selectedClient?.full_name}
                            date={new Date().toISOString()}
                            lines={[{ description: formData.description || 'General Service', quantity: 1, unit_price: formData.amount }]}
                            totals={totals}
                            notes={formData.notes}
                        />
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
