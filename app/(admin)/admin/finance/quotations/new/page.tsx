'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getUsers, getProjects, createQuotation, getSettings } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import type { User as UserType, Project, QuotationItem, QuotationStatus } from '@/lib/db/types';
import { BrandedDocumentPreview } from '@/components/shared/common/branded-document-preview';
import { useTenant } from '@/lib/tenant-context';
import { QuotationForm } from '../_components/quotation-form';
import { QuotationHeader } from '../_components/quotation-header';
import { checkApprovalRequired } from '@/lib/approval-workflow';
import { generateQuotationPDF } from '@/lib/pdf-generator';

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
    const [autoGenerateNumber, setAutoGenerateNumber] = useState(true);
    const [taxRate, setTaxRate] = useState(5);
    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        client_email: '',
        client_company: '',
        client_address: '',
        client_phone: '',
        client_city: '',
        client_country: '',
        client_tax_id: '',
        client_is_company: true,
        project_id: '',
        project_title: '',
        quotation_number: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        valid_until: '',
        status: 'draft' as QuotationStatus,
        currency: companyProfile?.baseCurrency || 'AED',
        description: '',
        notes: '',
        terms_and_conditions: '',
        tax_mode: 'auto' as 'auto' | 'manual',
        manual_tax_adjustment: 0,
    });

    const [items, setItems] = useState<QuotationItem[]>([
        { description: '', quantity: 1, unit_price: 0, total: 0 }
    ]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const tax = subtotal * (taxRate / 100);
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    }, [items, taxRate]);

    const selectedClient = useMemo(() => {
        if (isManual) return { name: formData.client_company || formData.client_name, address: formData.client_address };
        const u = users.find(u => u.id === formData.client_id);
        return { name: u?.full_name, address: '' };
    }, [isManual, formData, users]);

    useEffect(() => {
        fetchData();
        loadSettings();
    }, []);

    useEffect(() => {
        if (autoGenerateNumber) {
            const newNumber = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            setFormData(prev => ({ ...prev, quotation_number: newNumber }));
        }
    }, [autoGenerateNumber]);

    const loadSettings = async () => {
        try {
            const financeSettings = await getSettings<any>('finance');
            if (financeSettings) {
                setTaxRate(financeSettings.defaultTaxRate || 5);
            }
        } catch (error) {
            console.warn('Failed to load finance settings, using defaults');
        }
    };

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



    const handleSubmit = async (statusToSave: QuotationStatus = 'sent') => {
        if ((!formData.client_id && !isManual) || !formData.quotation_number || !formData.valid_until) {
            return toast.error('Required identity fields missing');
        }
        if (items.some(item => !item.description || item.total < 0)) {
            return toast.error('Line item specifications invalid');
        }

        setSaving(true);
        try {
                // Check if approval is required (only for 'sent' status, not drafts)
                let finalStatus = statusToSave;
                let approvalRole = '';
                if (statusToSave === 'sent') {
                    const approvalReq = await checkApprovalRequired('quotation', totals.total);
                    if (approvalReq.requiresApproval) {
                        finalStatus = 'pending_approval' as QuotationStatus;
                        approvalRole = approvalReq.approvalRole;
                        toast.info(`Quotation requires approval from ${approvalRole}`);
                    }
                }

            const res = await createQuotation({
                ...formData,
                    status: finalStatus,
                amount: totals.total,
                items: items,
                    requires_approval: finalStatus === 'pending_approval',
                    approval_role: approvalRole || undefined,
            });
                toast.success(
                    statusToSave === 'draft' 
                        ? 'Quotation saved as draft' 
                        : finalStatus === 'pending_approval'
                        ? 'Quotation submitted for approval'
                        : 'Proposal Dispatched'
                );
            router.push('/admin/finance/quotations');
        } catch (error: any) {
            toast.error(error.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const selectedUser = users.find(u => u.id === formData.client_id);
            const quotationData = {
                ...formData,
                amount: totals.total,
                items: items,
                created_at: new Date().toISOString(),
            } as any;
            await generateQuotationPDF(quotationData, selectedUser || null);
            toast.success('PDF downloaded successfully');
        } catch (error: any) {
            toast.error('Failed to generate PDF');
            console.error(error);
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
                <QuotationHeader
                    title="Draft Quotation"
                    subtitle="Sales CRM Hub"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onSave={() => handleSubmit('sent')}
                    onCancel={() => router.back()}
                    onDownloadPDF={handleDownloadPDF}
                    saving={saving}
                    variant="modern"
                />

                {viewMode === 'edit' && (
                    <div className="flex justify-end gap-2 mb-4">
                        <button
                            onClick={() => handleSubmit('draft')}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            Save as Draft
                        </button>
                    </div>
                )}

                {viewMode === 'edit' ? (
                    <QuotationForm
                        formData={formData}
                        items={items}
                        users={users}
                        projects={projects}
                        isManual={isManual}
                        autoGenerateNumber={autoGenerateNumber}
                        onFormDataChange={setFormData}
                        onItemsChange={setItems}
                        onIsManualChange={setIsManual}
                        onAutoGenerateNumberChange={setAutoGenerateNumber}
                        variant="modern"
                    />
                ) : (
                    <div className="animate-in zoom-in-95 duration-300 py-10 bg-muted rounded-md border-2 border-dashed border-border">
                        <BrandedDocumentPreview
                            type="quotation"
                            number={formData.quotation_number}
                            validUntil={formData.valid_until}
                            entityName={isManual ? (formData.client_is_company ? formData.client_company : formData.client_name) : selectedClient.name}
                            entityAddress={isManual ? `${formData.client_address}${formData.client_city ? '\n' + formData.client_city : ''}${formData.client_country ? ', ' + formData.client_country : ''}` : selectedClient.address}
                            entityEmail={isManual ? formData.client_email : undefined}
                            entityTaxId={formData.client_is_company && formData.client_tax_id ? formData.client_tax_id : undefined}
                            lines={items.map(i => ({ ...i, unit_price: i.unit_price }))}
                            totals={totals}
                            currency={formData.currency}
                            notes={formData.notes}
                            termsConditions={formData.terms_and_conditions}
                        />
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
