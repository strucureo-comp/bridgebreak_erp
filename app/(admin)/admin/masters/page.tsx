'use client';

import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Database, Package, ShoppingCart, UserCheck,
    Users, ChevronRight, Search, Zap, Activity,
    ShieldCheck, Filter, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MasterDataPage() {
    const router = useRouter();

    const masterCategories = [
        {
            title: 'Inventory & Materials',
            desc: 'Production and sales items',
            icon: Package,
            color: 'text-emerald-500',
            links: [
                { label: 'Product Catalog', href: '/admin/inventory', count: '1,200+' },
                { label: 'UOM Management', href: '/admin/inventory', count: '12' },
                { label: 'Warehouse Registry', href: '/admin/inventory', count: '4' },
            ]
        },
        {
            title: 'Supply Chain',
            desc: 'Vendors and logistics',
            icon: ShoppingCart,
            color: 'text-blue-500',
            links: [
                { label: 'Vendor Directory', href: '/admin/purchases', count: '85' },
                { label: 'Price Agreements', href: '/admin/purchases', count: 'Active' },
                { label: 'Carrier List', href: '/admin/purchases', count: '12' },
            ]
        },
        {
            title: 'Customer Accounts',
            desc: 'Client records and contacts',
            icon: UserCheck,
            color: 'text-indigo-500',
            links: [
                { label: 'B2B Customers', href: '/admin/sales', count: '320' },
                { label: 'Territories', href: '/admin/sales', count: '5' },
                { label: 'Lead Sources', href: '/admin/sales', count: '8' },
            ]
        },
        {
            title: 'Workforce',
            desc: 'Staff and departments',
            icon: Users,
            color: 'text-orange-500',
            links: [
                { label: 'Staff Directory', href: '/admin/hr', count: '175' },
                { label: 'Departments', href: '/admin/hr', count: '8' },
                { label: 'Role Permissions', href: '/admin/settings', count: '12' },
            ]
        }
    ];

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">Master Registry</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Core Entity Control</span>
                                <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                                    System Global
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Search registries..."
                                className="h-9 w-64 pl-9 rounded-lg border border-border bg-card text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 gap-2 text-[12px] font-semibold border-border">
                            <Filter className="h-3.5 w-3.5" /> Filter
                        </Button>
                        <Button size="sm" className="h-9 gap-2 text-[12px] font-semibold bg-primary text-card-foreground shadow-lg shadow-primary/20">
                            <Plus className="h-3.5 w-3.5" /> Define New
                        </Button>
                    </div>
                </div>

                {/* Registry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {masterCategories.map((cat) => (
                        <Card key={cat.title} className="border-border shadow-sm rounded-xl overflow-hidden bg-card group hover:border-primary/50 transition-all duration-300">
                            <CardHeader className="border-b border-border bg-muted/30 py-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm", cat.color)}>
                                        <cat.icon size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-[14px] font-bold text-foreground">{cat.title}</CardTitle>
                                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">{cat.desc}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold border-border bg-card">CORE REGISTRY</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {cat.links.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all group/link"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-zinc-200 group-hover/link:bg-primary transition-colors" />
                                                <span className="text-[13px] font-semibold text-muted-foreground group-hover/link:text-zinc-900">{link.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">{link.count}</span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover/link:text-primary transition-all translate-x-0 group-hover/link:translate-x-1" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* System Integrity Notification */}
                <Card className="border border-primary/20 shadow-lg shadow-primary/5 rounded-xl bg-card p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-3 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary text-card-foreground flex items-center justify-center shadow-md">
                                    <ShieldCheck size={18} />
                                </div>
                                <h2 className="text-[16px] font-bold text-foreground uppercase tracking-widest">Master Data Integrity</h2>
                            </div>
                            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                                Registry records are globally synchronized across the Enterprise OS. Changes to core items (UOM, GL Codes, Entities) will trigger a system-wide re-index to maintain fiscal consistency.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button size="sm" className="bg-foreground text-card-foreground hover:bg-zinc-800 h-10 px-6 text-[12px] font-bold uppercase tracking-widest rounded-lg">
                                Sync Engine
                            </Button>
                            <Button variant="outline" size="sm" className="border-border bg-card text-muted-foreground hover:text-primary h-10 px-6 text-[12px] font-bold uppercase tracking-widest rounded-lg">
                                Export Schema
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}