'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getUsers, getProjects, createInvoice } from '@/lib/api';
import { checkApprovalRequired } from '@/lib/approval-workflow';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { toast } from 'sonner';
import { RefreshCcw, FileDown, CheckCircle2 } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { BrandedDocumentPreview } from '@/components/shared/common/branded-document-preview';
import { InvoiceHeader } from '@/app/(admin)/admin/finance/invoices/_components/invoice-header';
import { InvoiceForm } from '@/app/(admin)/admin/finance/invoices/_components/invoice-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { User as UserType, Project, InvoiceStatus } from '@/lib/db/types';

export default function NewInvoicePage() {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const { companyProfile } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

    const [users, setUsers] = useState<UserType[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [formData, setFormData] = useState({
        // Basic Info
        client_id: '',
        project_id: '',
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'pending' as InvoiceStatus,

        // Line Items
        line_items: [
            { description: '', quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }
        ],

        // Financial
        currency: companyProfile?.baseCurrency || 'AED',
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
        const subtotal = formData.line_items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        const discount = formData.discount_type === 'percentage'
            ? subtotal * (formData.discount_value / 100)
            : formData.discount_value;
        const afterDiscount = subtotal - discount;
        const tax = formData.line_items.reduce((acc, item) => acc + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
        const total = afterDiscount + tax + (formData.additional_charges || 0);

        return { subtotal, discount, afterDiscount, tax, total };
    }, [formData.line_items, formData.discount_type, formData.discount_value, formData.additional_charges]);

    const selectedClient = useMemo(() => users.find(u => u.id === formData.client_id), [formData.client_id, users]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        // Validation
        if (!formData.use_manual_client && (!formData.client_id || !formData.project_id)) {
            return toast.error('Please select client and project or use manual entry');
        }
        if (formData.use_manual_client && !formData.manual_client_name) {
            return toast.error('Please enter client name');
        }
        if (!formData.invoice_number || !formData.due_date) {
            return toast.error('Invoice number and due date are required');
        }
        if (formData.line_items.length === 0 || formData.line_items.every(item => !item.description)) {
            return toast.error('Please add at least one line item');
        }

        setSaving(true);
        try {
            let finalStatus: InvoiceStatus = formData.status;
            let approvalRole = '';

            if (formData.status === 'pending') {
                const approvalReq = await checkApprovalRequired('invoice', totals.total);
                if (approvalReq.requiresApproval) {
                    finalStatus = 'pending_approval';
                    approvalRole = approvalReq.approvalRole;
                    toast.info(`Invoice requires approval from ${approvalRole}`);
                }
            }

            const result = await createInvoice({
                ...formData,
                status: finalStatus,
                amount: totals.total,
                requires_approval: finalStatus === 'pending_approval',
                approval_role: approvalRole || undefined,
            });

            if (result && result.id) {
                setCreatedInvoiceId(result.id);
                setShowSuccessDialog(true);
            } else {
                toast.success(finalStatus === 'pending_approval' ? 'Invoice submitted for approval' : 'Tax Invoice Dispatched');
                router.push('/admin/finance/invoices');
            }
        } catch (error: any) {
            toast.error(error.message || 'Dispatch failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        // Generate PDF from current form data
        const { generateInvoicePDF } = await import('@/lib/pdf-generator');
        const selectedClient = users.find(u => u.id === formData.client_id);
        const selectedProject = projects.find(p => p.id === formData.project_id);

        const invoiceData = {
            ...formData,
            id: createdInvoiceId || 'new',
            amount: totals.total,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await generateInvoicePDF(invoiceData as any, selectedClient || null, selectedProject || null);
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
                <InvoiceHeader
                    title="Issue Tax Invoice"
                    subtitle="Finance Hub"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onSave={() => handleSubmit()}
                    onCancel={() => router.back()}
                    saving={saving}
                    variant="modern"
                />

                {viewMode === 'edit' ? (
                    <InvoiceForm
                        formData={formData}
                        users={users}
                        projects={projects}
                        onFormDataChange={setFormData}
                        variant="modern"
                        saving={saving}
                        companyProfile={companyProfile}
                    />
                ) : (
                    <div className="animate-in zoom-in-95 duration-300 py-10 bg-muted rounded-md border-2 border-dashed border-border">
                        <BrandedDocumentPreview
                            type="invoice"
                            number={formData.invoice_number}
                            issueDate={formData.issue_date}
                            dueDate={formData.due_date}
                            entityName={formData.use_manual_client ? formData.manual_client_name : selectedClient?.full_name}
                            entityAddress={formData.use_manual_client ? formData.manual_client_address : undefined}
                            entityEmail={formData.use_manual_client ? formData.manual_client_email : selectedClient?.email}
                            entityTaxId={formData.use_manual_client ? formData.manual_client_tax_id : undefined}
                            companyName={formData.use_manual_company ? formData.manual_company_name : undefined}
                            companyAddress={formData.use_manual_company ? formData.manual_company_address : undefined}
                            companyTaxId={formData.use_manual_company ? formData.manual_company_tax_id : undefined}
                            companyPhone={formData.use_manual_company ? formData.manual_company_phone : undefined}
                            companyEmail={formData.use_manual_company ? formData.manual_company_email : undefined}
                            lines={formData.line_items}
                            totals={{
                                subtotal: totals.subtotal,
                                discount: totals.discount,
                                tax: totals.tax,
                                additionalCharges: formData.additional_charges,
                                total: totals.total
                            }}
                            currency={formData.currency}
                            paymentTerms={formData.payment_terms}
                            paymentMethod={formData.payment_method}
                            notes={formData.notes}
                            termsConditions={formData.terms_conditions}
                            additionalChargesDescription={formData.additional_charges_description}
                        />
                    </div>
                )}
            </div>

            {/* Success Dialog with Download Option */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Invoice Created Successfully!</DialogTitle>
                                <DialogDescription className="text-sm mt-1">
                                    Invoice {formData.invoice_number} has been dispatched
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Your invoice has been created and saved. You can now download it as a PDF or view it in the invoices list.
                        </p>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Invoice Number:</span>
                                <span className="font-bold">{formData.invoice_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-bold">{formData.currency} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Due Date:</span>
                                <span className="font-bold">{new Date(formData.due_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowSuccessDialog(false);
                                router.push('/admin/finance/invoices');
                            }}
                            className="w-full sm:w-auto"
                        >
                            View All Invoices
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleDownloadPDF();
                                toast.success('PDF Downloaded');
                                setTimeout(() => {
                                    router.push('/admin/finance/invoices');
                                }, 1000);
                            }}
                            className="w-full sm:w-auto gap-2"
                        >
                            <FileDown className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
