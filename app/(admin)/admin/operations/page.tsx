'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    Cog, FolderKanban, ClipboardList, Clock,
    Package, Truck, Search, Plus,
    ChevronRight, AlertCircle, CheckCircle2,
    Timer, FileText, ShoppingCart, Warehouse, BarChart3,
    Factory, ArrowRightLeft, Building2, Settings, Activity
} from 'lucide-react';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/db/types';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';

function fmt(n: number): string {
    return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0
    }).format(n);
}

export default function OperationsPage() {
    const router = useRouter();
    const { tenantStatus, getModuleLabel } = useTenant();
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

    if (loading) return null;

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="operations">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                                <Cog className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">{getModuleLabel('operations')}</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Resource & Process Control</span>
                                    <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                                        Lifecycle HUB
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push('/admin/projects/new')}>
                                <Plus className="h-3.5 w-3.5" /> New Project
                            </Button>
                        </div>
                    </div>

                    {/* KPI Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard title="Active Projects" value={stats.active.length} icon={FolderKanban} trend="In Progress" trendUp />
                        <MetricCard title="Pending Review" value={stats.pending.length} icon={AlertCircle} trend="Review" trendUp={false} />
                        <MetricCard title="Completed" value={stats.completed.length} icon={CheckCircle2} trend="Finalized" trendUp />
                        <MetricCard title="Total Portfolio" value={stats.total} icon={BarChart3} trend="All Time" />
                    </div>

                    {/* Main Tabs */}
                    <Tabs defaultValue="projects" className="space-y-6">
                        <TabsList className="bg-muted/50 border h-10 p-0.5 w-full md:w-auto justify-start overflow-x-auto no-scrollbar">
                            <TabsTrigger value="projects" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">1. Planning</TabsTrigger>
                            <TabsTrigger value="procurement" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">2. Procurement</TabsTrigger>
                            <TabsTrigger value="inventory" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">3. Inventory</TabsTrigger>
                            <TabsTrigger value="manufacturing" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">4. Production</TabsTrigger>
                            <TabsTrigger value="tasks" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">5. Execution</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="mt-0">
                            <Card className="border shadow-sm rounded-md overflow-hidden">
                                <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold">Project Portfolio</CardTitle>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push('/admin/projects')}>
                                        Full Board View
                                    </Button>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-6 h-10 font-bold text-[10px] uppercase tracking-wider">Project</TableHead>
                                                <TableHead className="px-6 h-10 font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
                                                <TableHead className="px-6 h-10 font-bold text-[10px] uppercase tracking-wider">Budget</TableHead>
                                                <TableHead className="px-6 h-10 font-bold text-[10px] uppercase tracking-wider">Deadline</TableHead>
                                                <TableHead className="px-6 h-10 text-right font-bold text-[10px] uppercase tracking-wider">Audit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projects.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors cursor-pointer group" onClick={() => router.push(`/admin/projects/${p.id}`)}>
                                                    <TableCell className="px-6 py-4">
                                                        <p className="text-sm font-bold text-foreground">{p.title}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">{p.description}</p>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest",
                                                            p.status === 'completed' ? "border-emerald-100 text-emerald-700 bg-emerald-50" :
                                                                p.status === 'in_progress' ? "border-blue-100 text-blue-700 bg-blue-50" :
                                                                    "text-muted-foreground"
                                                        )}>{p.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 font-black text-xs text-foreground">{fmt(Number(p.estimated_cost || 0))}</TableCell>
                                                    <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">{p.deadline ? new Date(p.deadline).toLocaleDateString('en-AE') : '—'}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right">
                                                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="procurement" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <OpsLinkCard title="Purchase Requests" desc="Internal material needs" icon={FileText} href="/admin/purchases" />
                                <OpsLinkCard title="Purchase Orders" desc="External supplier orders" icon={ShoppingCart} href="/admin/purchases" />
                                <OpsLinkCard title="Goods Receipts" desc="Incoming inventory (GRN)" icon={Truck} href="/admin/purchases" />
                            </div>
                        </TabsContent>

                        <TabsContent value="inventory" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <OpsLinkCard title="Current Stock" desc="On-hand inventory levels" icon={Package} href="/admin/inventory" />
                                <OpsLinkCard title="Stock Movements" desc="Internal transfers & logs" icon={ArrowRightLeft} href="/admin/inventory" />
                                <OpsLinkCard title="Warehouses" desc="Storage locations" icon={Building2} href="/admin/inventory" />
                            </div>
                        </TabsContent>

                        <TabsContent value="manufacturing" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <OpsLinkCard title="Bill of Materials" desc="BOM & product structures" icon={ClipboardList} href="/admin/manufacturing" />
                                <OpsLinkCard title="Production Orders" desc="Work orders for fabrication" icon={Settings} href="/admin/manufacturing" />
                                <OpsLinkCard title="Finished Goods" desc="Output of production" icon={CheckCircle2} href="/admin/manufacturing" />
                            </div>
                        </TabsContent>

                        <TabsContent value="tasks" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border shadow-sm rounded-md overflow-hidden">
                                    <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-bold">Assigned Tasks</CardTitle>
                                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-widest">Assign</Button>
                                    </CardHeader>
                                    <div className="p-12 text-center text-muted-foreground italic">
                                        <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs font-medium">No tasks in current sprint.</p>
                                    </div>
                                </Card>
                                <Card className="border shadow-sm rounded-md overflow-hidden">
                                    <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-bold">Labour Timesheets</CardTitle>
                                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-widest">View HR</Button>
                                    </CardHeader>
                                    <div className="p-12 text-center text-muted-foreground italic">
                                        <Timer className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs font-medium">No activity recorded today.</p>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: any) {
    return (
        <Card className="border shadow-sm rounded-md bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    trendUp ? "bg-emerald-50 text-emerald-700" : trendUp === false ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground"
                )}>
                    {trend}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="text-xl font-bold tracking-tight text-foreground">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function OpsLinkCard({ title, desc, icon: Icon, href }: any) {
    return (
        <Link href={href}>
            <Card className="border shadow-sm rounded-md hover:border-primary/50 transition-all cursor-pointer group bg-card">
                <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                        <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{title}</h4>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight mt-1">{desc}</p>
                </CardContent>
            </Card>
        </Link>
    );
}