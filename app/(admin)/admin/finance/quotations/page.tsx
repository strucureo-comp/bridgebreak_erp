'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Trash2, Plus, FileText, Search, ChevronRight } from 'lucide-react';
import { getQuotations, deleteQuotation, getUsers } from '@/lib/api';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Quotation, User } from '@/lib/db/types';

export default function AdminQuotationsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [q, u] = await Promise.all([getQuotations(), getUsers()]);
            setQuotations(q || []);
            setUsers(u || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = useMemo(() => {
        return quotations.filter(q =>
            q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.client_company || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [quotations, searchQuery]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Permanently delete this quotation?')) {
            try {
                await deleteQuotation(id);
                toast.success('Quotation deleted');
                fetchData();
            } catch { toast.error('Delete failed'); }
        }
    };

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Estimates & Quotes</h1>
                        <p className="text-muted-foreground mt-1">Draft, send, and track project cost estimates.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search quotes..."
                                className="pl-9 h-10 w-64 border-border bg-background"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button onClick={() => router.push('/admin/finance/quotations/new')} size="sm" className="h-10 gap-2 font-bold shadow-sm">
                            <Plus className="h-4 w-4" /> New Quotation
                        </Button>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg shadow-sm divide-y divide-border">
                    {filteredQuotations.map(q => (
                        <div key={q.id} onClick={() => router.push(`/admin/finance/quotations/${q.id}`)} className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-bold text-foreground">{q.quotation_number}</h3>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            q.status === 'accepted' ? "bg-emerald-50 text-emerald-600 border-none" :
                                                q.status === 'rejected' ? "bg-rose-50 text-rose-600 border-none" :
                                                    "bg-amber-50 text-amber-600 border-none"
                                        )}>
                                            {q.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {q.client_company || q.client_name || 'Individual'} • Valid until {new Date(q.valid_until).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">${Number(q.amount).toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">Estimate</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDelete(e, q.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredQuotations.length === 0 && (
                        <div className="py-16 text-center">
                            <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm font-bold text-foreground">No quotes found</p>
                            <p className="text-xs text-muted-foreground mt-1">Create a new drafted proposal to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}