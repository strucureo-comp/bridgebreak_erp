'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import {
    Users, Search, Plus, Building2, Briefcase, Globe, Phone, Target, ChevronRight, Trash2, Edit2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CustomerAccount } from '@/lib/db/types';
import { useTenant } from '@/lib/tenant-context';
import { ModuleGuard } from '@/components/shared/layout/module-guard';

export default function SalesCustomersPage() {
    const { user } = useAuth();
    const { companyProfile } = useTenant();
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const isRetail = companyProfile?.businessType === 'b2c_retail';

    const [formData, setFormData] = useState({
        name: '', industry: '', website: '', phone: '', address: '',
        primary_contact: { first_name: '', last_name: '', email: '', phone: '', title: '' }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data as any || []);
        } catch (e) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    const handleSubmit = async () => {
        if (!formData.name) return toast.error('Account Name is required');
        try {
            if (editingId) {
                await updateCustomer(editingId, formData);
                toast.success('Customer updated');
            } else {
                await createCustomer(formData);
                toast.success('Customer registered');
            }
            setIsCreateOpen(false);
            setEditingId(null);
            fetchData();
            setFormData({
                name: '', industry: '', website: '', phone: '', address: '',
                primary_contact: { first_name: '', last_name: '', email: '', phone: '', title: '' }
            });
        } catch { toast.error(editingId ? 'Update failed' : 'Registration failed'); }
    };

    const handleEdit = (customer: CustomerAccount) => {
        setFormData({
            name: customer.name,
            industry: customer.industry || '',
            website: customer.website || '',
            phone: customer.phone || '',
            address: (customer as any).address || '',
            primary_contact: (customer as any).primary_contact ? { ...(customer as any).primary_contact } as any : { first_name: '', last_name: '', email: '', phone: '', title: '' }
        });
        setEditingId(customer.id);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await deleteCustomer(id);
            toast.success('Customer deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete customer');
        }
    };

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-6 max-w-7xl mx-auto pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                {isRetail ? 'Customer Base' : 'Account Registry'}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {isRetail ? 'Manage your retail customer records.' : 'Verified B2B account base.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9 h-10 w-64 border-border bg-background"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-10 gap-2 font-bold shadow-sm">
                                        <Plus className="h-4 w-4" /> New Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 border-none shadow-2xl">
                                    <div className="bg-background">
                                        <div className="p-6 border-b border-border">
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{editingId ? 'Edit Account' : 'Register Account'}</h3>
                                            <p className="text-muted-foreground text-xs mt-0.5">{editingId ? 'Update details of the entity' : 'Initialize entity in registry'}</p>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-foreground uppercase border-b border-border pb-2">Organization</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Account Name</Label>
                                                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-10 bg-background" placeholder="Prestige LLC" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Industry</Label>
                                                        <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} className="h-10 bg-background" placeholder="Construction" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Website</Label>
                                                        <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="h-10 bg-background" placeholder="https://" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Phone</Label>
                                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-10 bg-background" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-foreground uppercase border-b border-border pb-2">Primary Contact</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">First Name</Label>
                                                        <Input value={formData.primary_contact.first_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, first_name: e.target.value } })} className="h-10 bg-background" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Last Name</Label>
                                                        <Input value={formData.primary_contact.last_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, last_name: e.target.value } })} className="h-10 bg-background" />
                                                    </div>
                                                    <div className="space-y-1.5 col-span-2">
                                                        <Label className="text-xs font-bold">Email</Label>
                                                        <Input value={formData.primary_contact.email} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, email: e.target.value } })} className="h-10 bg-background" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 border-t border-border flex justify-end gap-2">
                                            <Button variant="outline" className="h-10 font-bold" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                            <Button onClick={handleSubmit} className="h-10 px-8 font-bold">Commit Record</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCustomers.map(customer => (
                            <Card key={customer.id} className="border border-border shadow-sm bg-card hover:border-primary/40 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                            {isRetail ? <Users size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-bold">Active</Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEdit(customer)}>
                                                <Edit2 size={12} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(customer.id)}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-4">
                                        <h3 className="text-sm font-bold text-foreground truncate">{customer.name}</h3>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Briefcase size={12} className="text-muted-foreground" />
                                            <p className="text-xs truncate">{customer.industry || 'General Sector'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Globe size={12} className="text-muted-foreground" />
                                            <span className="text-xs truncate">{customer.website || 'No Web Profile'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone size={12} className="text-muted-foreground" />
                                            <span className="text-xs">{customer.phone || 'No Contact'}</span>
                                        </div>
                                    </div>

                                    {!isRetail && (
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div className="flex items-center gap-2">
                                                <Target size={12} className="text-muted-foreground" />
                                                <span className="text-xs font-bold text-foreground">
                                                    {customer.opportunities?.length || 0} Deals
                                                </span>
                                            </div>
                                            <ChevronRight size={14} className="text-muted-foreground" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg bg-muted/20">
                                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs font-bold text-muted-foreground">No accounts found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}
