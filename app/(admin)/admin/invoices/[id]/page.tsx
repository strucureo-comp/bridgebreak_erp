'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getInvoice, updateInvoice, getUsers, getProjects } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Invoice, User, Project } from '@/lib/db/types';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { FileDown, Loader2, ArrowLeft } from 'lucide-react';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        invoice_number: '',
        amount: '',
        due_date: '',
        status: 'pending' as 'pending' | 'paid' | 'overdue' | 'cancelled',
        description: '',
        notes: '',
    });

    useEffect(() => {
        if (adminUser?.role === 'admin') {
            fetchData();
        }
    }, [adminUser, params.id]);

    const fetchData = async () => {
        try {
            const [invoiceData, usersData, projectsData] = await Promise.all([
                getInvoice(params.id),
                getUsers(),
                getProjects(),
            ]);

            if (invoiceData) {
                setOriginalInvoice(invoiceData);
                setFormData({
                    client_id: invoiceData.client_id,
                    project_id: invoiceData.project_id,
                    invoice_number: invoiceData.invoice_number,
                    amount: invoiceData.amount.toString(),
                    due_date: invoiceData.due_date,
                    status: invoiceData.status,
                    description: invoiceData.description || '',
                    notes: invoiceData.notes || '',
                });
            } else {
                toast.error('Invoice not found');
                router.push('/admin/invoices');
            }

            setUsers(usersData.filter(u => u.role === 'client'));
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const success = await updateInvoice(params.id, {
                client_id: formData.client_id,
                project_id: formData.project_id,
                invoice_number: formData.invoice_number,
                amount: parseFloat(formData.amount),
                due_date: formData.due_date,
                status: formData.status,
                description: formData.description || undefined,
                notes: formData.notes || undefined,
            });

            if (success) {
                toast.success('Invoice updated successfully');
                router.push('/admin/invoices');
            } else {
                toast.error('Failed to update invoice');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setSaving(false);
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
                            <Link href="/admin/invoices">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
                            <p className="text-muted-foreground">Update invoice details</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const project = projects.find(p => p.id === formData.project_id);
                            const client = users.find(u => u.id === formData.client_id);
                            if (originalInvoice) {
                                generateInvoicePDF(originalInvoice, client || null, project || null);
                            }
                        }}
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Update the information for this invoice</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="client">Client *</Label>
                                    <Select
                                        value={formData.client_id}
                                        onValueChange={(value) => setFormData({ ...formData, client_id: value, project_id: '' })}
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project">Project *</Label>
                                    <Select
                                        value={formData.project_id}
                                        onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                                        disabled={saving || !formData.client_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.client_id ? "Select a project" : "Select a client first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.filter(p => p.client_id === formData.client_id).map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_number">Invoice Number *</Label>
                                    <Input
                                        id="invoice_number"
                                        value={formData.invoice_number}
                                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
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
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount ($) *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        disabled={saving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        required
                                        disabled={saving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Invoice Items Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="List the items or services included in this invoice..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Enter any additional notes, payment terms, or messages..."
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
                                    onClick={() => router.push('/admin/invoices')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell >
    );
}
