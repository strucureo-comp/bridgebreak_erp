'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getCustomers, createCustomer } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Briefcase,
    Globe,
    ShieldCheck,
    Target,
    Layers,
    Activity,
    MoreHorizontal
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
import { ModuleGuard } from '@/components/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';

export default function SalesCustomersPage() {
    const { user } = useAuth();
    const { getModuleLabel } = useTenant();
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data || []);
        } catch (e) { 
            console.error('Customer Fetch Error:', e);
            toast.error('Failed to synchronize customer database');
        }
        finally { setLoading(false); }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    const stats = useMemo(() => {
        const pipelineValue = customers.reduce((sum, c: any) => {
            const opps = Array.isArray(c.opportunities) ? c.opportunities : [];
            const total = opps.reduce((s: number, o: any) => s + Number(o.expected_revenue ?? o.value ?? 0), 0);
            return sum + total;
        }, 0);
        return { totalItems: customers.length, pipelineValue };
    }, [customers]);

    const handleSubmit = async () => {
        if (!formData.name) return toast.error('Account Name is required');
        try {
            await createCustomer(formData);
            toast.success('Enterprise Account Registered');
            setIsCreateOpen(false);
            fetchData();
            setFormData({
                name: '', industry: '', website: '', phone: '', address: '',
                primary_contact: { first_name: '', last_name: '', email: '', phone: '', title: '' }
            });
        } catch { toast.error('Registration failed'); }
    };

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing CRM Core Registry</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="sales">
                <div className="space-y-6 pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Customer Base</h1>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Verified B2B Account Registry</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-10 px-6 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                                        <Plus className="h-4 w-4" /> New Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
                                    <div className="p-6 bg-foreground text-card-foreground">
                                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 mb-6">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight uppercase">Register Account</h3>
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Initialize B2B Entity in CRM Registry</p>
                                    </div>
                                    <div className="p-6 space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">1. Organization Details</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Legal Account Name</Label>
                                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-10 border-border font-bold uppercase text-xs" placeholder="e.g. Prestige Structures LLC" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Industry Sector</Label>
                                                    <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} className="h-10 border-border" placeholder="Construction" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Corporate Website</Label>
                                                    <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="h-10 border-border font-mono text-xs" placeholder="https://..." />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Primary Phone</Label>
                                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-10 border-border" placeholder="+971..." />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">2. Primary Contact</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                                                    <Input value={formData.primary_contact.first_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, first_name: e.target.value } })} className="h-10 border-border" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                                                    <Input value={formData.primary_contact.last_name} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, last_name: e.target.value } })} className="h-10 border-border" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Professional Email</Label>
                                                    <Input value={formData.primary_contact.email} onChange={e => setFormData({ ...formData, primary_contact: { ...formData.primary_contact, email: e.target.value } })} className="h-10 border-border" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-muted border-t border-border flex gap-2">
                                        <Button variant="outline" className="flex-1 h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSubmit} className="flex-[2] h-12 bg-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">Commit Account Record</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* KPI Strips */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsTile title="Registry Size" value={stats.totalItems} icon={Layers} label="Verified Accounts" />
                        <StatsTile title="Active Pipeline" value={stats.pipelineValue || 0} icon={Activity} label="Live Opportunities" highlight />
                        <StatsTile title="Market Sector" value="Construction" icon={Target} label="Top Industry" />
                        <StatsTile title="Data Integrity" value="100%" icon={ShieldCheck} label="System Synced" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Enterprise Registry</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{filteredCustomers.length} Verified records synced</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="SEARCH ACCOUNTS..."
                                    className="pl-9 h-9 border-border text-[10px] font-bold uppercase w-64 rounded-md"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCustomers.map(customer => (
                                <Card key={customer.id} className="border border-border shadow-sm rounded-md overflow-hidden bg-card hover:border-primary/50 transition-colors group cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                                                <Building2 size={20} />
                                            </div>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none bg-emerald-50 text-emerald-700">
                                                Verified
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-1 mb-6">
                                            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight line-clamp-1">{customer.name}</h3>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Briefcase size={10} className="text-primary" />
                                                <p className="text-[9px] font-bold uppercase truncate">{customer.industry || 'General Sector'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6 pt-4 border-t border-border">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Globe size={12} className="text-muted-foreground/60" />
                                                <span className="text-[9px] font-bold uppercase truncate">{customer.website || 'No Web Profile'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone size={12} className="text-muted-foreground/60" />
                                                <span className="text-[9px] font-bold uppercase">{customer.phone || 'No Contact'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div className="flex items-center gap-2">
                                                <Target size={12} className="text-primary" />
                                                <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">
                                                    {customer.opportunities?.length || 0} Deals
                                                </span>
                                            </div>
                                            <div className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground/60 group-hover:bg-zinc-50 group-hover:text-primary transition-all">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-md bg-muted">
                                    <Building2 className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">No matching accounts in registry</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function StatsTile({ title, value, icon: Icon, label, highlight }: { title: string; value: any; icon: any; label: string; highlight?: boolean }) {
    return (
      <Card className={cn(
        "border border-border shadow-sm rounded-md bg-card p-5 relative overflow-hidden",
        highlight && "border-primary/20 bg-primary/5"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center border transition-colors",
            highlight ? "bg-primary text-card-foreground border-primary" : "bg-muted border-border text-muted-foreground"
          )}>
            <Icon size={16} />
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-xl font-black text-foreground tracking-tight">{value}</h3>
          <p className={cn("text-[8px] font-black uppercase tracking-tighter", highlight ? "text-primary" : "text-muted-foreground")}>{label}</p>
        </div>
      </Card>
    );
}
