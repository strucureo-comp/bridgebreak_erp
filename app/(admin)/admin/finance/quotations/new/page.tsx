'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getUsers, getProjects, createQuotation } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Loader2,
    ChevronLeft,
    Plus,
    Trash2,
    ShieldCheck,
    Eye,
    Settings,
    User,
    Briefcase,
    Hash,
    RefreshCcw,
    FileText,
    Calculator
} from 'lucide-react';
import Link from 'next/link';
import type { User as UserType, Project, QuotationItem, QuotationStatus } from '@/lib/db/types';
import { BrandedDocumentPreview } from '@/components/shared/common/branded-document-preview';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';

export default function NewQuotationPage() {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const { companyProfile } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    const [users, setUsers] = useState<UserType[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [isManual, setIsManual] = useState(false);
    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        client_email: '',
        client_company: '',
        client_address: '',
        client_is_company: true,
        project_id: '',
        project_title: '',
        quotation_number: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        valid_until: '',
        status: 'draft' as QuotationStatus,
        currency: companyProfile?.baseCurrency || 'AED',
        description: '',
        notes: '',
    });

    const [items, setItems] = useState<QuotationItem[]>([
        { description: '', quantity: 1, unit_price: 0, total: 0 }
    ]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const taxRate = 5; // Standard VAT
        const tax = subtotal * (taxRate / 100);
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    }, [items]);

    const selectedClient = useMemo(() => {
        if (isManual) return { name: formData.client_company || formData.client_name, address: formData.client_address };
        const u = users.find(u => u.id === formData.client_id);
        return { name: u?.full_name, address: '' };
    }, [isManual, formData, users]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersData, projectsData] = await Promise.all([
                getUsers(),
                getProjects(),
            ]);
            setUsers((usersData as any[]).filter(u => u.role === 'client'));
            setProjects(projectsData as any || []);
        } catch (error) {
            toast.error('Failed to fetch CRM data');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        if (field === 'description') item.description = value;
        else if (field === 'quantity') {
            item.quantity = Number(value);
            item.total = item.quantity * item.unit_price;
        } else if (field === 'unit_price') {
            item.unit_price = Number(value);
            item.total = item.quantity * item.unit_price;
        }
        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!formData.client_id && !isManual) || !formData.quotation_number || !formData.valid_until) {
            return toast.error('Required identity fields missing');
        }
        if (items.some(item => !item.description || item.total < 0)) {
            return toast.error('Line item specifications invalid');
        }

        setSaving(true);
        try {
            const res = await createQuotation({
                ...formData,
                amount: totals.total,
                items: items,
            });
            toast.success('Proposal Dispatched');
            router.push('/admin/finance/quotations');
        } catch (error: any) {
            toast.error(error.message || 'Dispatch failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Quotation Engine</p>
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
                            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">Draft Quotation</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sales CRM Hub</span>
                                <div className="flex p-0.5 bg-muted rounded-md">
                                    <button onClick={() => setViewMode('edit')} className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", viewMode === 'edit' ? "bg-card shadow-sm" : "text-muted-foreground")}>Edit</button>
                                    <button onClick={() => setViewMode('preview')} className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", viewMode === 'preview' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Preview</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-10 px-6 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving} className="h-10 px-8 gap-2 bg-primary font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                            {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Dispatch Proposal
                        </Button>
                    </div>
                </div>

                {viewMode === 'edit' ? (
                    <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-300">
                        <div className="md:col-span-1 space-y-6">
                            {/* Basic Meta */}
                            <Card className="border border-border shadow-sm rounded-md bg-card">
                                <CardHeader className="border-b bg-muted/50 py-3">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Hash size={14} className="text-primary" /> Identification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Quotation Number</Label>
                                        <Input value={formData.quotation_number} onChange={e => setFormData({ ...formData, quotation_number: e.target.value })} className="h-9 border-border font-mono font-bold uppercase text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Valid Until</Label>
                                        <Input type="date" value={formData.valid_until} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} className="h-9 border-border text-xs font-bold" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Client Block */}
                            <Card className="border border-border shadow-sm rounded-md bg-card">
                                <CardHeader className="border-b bg-muted/50 py-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <User size={14} className="text-primary" /> Target Entity
                                    </CardTitle>
                                    <button onClick={() => setIsManual(!isManual)} className="text-[8px] font-black text-primary uppercase border-b border-primary/20">
                                        {isManual ? 'Use Registry' : 'Enter Manual'}
                                    </button>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {isManual ? (
                                        <div className="space-y-3">
                                            <Input placeholder="Company Name" value={formData.client_company} onChange={e => setFormData({ ...formData, client_company: e.target.value })} className="h-9 border-border text-xs font-bold" />
                                            <Input placeholder="Email Address" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} className="h-9 border-border text-xs" />
                                            <Textarea placeholder="Physical Address" value={formData.client_address} onChange={e => setFormData({ ...formData, client_address: e.target.value })} className="min-h-[60px] text-xs border-border" />
                                        </div>
                                    ) : (
                                        <Select value={formData.client_id} onValueChange={v => setFormData({ ...formData, client_id: v })}>
                                            <SelectTrigger className="h-9 border-border text-xs font-bold uppercase"><SelectValue placeholder="Select Client..." /></SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs uppercase font-bold">{u.full_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Items Area */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border border-border shadow-sm rounded-md bg-card overflow-hidden">
                                <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Proposal Specification</CardTitle>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Line item breakdown for client review</p>
                                    </div>
                                    <Button type="button" onClick={addItem} variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5">
                                        <Plus className="mr-1.5 h-3 w-3" /> Add Item
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-muted/50 border-b border-border">
                                                <tr>
                                                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Description</th>
                                                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-24">Quantity</th>
                                                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-32">Unit Price</th>
                                                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-28 text-right">Total</th>
                                                    <th className="px-6 py-3 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-zinc-50/50">
                                                        <td className="px-6 py-3"><Input value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="h-8 border-none bg-transparent font-bold text-xs uppercase" placeholder="Enter service..." /></td>
                                                        <td className="px-6 py-3"><Input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="h-8 border-border text-center text-xs font-bold" /></td>
                                                        <td className="px-6 py-3"><Input type="number" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} className="h-8 border-border text-xs font-bold" /></td>
                                                        <td className="px-6 py-3 text-right text-xs font-black text-foreground">{item.total.toLocaleString()}</td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button onClick={() => removeItem(idx)} className="text-muted-foreground/60 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-8 bg-muted/30 border-t border-border grid md:grid-cols-2 gap-12">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
                                            <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="min-h-[100px] border-border text-xs resize-none" placeholder="Administrative notes..." />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b pb-4">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal Position</span>
                                                <span className="text-sm font-black text-foreground">{formData.currency} {totals.subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-foreground text-card-foreground p-6 rounded-md">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Proposal Commitment</p>
                                                    <p className="text-2xl font-black tracking-tighter">{formData.currency} {totals.total.toLocaleString()}</p>
                                                </div>
                                                <Calculator className="h-8 w-8 text-primary opacity-50" />
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
                            type="quotation"
                            number={formData.quotation_number}
                            entityName={selectedClient.name || undefined}
                            entityAddress={selectedClient.address || undefined}
                            lines={items.map(i => ({ ...i, unit_price: i.unit_price }))}
                            totals={totals}
                            currency={formData.currency}
                            notes={formData.notes}
                        />
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
