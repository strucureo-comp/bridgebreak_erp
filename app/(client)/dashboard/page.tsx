'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects, getInvoices } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Box,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Activity,
    Star,
    Calendar,
    RefreshCcw,
    Zap,
    ChevronRight,
    ArrowUpRight,
    MessageSquare,
    FileText,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import type { Project, Invoice } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function ClientDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [projectsData, invoicesData] = await Promise.all([
                getProjects(user?.id),
                getInvoices(user?.id)
            ]);
            setProjects(projectsData || []);
            setInvoices(invoicesData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        totalProjects: projects.length,
        active: projects.filter(p => ['accepted', 'in_progress', 'testing'].includes(p.status)).length,
        pendingPayments: invoices.filter(inv => inv.status === 'pending').length,
        paidPayments: invoices.filter(inv => inv.status === 'paid').length
    }), [projects, invoices]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-accent-purple" />
                    <p className="font-bold text-muted-foreground">Loading Your Portal...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="space-y-8 pb-12">

                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">Hello, {user?.full_name?.split(' ')[0]}</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <ShieldCheck size={18} className="text-accent-green" />
                            Your project environment is secure and up to date.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => router.push('/projects/new')} className="rounded-2xl bg-primary text-primary-foreground h-12 px-8 font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform">
                            <Plus className="h-5 w-5 mr-2" />
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Status Strip */}
                <div className="grid gap-6 md:grid-cols-4">
                    <ClientKPI title="All Projects" value={stats.totalProjects} icon={Box} color="black" />
                    <ClientKPI title="In Progress" value={stats.active} icon={Zap} color="indigo" />
                    <ClientKPI title="Unpaid Bills" value={stats.pendingPayments} icon={Clock} color="amber" />
                    <ClientKPI title="Settled" value={stats.paidPayments} icon={CheckCircle2} color="emerald" />
                </div>

                {/* Main View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Project Timeline */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-foreground">Recent Deployments</h2>
                            <Link href="/projects" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                                View All <ArrowUpRight size={14} />
                            </Link>
                        </div>

                        <div className="grid gap-6">
                            {projects.slice(0, 3).map(p => (
                                <Card key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all duration-500 cursor-pointer">
                                    <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
                                                <Box size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{p.title}</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    Updated {new Date(p.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12">
                                            <div className="space-y-2 text-right hidden md:block">
                                                <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                    <span>Progress</span>
                                                    <span className="text-foreground">65%</span>
                                                </div>
                                                <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary w-[65%] rounded-full" />
                                                </div>
                                            </div>
                                            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {projects.length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-border rounded-4xl bg-muted/20">
                                    <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No projects registered</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions & Finance */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="rounded-4xl border-none shadow-sm bg-primary text-primary-foreground p-8 overflow-hidden relative group">
                            <Star className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Service Center</p>
                                    <h3 className="text-2xl font-black">Need Assistance?</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/support/new" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors shadow-sm backdrop-blur-sm">
                                        <MessageSquare size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                                    </Link>
                                    <Link href="/meetings/new" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors shadow-sm backdrop-blur-sm">
                                        <Calendar size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Meeting</span>
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden group hover:shadow-xl transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-3">
                                    <FileText className="text-primary" size={20} />
                                    Settlements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                {invoices.slice(0, 3).map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between group/inv">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-foreground">#{inv.invoice_number}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{inv.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Amount Due</p>
                                        </div>
                                    </div>
                                ))}
                                {invoices.length === 0 && <p className="text-center py-4 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No pending bills</p>}
                                <Button variant="outline" className="w-full rounded-2xl border-border h-12 font-bold text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push('/invoices')}>
                                    Billing History
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

function ClientKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        indigo: "bg-primary/10 text-primary",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        black: "bg-secondary text-secondary-foreground",
        slate: "bg-muted text-muted-foreground",
    };
    return (
        <Card className="rounded-4xl border-border/60 shadow-sm bg-card p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
        </Card>
    );
}