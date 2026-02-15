'use client';

import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Database, Package, ShoppingCart, UserCheck, 
    Users, Building2, MapPin, Globe2, 
    ChevronRight, ArrowUpRight, Plus,
    Search, Filter, LayoutGrid, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MasterDataPage() {
    const router = useRouter();

    const masterCategories = [
        {
            title: 'Inventory & Materials',
            desc: 'Fundamental items used in production and sales',
            icon: Package,
            color: 'bg-blue-50 text-blue-600',
            links: [
                { label: 'Product Catalog', href: '/admin/inventory', count: '1,200+' },
                { label: 'Product Variants', href: '/admin/inventory', count: '450' },
                { label: 'UOM Management', href: '/admin/inventory', count: '12' },
            ]
        },
        {
            title: 'Supply Chain Partners',
            desc: 'External vendors and logistics providers',
            icon: ShoppingCart,
            color: 'bg-orange-50 text-orange-600',
            links: [
                { label: 'Vendor Directory', href: '/admin/purchases', count: '85' },
                { label: 'Sub-Contractors', href: '/admin/purchases', count: '14' },
                { label: 'Price Agreements', href: '/admin/purchases', count: 'Active' },
            ]
        },
        {
            title: 'Customer Accounts',
            desc: 'Client records, contacts, and accounts',
            icon: UserCheck,
            color: 'bg-emerald-50 text-emerald-600',
            links: [
                { label: 'B2B Customers', href: '/admin/sales', count: '320' },
                { label: 'Active Contacts', href: '/admin/sales', count: '1,100' },
                { label: 'Sales Territories', href: '/admin/sales', count: '5' },
            ]
        },
        {
            title: 'Workforce & Teams',
            desc: 'Internal employees and role assignments',
            icon: Users,
            color: 'bg-violet-50 text-violet-600',
            links: [
                { label: 'Staff Directory', href: '/admin/hr', count: '175' },
                { label: 'Departments', href: '/admin/hr', count: '8' },
                { label: 'Skill Matrices', href: '/admin/hr', count: 'Managed' },
            ]
        }
    ];

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Data</h1>
                                <p className="text-sm text-slate-500 font-medium">
                                    The "Brain" of the system: Centralized core business entities
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl font-bold border-2">
                            <Search className="h-4 w-4 mr-2" /> Global Search
                        </Button>
                    </div>
                </div>

                {/* Grid of Master Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {masterCategories.map((cat) => (
                        <Card key={cat.title} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.color)}>
                                        <cat.icon size={28} />
                                    </div>
                                    <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[10px] tracking-widest px-3 py-1">
                                        MASTER RECORDS
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900">{cat.title}</CardTitle>
                                <CardDescription className="font-medium text-slate-400 mt-1">{cat.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-3">
                                {cat.links.map((link) => (
                                    <Link key={link.label} href={link.href} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 transition-all group/link">
                                        <span className="font-bold text-slate-700">{link.label}</span>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-400 font-black text-[10px]">{link.count}</Badge>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover/link:text-primary transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Utility Card */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 p-10 text-white relative overflow-hidden">
                    <Database className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5" />
                    <div className="relative z-10 space-y-6 max-w-2xl">
                        <h2 className="text-3xl font-black tracking-tight">Data Integrity Control</h2>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Master data is synchronized in real-time across all operational hubs. Ensure your primary records are accurate to maintain financial and logistical consistency.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black px-8 h-14">
                                Export Master Data
                            </Button>
                            <Button variant="outline" className="rounded-2xl border-2 border-white/20 hover:bg-white/5 font-black px-8 h-14">
                                Data Cleanup Wizard
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
