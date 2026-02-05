'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getQuotation, updateQuotation, getUsers, getProjects } from '@/lib/api';
import { generateQuotationPDF, createQuotationDoc } from '@/lib/pdf-generator';
import { QuotationPreview } from '@/components/admin/quotation-preview';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, Trash2, FileDown } from 'lucide-react';
import Link from 'next/link';
import type { User, Project, Quotation, QuotationItem, QuotationStatus } from '@/lib/db/types';

export default function EditQuotationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [originalQuotation, setOriginalQuotation] = useState<Quotation | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [isManual, setIsManual] = useState(false);
    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        client_email: '',
        client_company: '',
        client_address: '',
        client_is_company: false,
        project_id: '',
        quotation_number: '',
        valid_until: '',
        status: 'draft' as QuotationStatus,
        currency: 'USD',
        description: '',
        notes: '',
    });

    const [items, setItems] = useState<QuotationItem[]>([
        { description: '', quantity: 1, unit_price: 0, total: 0 }
    ]);

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const getPreviewData = () => {
        let projectTitle = originalQuotation?.project_title;
        if (formData.project_id) {
            const proj = projects.find(p => p.id === formData.project_id);
            if (proj) projectTitle = proj.title;
        }

        return {
            ...formData,
            items,
            project_title: projectTitle,
            amount: calculateTotal(),
            created_at: originalQuotation?.created_at || new Date().toISOString(),
        };
    };

    const getClient = () => {
        if (isManual) {
            return {
                id: 'manual',
                full_name: formData.client_name || 'Client Name',
                email: formData.client_email || '',
                role: 'client'
            } as User;
        }
        return users.find(u => u.id === formData.client_id) || null;
    };

    useEffect(() => {
        if (adminUser === null) {
            setLoading(false);
            return;
        }
        if (adminUser?.role === 'admin') {
            fetchData();
        } else if (adminUser) {
            setLoading(false);
        }
    }, [adminUser]);

    const fetchData = async () => {
        try {
            const [quotationData, usersData, projectsData] = await Promise.all([
                getQuotation(params.id),
                getUsers(),
                getProjects(),
            ]);

            if (quotationData) {
                setOriginalQuotation(quotationData);

                // Check if manual
                const isManualClient = !quotationData.client_id && (!!quotationData.client_name || !!quotationData.client_company);
                setIsManual(isManualClient);

                setFormData({
                    client_id: quotationData.client_id || '',
                    client_name: quotationData.client_name || '',
                    client_email: quotationData.client_email || '',
                    client_company: quotationData.client_company || '',
                    client_address: quotationData.client_address || '',
                    client_is_company: quotationData.client_is_company || false,
                    project_id: quotationData.project_id || '',
                    quotation_number: quotationData.quotation_number,
                    valid_until: quotationData.valid_until,
                    status: quotationData.status,
                    currency: quotationData.currency || 'USD',
                    description: quotationData.description || '',
                    notes: quotationData.notes || '',
                });
                if (quotationData.items && quotationData.items.length > 0) {
                    setItems(quotationData.items);
                }
            } else {
                toast.error('Quotation not found');
                router.push('/admin/quotations');
            }

            setUsers(usersData.filter(u => u.role === 'client'));
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'description') {
            item.description = value;
        } else if (field === 'quantity') {
            item.quantity = Number(value);
            item.total = item.quantity * item.unit_price;
        } else if (field === 'unit_price') {
            item.unit_price = Number(value);
            item.total = item.quantity * item.unit_price;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isClientValid = isManual
            ? (formData.client_is_company ? !!formData.client_company : !!formData.client_name)
            : !!formData.client_id;

        if (!isClientValid || !formData.quotation_number || !formData.valid_until) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (items.some(item => !item.description || item.total <= 0)) {
            toast.error('Please fill in all item details correctly');
            return;
        }

        setSaving(true);
        try {
            // Determine Project Title
            let projectTitle = originalQuotation?.project_title;
            if (formData.project_id) {
                const proj = projects.find(p => p.id === formData.project_id);
                if (proj) projectTitle = proj.title;
            }

            const success = await updateQuotation(params.id, {
                client_id: isManual ? '' : formData.client_id,
                client_name: isManual ? formData.client_name : undefined,
                client_email: isManual ? formData.client_email : undefined,
                client_company: isManual ? formData.client_company : undefined,
                client_address: isManual ? formData.client_address : undefined,
                client_is_company: isManual ? formData.client_is_company : undefined,
                project_id: formData.project_id || undefined,
                project_title: projectTitle,
                quotation_number: formData.quotation_number,
                amount: calculateTotal(),
                currency: formData.currency,
                valid_until: formData.valid_until,
                status: formData.status,
                description: formData.description || undefined,
                items: items,
                notes: formData.notes || undefined,
            });

            if (success) {
                toast.success('Quotation updated successfully');
                // Refresh original quotation for PDF generation consistency without reload
                const updatedQuotation = {
                    ...originalQuotation!,
                    ...formData,
                    amount: calculateTotal(),
                    items: items,
                    updated_at: new Date().toISOString()
                };
                setOriginalQuotation(updatedQuotation);
            } else {
                toast.error('Failed to update quotation');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (originalQuotation) {
            // Mix current form data with original to ensure PDF reflects unsaved changes if desired?
            // Usually PDF should reflect saved state. I'll rely on originalQuotation which I updated on save.
            // If user edited but not saved, they should save first ideally.
            // But let's construct "current" object from state to allow previewing before save?
            // "Maker" usually implies WYSIWYG.
            // But typically safer to use saved data. But user might want to print draft.
            // I'll construct a temporary object from form state.

            const currentQuotation: Quotation = {
                ...originalQuotation,
                ...formData,
                amount: calculateTotal(),
                items: items,
                id: params.id,
                created_at: originalQuotation.created_at,
                updated_at: new Date().toISOString(),
            } as Quotation;

            const client = users.find(u => u.id === formData.client_id) || null;

            if ((window as any).previewMode) {
                // Robust Preview: Open window first to bypass popup blockers
                const win = window.open('', '_blank');
                if (win) win.document.write('Please wait, generating PDF...');

                try {
                    const doc = await createQuotationDoc(currentQuotation, client);
                    if (win) win.location.href = doc.output('bloburl') as any;
                } catch (err) {
                    if (win) win.close();
                    toast.error('Failed to generate preview');
                    console.error(err);
                }
            } else {
                await generateQuotationPDF(currentQuotation, client);
            }
            toast.success('Action Completed');
        }
    };

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/quotations">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Quotation</h1>
                            <p className="text-muted-foreground">Manage quotation details</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { (window as any).previewMode = true; handleDownloadPDF(); }}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Preview PDF
                        </Button>
                        <Button variant="outline" onClick={() => { (window as any).previewMode = false; handleDownloadPDF(); }}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quotation Details</CardTitle>
                                <CardDescription>Update the information for this quotation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="client">Client *</Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-muted-foreground hover:text-primary"
                                                    onClick={() => {
                                                        setIsManual(!isManual);
                                                        if (!isManual) {
                                                            // Resetting manual fields when switching to manual is optional, 
                                                            // but often better to keep existing if switching back and forth unless empty
                                                        } else {
                                                            // Switching to select implies clearing manual? 
                                                            // Maybe just keep state separate.
                                                        }
                                                    }}
                                                >
                                                    {isManual ? 'Select Existing Client' : 'Enter Manually (Non-Client)'}
                                                </Button>
                                            </div>

                                            {isManual ? (
                                                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-200/20">
                                                        <Switch
                                                            id="client_is_company"
                                                            checked={formData.client_is_company}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, client_is_company: checked })}
                                                            disabled={saving}
                                                        />
                                                        <Label htmlFor="client_is_company" className="cursor-pointer">This is a Company Client</Label>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="client_name" className="text-xs">
                                                                {formData.client_is_company ? 'Contact Person (Optional)' : 'Client Name *'}
                                                            </Label>
                                                            <Input
                                                                id="client_name"
                                                                placeholder="John Doe"
                                                                value={formData.client_name}
                                                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                                                required={!formData.client_is_company && isManual}
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="client_email" className="text-xs">Email</Label>
                                                            <Input
                                                                id="client_email"
                                                                type="email"
                                                                placeholder="john@example.com"
                                                                value={formData.client_email}
                                                                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="client_company" className="text-xs">
                                                            {formData.client_is_company ? 'Company Name *' : 'Company Name'}
                                                        </Label>
                                                        <Input
                                                            id="client_company"
                                                            placeholder="Acme Corp"
                                                            value={formData.client_company}
                                                            onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                                                            required={formData.client_is_company && isManual}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="client_address" className="text-xs">Address/Location</Label>
                                                        <Input
                                                            id="client_address"
                                                            placeholder="123 Main St, City, Country"
                                                            value={formData.client_address}
                                                            onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <Select
                                                    value={formData.client_id}
                                                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                                                    disabled={saving}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a client" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {users.map((u) => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.full_name} ({u.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="project">Project (Optional)</Label>
                                            <Select
                                                value={formData.project_id}
                                                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                                                disabled={saving || !formData.client_id}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a project" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="quotation_number">Quotation Number *</Label>
                                            <Input
                                                id="quotation_number"
                                                placeholder="Q-001"
                                                value={formData.quotation_number}
                                                onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="valid_until">Valid Until *</Label>
                                            <Input
                                                id="valid_until"
                                                type="date"
                                                value={formData.valid_until}
                                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status *</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                                                disabled={saving}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="accepted">Accepted</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="expired">Expired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency *</Label>
                                            <Select
                                                value={formData.currency}
                                                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                                disabled={saving}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                                    <SelectItem value="SGD">SGD (S$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Items</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>

                                        <div className="border rounded-md p-4 space-y-4">
                                            {items.map((item, index) => (
                                                <div key={index} className="grid gap-4 md:grid-cols-12 items-end">
                                                    <div className="md:col-span-6 space-y-2">
                                                        <Label className="text-xs">Description</Label>
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            placeholder="Item description"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label className="text-xs">Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label className="text-xs">Unit Price</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1 space-y-2">
                                                        <Label className="text-xs">Total</Label>
                                                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                                            ${item.total.toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={items.length === 1}
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex justify-end pt-4 border-t">
                                                <div className="text-right">
                                                    <span className="text-muted-foreground mr-4">Total Amount:</span>
                                                    <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Internal/Summary)</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Brief summary..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Add any notes relevant to the client..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/admin/quotations')}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="hidden lg:block sticky top-6 h-[calc(100vh-100px)]">
                        <QuotationPreview
                            data={getPreviewData()}
                            client={getClient()}
                        />
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
