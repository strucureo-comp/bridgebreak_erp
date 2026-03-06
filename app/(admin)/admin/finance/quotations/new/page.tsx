'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getUsers, getProjects, createQuotation } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import type { User as UserType, Project, QuotationItem, QuotationStatus } from '@/lib/db/types';
import { BrandedDocumentPreview } from '@/components/shared/common/branded-document-preview';
import { useTenant } from '@/lib/tenant-context';
import { QuotationForm } from '../_components/quotation-form';
import { QuotationHeader } from '../_components/quotation-header';

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



    const handleSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();
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
                <QuotationHeader
                    title="Draft Quotation"
                    subtitle="Sales CRM Hub"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onSave={() => handleSubmit()}
                    onCancel={() => router.back()}
                    saving={saving}
                    variant="modern"
                />

                {viewMode === 'edit' ? (
                    <QuotationForm
                        formData={formData}
                        items={items}
                        users={users}
                        projects={projects}
                        isManual={isManual}
                        onFormDataChange={setFormData}
                        onItemsChange={setItems}
                        onIsManualChange={setIsManual}
                        variant="modern"
                    />
                ) : (
                    <div className="animate-in zoom-in-95 duration-300 py-10 bg-muted rounded-md border-2 border-dashed border-border">
                        <BrandedDocumentPreview
                            type="quotation"
                            number={formData.quotation_number}
                            entityName={selectedClient.name || undefined}
                            entityAddress={selectedClient.address || undefined}
                            lines={items.map(i => ({ ...i, unit_price: i.unit_price }))}
                            totals={{ subtotal: items.reduce((a, i) => a + i.total, 0), tax: items.reduce((a, i) => a + i.total, 0) * 0.05, total: items.reduce((a, i) => a + i.total, 0) * 1.05 }}
                            currency={formData.currency}
                            notes={formData.notes}
                        />
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
