'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getCustomers, createCustomer } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Users,
    Search,
    RefreshCcw,
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    Building2,
    Plus,
    Briefcase
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CustomerAccount } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function SalesCustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        phone: '',
        address: '',
        primary_contact: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            title: ''
        }
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
            await createCustomer(formData);
            toast.success('Customer account created');
            setIsCreateOpen(false);
            fetchData();
            setFormData({
                name: '', industry: '', website: '', phone: '', address: '',
                primary_contact: { first_name: '', last_name: '', email: '', phone: '', title: '' }
            });
        } catch { toast.error('Failed to create customer'); }
    };

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-bold text-slate-900">Syncing CRM Database...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Customers</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Manage relationships with key accounts and organizations.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-slate-900 h-12 px-8 font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform">
                                <Plus className="h-5 w-5 mr-2" /> New Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-[2.5rem] p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Register Account</DialogTitle>
                                <DialogDescription>Add a new organization to the CRM.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest">Organization Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Account Name</Label>
                                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="Acme Inc." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Industry</Label>
                                            <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} className="rounded-xl" placeholder="Technology" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Website</Label>
                                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="rounded-xl" placeholder="https://..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl" placeholder="+1..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest">Primary Contact</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input value={formData.primary_contact.first_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, first_name: e.target.value } })} className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input value={formData.primary_contact.last_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, last_name: e.target.value } })} className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={formData.primary_contact.email} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, email: e.target.value } })} className="rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="w-full rounded-xl h-12 bg-primary font-bold">Create Account</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900">All Accounts</h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search accounts..."
                                className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCustomers.map(customer => (
                            <Card key={customer.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 line-clamp-1">{customer.name}</h3>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                                <Briefcase size={14} />
                                                <span>{customer.industry || 'General'}</span>
                                            </div>
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                            <Building2 size={24} />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-slate-50">
                                        {customer.website && (
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Search size={14} />
                                                </div>
                                                <span className="truncate">{customer.website}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <MapPin size={14} />
                                                </div>
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold bg-emerald-50 text-emerald-600 border-none">
                                            {customer.opportunities?.length || 0} Opportunities
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-300 hover:text-slate-900 transition-colors">
                                            <ChevronRight size={20} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
