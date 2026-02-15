'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    Cog, FolderKanban, ClipboardList, Clock, Receipt,
    Package, Truck, Users, Search, Plus,
    ChevronRight, TrendingUp, AlertCircle, CheckCircle2,
    Timer, FileText, ArrowRight, Loader2,
    ShoppingCart, Warehouse, BarChart3, Target,
    Briefcase, Calendar, DollarSign, Factory,
    ArrowUpRight, ArrowRightLeft, Building2, Settings
} from 'lucide-react';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/db/types';
import { ModuleGuard } from '@/components/layout/module-guard';

export default function OperationsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const [proj] = await Promise.all([
                getProjects().catch(() => []),
            ]);
            setProjects(proj || []);
        } catch (err) {
            console.error('Operations data fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const active = projects.filter(p => ['accepted', 'in_progress', 'testing'].includes(p.status));
        const pending = projects.filter(p => p.status === 'pending');
        const completed = projects.filter(p => p.status === 'completed');
        return { active, pending, completed, total: projects.length };
    }, [projects]);

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="operations">
                <div className="space-y-8 pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                    <Cog className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operations Hub</h1>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Project Lifecycle: Planning, Procurement, Stock & Manufacturing
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button className="rounded-xl font-bold gap-2" onClick={() => router.push('/admin/projects/new')}>
                                <Plus className="h-4 w-4" /> New Project
                            </Button>
                        </div>
                    </div>

                    {/* KPI Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <OpsKPI label="Active Projects" value={stats.active.length.toString()} icon={FolderKanban} color="violet" />
                        <OpsKPI label="Pending Review" value={stats.pending.length.toString()} icon={AlertCircle} color="amber" />
                        <OpsKPI label="Completed" value={stats.completed.length.toString()} icon={CheckCircle2} color="emerald" />
                        <OpsKPI label="Total Projects" value={stats.total.toString()} icon={BarChart3} />
                    </div>

                    {/* Main Tabs - Logical Lifecycle */}
                    <Tabs defaultValue="projects" className="space-y-6">
                        <TabsList className="rounded-2xl bg-white border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="projects" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <FolderKanban className="h-3.5 w-3.5" /> 1. Project Planning
                            </TabsTrigger>
                            <TabsTrigger value="procurement" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <ShoppingCart className="h-3.5 w-3.5" /> 2. Procurement
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Warehouse className="h-3.5 w-3.5" /> 3. Inventory
                            </TabsTrigger>
                            <TabsTrigger value="manufacturing" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Factory className="h-3.5 w-3.5" /> 4. Manufacturing
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Clock className="h-3.5 w-3.5" /> 5. Execution (Time)
                            </TabsTrigger>
                        </TabsList>

                        {/* Projects Tab */}
                        <TabsContent value="projects">
                            <Card className="rounded-3xl border-border/50 overflow-hidden">
                                <CardHeader className="pb-4 border-b bg-muted/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold">Active Project Portfolio</CardTitle>
                                            <CardDescription className="text-xs font-medium">Monitor project health, budgets, and deadlines</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" onClick={() => router.push('/admin/projects')}>
                                            Full Board View
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/20">
                                            <TableRow>
                                                <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Project Title</TableHead>
                                                <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Status</TableHead>
                                                <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Budget</TableHead>
                                                <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Deadline</TableHead>
                                                <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-wider">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projects.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-muted/10 transition-colors group">
                                                    <TableCell className="px-6">
                                                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{p.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{p.description}</p>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <Badge className={cn(
                                                            "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border-none",
                                                            p.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                                                            p.status === 'in_progress' ? "bg-blue-50 text-blue-600" :
                                                            "bg-slate-100 text-slate-600"
                                                        )}>{p.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 font-bold text-slate-700">${Number(p.estimated_cost || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="px-6 text-xs font-medium text-slate-500">{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No date'}</TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => router.push(`/admin/projects/${p.id}`)}>
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Procurement Tab */}
                        <TabsContent value="procurement" className="space-y-6">
                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4 text-primary" />
                                            Logistics & Buying
                                        </CardTitle>
                                        <Button className="rounded-xl font-bold" onClick={() => router.push('/admin/purchases/new')}>
                                            New Purchase Order
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <OpsLinkCard title="Purchase Requests" desc="Internal material needs" icon={FileText} href="/admin/purchases" color="orange" />
                                    <OpsLinkCard title="Purchase Orders" desc="External supplier orders" icon={ShoppingCart} href="/admin/purchases" color="blue" />
                                    <OpsLinkCard title="Goods Receipts" desc="Incoming inventory (GRN)" icon={Truck} href="/admin/purchases" color="emerald" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Inventory Tab */}
                        <TabsContent value="inventory" className="space-y-6">
                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Warehouse className="h-4 w-4 text-primary" />
                                        Warehouse & Stock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <OpsLinkCard title="Current Stock" desc="On-hand inventory levels" icon={Package} href="/admin/inventory" color="violet" />
                                    <OpsLinkCard title="Stock Movements" desc="Internal transfers & logs" icon={ArrowRightLeft} href="/admin/inventory" color="blue" />
                                    <OpsLinkCard title="Warehouses" desc="Storage location management" icon={Building2} href="/admin/inventory" color="cyan" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Manufacturing Tab */}
                        <TabsContent value="manufacturing" className="space-y-6">
                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Factory className="h-4 w-4 text-primary" />
                                        Production Control
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <OpsLinkCard title="Bill of Materials" desc="BOM & product structures" icon={ClipboardList} href="/admin/manufacturing" color="amber" />
                                    <OpsLinkCard title="Production Orders" desc="Work orders for fabrication" icon={Settings} href="/admin/manufacturing" color="orange" />
                                    <OpsLinkCard title="Finished Goods" desc="Output of production" icon={CheckCircle2} href="/admin/manufacturing" color="emerald" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Execution Tab */}
                        <TabsContent value="tasks" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="rounded-3xl border-border/50">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-base font-bold">Project Tasks</CardTitle>
                                        <Button size="sm" variant="outline" className="rounded-xl font-bold">Assign Tasks</Button>
                                    </CardHeader>
                                    <CardContent className="py-12 text-center text-slate-400">
                                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">No tasks assigned.</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-border/50">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-base font-bold">Labour & Timesheets</CardTitle>
                                        <Button size="sm" variant="outline" className="rounded-xl font-bold">View HR Link</Button>
                                    </CardHeader>
                                    <CardContent className="py-12 text-center text-slate-400">
                                        <Timer className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">No timesheets submitted today.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function OpsKPI({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color?: string }) {
    const colors: Record<string, string> = {
        violet: 'bg-violet-50 text-violet-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colors[color || ''] || 'bg-slate-50 text-slate-600')}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function OpsLinkCard({ title, desc, icon: Icon, href, color }: { title: string; desc: string; icon: any; href: string; color: string }) {
    const variants: any = {
        orange: 'bg-orange-50 text-orange-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <Link href={href}>
            <Card className="rounded-2xl border-border/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-6">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", variants[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">{title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </CardContent>
            </Card>
        </Link>
    );
}