'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getInvoice, updateInvoice, getUsers, getProjects } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Invoice, User, Project } from '@/lib/db/types';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { Loader2 } from 'lucide-react';
import { InvoiceHeader } from '@/app/(admin)/admin/finance/invoices/_components/invoice-header';
import { InvoiceForm } from '@/app/(admin)/admin/finance/invoices/_components/invoice-form';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        // Basic Info
        client_id: '',
        project_id: '',
        invoice_number: '',
        issue_date: '',
        due_date: '',
        status: 'pending' as 'pending' | 'paid' | 'overdue' | 'cancelled',
        
        // Line Items
        line_items: [
            { description: '', quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }
        ],
        
        // Financial
        currency: 'AED',
        subtotal: 0,
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        tax_rate: 5,
        additional_charges: 0,
        additional_charges_description: '',
        
        // Payment
        payment_terms: 'net_30',
        payment_method: 'bank_transfer',
        
        // Client Details (Manual Entry Option)
        use_manual_client: false,
        manual_client_name: '',
        manual_client_email: '',
        manual_client_address: '',
        manual_client_tax_id: '',
        
        // Company Details (Manual Override)
        use_manual_company: false,
        manual_company_name: '',
        manual_company_address: '',
        manual_company_tax_id: '',
        manual_company_phone: '',
        manual_company_email: '',
        
        // Notes
        description: '',
        notes: '',
        terms_conditions: '',
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
                    client_id: invoiceData.client_id || '',
                    project_id: invoiceData.project_id || '',
                    invoice_number: invoiceData.invoice_number,
                    issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
                    due_date: invoiceData.due_date,
                    status: invoiceData.status,
                    line_items: invoiceData.line_items || [{ description: invoiceData.description || '', quantity: 1, unit_price: invoiceData.amount || 0, tax_rate: 5, total: invoiceData.amount || 0 }],
                    currency: invoiceData.currency || 'AED',
                    subtotal: 0,
                    discount_type: invoiceData.discount_type || 'percentage',
                    discount_value: invoiceData.discount_value || 0,
                    tax_rate: 5,
                    additional_charges: invoiceData.additional_charges || 0,
                    additional_charges_description: invoiceData.additional_charges_description || '',
                    payment_terms: invoiceData.payment_terms || 'net_30',
                    payment_method: invoiceData.payment_method || 'bank_transfer',
                    use_manual_client: invoiceData.use_manual_client || false,
                    manual_client_name: invoiceData.manual_client_name || '',
                    manual_client_email: invoiceData.manual_client_email || '',
                    manual_client_address: invoiceData.manual_client_address || '',
                    manual_client_tax_id: invoiceData.manual_client_tax_id || '',
                    use_manual_company: invoiceData.use_manual_company || false,
                    manual_company_name: invoiceData.manual_company_name || '',
                    manual_company_address: invoiceData.manual_company_address || '',
                    manual_company_tax_id: invoiceData.manual_company_tax_id || '',
                    manual_company_phone: invoiceData.manual_company_phone || '',
                    manual_company_email: invoiceData.manual_company_email || '',
                    description: invoiceData.description || '',
                    notes: invoiceData.notes || '',
                    terms_conditions: invoiceData.terms_conditions || '',
                });
            } else {
                toast.error('Invoice not found');
                router.push('/admin/finance/invoices');
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
            const totals = formData.line_items.reduce((acc, item) => {
                const subtotal = item.quantity * item.unit_price;
                const tax = subtotal * (item.tax_rate / 100);
                return {
                    subtotal: acc.subtotal + subtotal,
                    tax: acc.tax + tax,
                    total: acc.total + subtotal + tax
                };
            }, { subtotal: 0, tax: 0, total: 0 });

            const discount = formData.discount_type === 'percentage' 
                ? totals.subtotal * (formData.discount_value / 100)
                : formData.discount_value;
            
            const finalTotal = totals.total - discount + (formData.additional_charges || 0);

            const success = await updateInvoice(params.id, {
                ...formData,
                amount: finalTotal,
            });

            if (success) {
                toast.success('Invoice updated successfully');
                router.push('/admin/finance/invoices');
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

    const handleDownloadPDF = () => {
        const project = projects.find(p => p.id === formData.project_id);
        const client = users.find(u => u.id === formData.client_id);
        if (originalInvoice) {
            generateInvoicePDF(originalInvoice, client || null, project || null);
        }
    };

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6">
                <InvoiceHeader
                    title="Edit Invoice"
                    subtitle="Update invoice details"
                    onSave={() => handleSubmit({} as React.FormEvent)}
                    onCancel={() => router.push('/admin/finance/invoices')}
                    onDownloadPDF={handleDownloadPDF}
                    saving={saving}
                    variant="traditional"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Update the information for this invoice</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvoiceForm
                            formData={formData}
                            users={users}
                            projects={projects}
                            onFormDataChange={setFormData}
                            variant="traditional"
                            saving={saving}
                        />
                        <div className="flex gap-4 mt-6">
                            <button type="button" onClick={(e: any) => handleSubmit(e)} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => router.push('/admin/finance/invoices')} disabled={saving} className="px-4 py-2 border border-input rounded-md font-medium hover:bg-accent disabled:opacity-50">
                                Cancel
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
