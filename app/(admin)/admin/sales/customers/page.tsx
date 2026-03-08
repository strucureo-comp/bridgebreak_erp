'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getCustomers, createCustomer, deleteCustomer, updateCustomer, getLeads, getOpportunities, getInvoices } from '@/lib/api';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users, Search, Plus, Building2, Briefcase, Globe, Phone, Target, ChevronRight, Trash2, Edit2,
    Mail, MapPin, User, DollarSign, FileText, TrendingUp, ArrowUpRight, Calendar, Receipt, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CustomerAccount, Lead, Opportunity, Invoice } from '@/lib/db/types';
import { useTenant } from '@/lib/tenant-context';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function SalesCustomersPage() {
    const { user } = useAuth();
    const { companyProfile } = useTenant();
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);

    const isRetail = companyProfile?.businessType === 'b2c_retail';
    const currency = companyProfile?.baseCurrency || 'AED';

    const fmt = (n: number) => new Intl.NumberFormat('en-AE', {
        style: 'currency', currency, maximumFractionDigits: 0
    }).format(n);

    const [formData, setFormData] = useState({
        name: '', industry: '', website: '', phone: '', address: '', email: '',
        primary_contact: { first_name: '', last_name: '', email: '', phone: '', title: '' }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [custsData, leadsData, oppsData, invsData] = await Promise.all([
                getCustomers().catch(() => []),
                getLeads().catch(() => []),
                getOpportunities().catch(() => []),
                getInvoices().catch(() => []),
            ]);
            setCustomers(custsData as any || []);
            setLeads(leadsData || []);
            setOpportunities((oppsData as any) || []);
            setInvoices(invsData || []);
        } catch (e) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    // Compute aggregated data for a customer
    const getCustomerData = (customerId: string) => {
        const custOpps = opportunities.filter(o => o.account_id === customerId);
        const custInvoices = invoices.filter(i => i.client_id === customerId || i.customer_id === customerId);
        const wonDeals = custOpps.filter(o => o.stage === 'won');
        const totalRevenue = custInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
        const pendingAmount = custInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);
        const pipelineValue = custOpps.filter(o => o.stage !== 'won' && o.stage !== 'lost').reduce((s, o) => s + Number(o.amount || 0), 0);

        return {
            opportunities: custOpps,
            invoices: custInvoices,
            wonDeals: wonDeals.length,
            totalRevenue,
            pendingAmount,
            pipelineValue,
            totalDeals: custOpps.length,
        };
    };

    // Calculate overall stats
    const overallStats = useMemo(() => ({
        totalCustomers: customers.length,
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0),
        activeDeals: opportunities.filter(o => o.stage !== 'won' && o.stage !== 'lost').length,
        convertedLeads: leads.filter(l => l.status === 'converted').length,
    }), [customers, invoices, opportunities, leads]);

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
                name: '', industry: '', website: '', phone: '', address: '', email: '',
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
            email: (customer as any).email || '',
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
                                Customer Details
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Complete customer information aggregated from all CRM sections.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers..."
                                    className="pl-9 h-10 w-64 border-border bg-background"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-10 gap-2 font-bold shadow-sm">
                                        <Plus className="h-4 w-4" /> New Customer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 border-none shadow-2xl">
                                    <div className="bg-background">
                                        <div className="p-6 border-b border-border">
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{editingId ? 'Edit Customer' : 'Register Customer'}</h3>
                                            <p className="text-muted-foreground text-xs mt-0.5">{editingId ? 'Update customer details' : 'Add a new customer to the directory'}</p>
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
                                                        <Label className="text-xs font-bold">Email</Label>
                                                        <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-10 bg-background" placeholder="info@company.com" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Phone</Label>
                                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-10 bg-background" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Website</Label>
                                                        <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="h-10 bg-background" placeholder="https://" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Address</Label>
                                                        <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-10 bg-background" />
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
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Email</Label>
                                                        <Input value={formData.primary_contact.email} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, email: e.target.value } })} className="h-10 bg-background" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold">Title</Label>
                                                        <Input value={formData.primary_contact.title} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, title: e.target.value } })} className="h-10 bg-background" placeholder="CEO, Manager..." />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 border-t border-border flex justify-end gap-2">
                                            <Button variant="outline" className="h-10 font-bold" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                            <Button onClick={handleSubmit} className="h-10 px-8 font-bold">{editingId ? 'Save Changes' : 'Register Customer'}</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground mb-1">Total Customers</p>
                                <p className="text-2xl font-black text-foreground">{overallStats.totalCustomers}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground mb-1">Revenue Collected</p>
                                <p className="text-2xl font-black text-foreground">{fmt(overallStats.totalRevenue)}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground mb-1">Active Deals</p>
                                <p className="text-2xl font-black text-foreground">{overallStats.activeDeals}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground mb-1">Converted Leads</p>
                                <p className="text-2xl font-black text-foreground">{overallStats.convertedLeads}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Customer Cards Grid */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCustomers.map(customer => {
                            const data = getCustomerData(customer.id);
                            return (
                                <Card
                                    key={customer.id}
                                    className="border border-border shadow-sm bg-card hover:border-primary/40 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedCustomer(customer)}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                {isRetail ? <Users size={20} /> : <Building2 size={20} />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] font-bold">Active</Badge>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>
                                                    <Edit2 size={12} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}>
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
                                                <Phone size={12} />
                                                <span className="text-xs">{customer.phone || 'No Contact'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Globe size={12} />
                                                <span className="text-xs truncate">{customer.website || 'No Web Profile'}</span>
                                            </div>
                                        </div>

                                        {/* Aggregated Financial Summary */}
                                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                                            <div className="bg-muted/30 rounded-md p-2 text-center">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</p>
                                                <p className="text-xs font-black text-foreground">{fmt(data.totalRevenue)}</p>
                                            </div>
                                            <div className="bg-muted/30 rounded-md p-2 text-center">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Deals</p>
                                                <p className="text-xs font-black text-foreground">{data.totalDeals}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {filteredCustomers.length === 0 && (
                            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg bg-muted/20">
                                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs font-bold text-muted-foreground">No customers found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Detail Drawer */}
                <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                    <SheetContent className="sm:max-w-lg p-0 overflow-y-auto">
                        {selectedCustomer && (() => {
                            const data = getCustomerData(selectedCustomer.id);
                            return (
                                <div className="flex flex-col h-full bg-card">
                                    <SheetHeader className="p-6 border-b space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-2 font-bold text-muted-foreground hover:text-foreground"
                                                onClick={() => setSelectedCustomer(null)}
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-8 gap-2 font-bold shadow-sm"
                                                onClick={() => {
                                                    // Store customer data in localStorage for the opportunities page to pick up
                                                    localStorage.setItem('newOpportunityCustomer', JSON.stringify({
                                                        id: selectedCustomer.id,
                                                        name: selectedCustomer.name
                                                    }));
                                                    router.push('/admin/sales/opportunities');
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Opportunity
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <SheetTitle className="text-lg font-black text-foreground">{selectedCustomer.name}</SheetTitle>
                                                <p className="text-xs text-muted-foreground font-medium">{selectedCustomer.industry || 'General'}</p>
                                            </div>
                                        </div>
                                    </SheetHeader>

                                    <div className="flex-1 overflow-y-auto">
                                        <Tabs defaultValue="overview" className="w-full">
                                            <TabsList className="w-full rounded-none border-b bg-muted/30 h-10 p-0">
                                                <TabsTrigger value="overview" className="flex-1 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none">Overview</TabsTrigger>
                                                <TabsTrigger value="deals" className="flex-1 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none">Deals ({data.totalDeals})</TabsTrigger>
                                                <TabsTrigger value="invoices" className="flex-1 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none">Invoices ({data.invoices.length})</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                                                {/* Financial Summary */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-3">
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Revenue</p>
                                                        <p className="text-lg font-black text-foreground">{fmt(data.totalRevenue)}</p>
                                                    </div>
                                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
                                                        <p className="text-lg font-black text-foreground">{fmt(data.pendingAmount)}</p>
                                                    </div>
                                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-md p-3">
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase">Pipeline Value</p>
                                                        <p className="text-lg font-black text-foreground">{fmt(data.pipelineValue)}</p>
                                                    </div>
                                                    <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                                                        <p className="text-[10px] font-bold text-primary uppercase">Won Deals</p>
                                                        <p className="text-lg font-black text-foreground">{data.wonDeals}</p>
                                                    </div>
                                                </div>

                                                {/* Contact Information */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold text-foreground uppercase border-b border-border pb-2">Contact Information</h4>
                                                    <div className="space-y-2">
                                                        <DetailRow icon={Phone} label="Phone" value={selectedCustomer.phone || '—'} />
                                                        <DetailRow icon={Globe} label="Website" value={selectedCustomer.website || '—'} />
                                                        <DetailRow icon={Briefcase} label="Industry" value={selectedCustomer.industry || '—'} />
                                                    </div>
                                                </div>

                                                {/* Primary Contact */}
                                                {(selectedCustomer as any).primary_contact && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-foreground uppercase border-b border-border pb-2">Primary Contact</h4>
                                                        <div className="space-y-2">
                                                            <DetailRow icon={User} label="Name" value={`${(selectedCustomer as any).primary_contact.first_name || ''} ${(selectedCustomer as any).primary_contact.last_name || ''}`.trim() || '—'} />
                                                            <DetailRow icon={Mail} label="Email" value={(selectedCustomer as any).primary_contact.email || '—'} />
                                                            <DetailRow icon={Briefcase} label="Title" value={(selectedCustomer as any).primary_contact.title || '—'} />
                                                        </div>
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="deals" className="p-6 space-y-3 mt-0">
                                                {data.opportunities.length === 0 ? (
                                                    <div className="py-12 text-center text-muted-foreground">
                                                        <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                        <p className="text-xs font-bold">No deals found for this customer.</p>
                                                    </div>
                                                ) : (
                                                    data.opportunities.map(opp => (
                                                        <Card key={opp.id} className="border-border shadow-sm">
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-bold text-foreground">{opp.name}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {opp.close_date ? new Date(opp.close_date).toLocaleDateString() : 'No close date'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-foreground">{fmt(Number(opp.amount))}</p>
                                                                    <Badge variant={opp.stage === 'won' ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                                                                        {opp.stage.replace('_', ' ')}
                                                                    </Badge>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                )}
                                            </TabsContent>

                                            <TabsContent value="invoices" className="p-6 space-y-3 mt-0">
                                                {data.invoices.length === 0 ? (
                                                    <div className="py-12 text-center text-muted-foreground">
                                                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                        <p className="text-xs font-bold">No invoices found for this customer.</p>
                                                    </div>
                                                ) : (
                                                    data.invoices.map(inv => (
                                                        <Card key={inv.id} className="border-border shadow-sm">
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-bold text-foreground">{inv.invoice_number}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        Due: {new Date(inv.due_date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-foreground">{fmt(Number(inv.amount))}</p>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn("mt-1 text-[10px] font-bold",
                                                                            inv.status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                                                inv.status === 'overdue' ? 'border-red-200 text-red-700 bg-red-50' :
                                                                                    'border-amber-200 text-amber-700 bg-amber-50'
                                                                        )}
                                                                    >
                                                                        {inv.status}
                                                                    </Badge>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </div>
                            );
                        })()}
                    </SheetContent>
                </Sheet>
            </ModuleGuard>
        </DashboardShell>
    );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                <Icon size={12} className="text-muted-foreground" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
                <p className="text-xs font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}
