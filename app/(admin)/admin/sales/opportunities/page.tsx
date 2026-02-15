'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getOpportunities, createOpportunity, getCustomers } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import {
    Briefcase,
    Search,
    RefreshCcw,
    ChevronRight,
    Plus,
    DollarSign,
    Calendar,
    Target
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import type { Opportunity, CustomerAccount } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function SalesOpportunitiesPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        account_id: '',
        amount: 0,
        stage: 'prospecting',
        probability: 10,
        close_date: ''
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [opps, custs] = await Promise.all([
                getOpportunities(),
                getCustomers()
            ]);
            setOpportunities(opps || []);
            setCustomers(custs || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const STAGES = [
        { id: 'prospecting', label: 'Prospecting', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-600' },
        { id: 'qualification', label: 'Qualification', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-600' },
        { id: 'proposal', label: 'Proposal', color: 'bg-purple-500', light: 'bg-purple-50 text-purple-600' },
        { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500', light: 'bg-orange-50 text-orange-600' },
        { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-600' },
        { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500', light: 'bg-red-50 text-red-600' },
    ];

    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(o =>
            o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.account?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [opportunities, searchQuery]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.account_id) return toast.error('Name and Account are required');
        try {
            await createOpportunity(formData);
            toast.success('Opportunity created');
            setIsCreateOpen(false);
            fetchData();
            setFormData({ name: '', account_id: '', amount: 0, stage: 'prospecting', probability: 10, close_date: '' });
        } catch { toast.error('Failed to create opportunity'); }
    };

    const getStageOpps = (stageId: string) => filteredOpportunities.filter(o => o.stage === stageId);

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-bold text-slate-900">Syncing Pipeline Data...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12 w-full overflow-x-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-[300px]">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Opportunities</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            Manage your sales pipeline and forecast revenue.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-slate-900 h-12 px-8 font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform">
                                <Plus className="h-5 w-5 mr-2" /> New Deal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-[2.5rem] p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Create Opportunity</DialogTitle>
                                <DialogDescription>Add a new deal to the pipeline.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Opportunity Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="Q3 License Deal" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account</Label>
                                    <Select onValueChange={v => setFormData({ ...formData, account_id: v })}>
                                        <SelectTrigger className="rounded-xl h-12">
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Estimated Amount</Label>
                                        <Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Probability (%)</Label>
                                        <Input type="number" value={formData.probability} onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })} className="rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Close Date</Label>
                                    <Input type="date" value={formData.close_date} onChange={e => setFormData({ ...formData, close_date: e.target.value })} className="rounded-xl" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="w-full rounded-xl h-12 bg-primary font-bold">Create Deal</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex gap-6 pb-6 overflow-x-auto min-w-full">
                    {STAGES.map(stage => {
                        const stageOpps = getStageOpps(stage.id);
                        const totalValue = stageOpps.reduce((sum, o) => sum + Number(o.amount || 0), 0);

                        return (
                            <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                                        <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">{stage.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400">{stageOpps.length}</span>
                                </div>
                                <div className="px-2 pb-2 border-b-2 border-slate-100 flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Value</span>
                                    <span className="text-sm font-black text-slate-700">${totalValue.toLocaleString()}</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {stageOpps.map(opp => (
                                        <Card key={opp.id} className="rounded-[1.5rem] border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group">
                                            <CardContent className="p-5 space-y-3">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{opp.name}</h4>
                                                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                        <Briefcase size={10} />
                                                        {opp.account?.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                        <DollarSign size={12} strokeWidth={3} />
                                                        <span className="text-xs font-black">{Number(opp.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <Target size={12} />
                                                        <span className="text-xs font-bold">{opp.probability}%</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {stageOpps.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                                            <span className="text-xs font-bold text-slate-300 uppercase">No Deals</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardShell>
    );
}
