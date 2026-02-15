'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    Settings, Building2, Globe2, Shield, Database,
    Bell, Palette, Users, Lock, Monitor,
    ChevronRight, CheckCircle2, AlertCircle,
    Mail, FileText, Zap, RefreshCcw, Activity,
    Package, ShoppingCart, UserCheck, LayoutGrid,
    CreditCard
} from 'lucide-react';

import { ModuleGuard } from '@/components/layout/module-guard';
import Link from 'next/link';

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="settings">
                <div className="space-y-8 pb-12">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                <Settings className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Hub</h1>
                                <p className="text-sm text-slate-500 font-medium">
                                    Global Configuration, Identity Management & Master Data
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full text-[10px] font-semibold px-3 py-1.5">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> SYSTEM STABLE
                            </Badge>
                        </div>
                    </div>

                    {/* Main Tabs - Logical Lifecycle */}
                    <Tabs defaultValue="organization" className="space-y-6">
                        <TabsList className="rounded-2xl bg-white border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="organization" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Building2 className="h-3.5 w-3.5" /> 1. Organization
                            </TabsTrigger>
                            <TabsTrigger value="identity" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Shield className="h-3.5 w-3.5" /> 2. Identity & Roles
                            </TabsTrigger>
                            <TabsTrigger value="masters" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Database className="h-3.5 w-3.5" /> 3. Master Data
                            </TabsTrigger>
                            <TabsTrigger value="config" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Zap className="h-3.5 w-3.5" /> 4. Integrations
                            </TabsTrigger>
                            <TabsTrigger value="maintenance" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Activity className="h-3.5 w-3.5" /> 5. System Health
                            </TabsTrigger>
                        </TabsList>

                        {/* 1. Organization Content */}
                        <TabsContent value="organization" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            Legal Entity Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Legal Name</Label>
                                                <Input defaultValue="System Steel Engineering LLC" className="rounded-xl h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Tax/License No.</Label>
                                                <Input defaultValue="TRD-2024-001" className="rounded-xl h-11" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Primary Industry</Label>
                                                <Select defaultValue="engineering">
                                                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="engineering">Engineering & Construction</SelectItem>
                                                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Base Currency</Label>
                                                <Select defaultValue="usd">
                                                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                                                        <SelectItem value="aed">AED - UAE Dirham</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20">Update Profile</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="space-y-4">
                                    <Card className="rounded-3xl border-border/50">
                                        <CardHeader><CardTitle className="text-base font-bold">Localization</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Timezone</Label>
                                                <Select defaultValue="gst"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gst">GST (Dubai)</SelectItem></SelectContent></Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Date Format</Label>
                                                <Select defaultValue="dd-mm-yyyy"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem></SelectContent></Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 2. Identity Content */}
                        <TabsContent value="identity" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group" onClick={() => router.push('/admin/users-roles')}>
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Users className="h-7 w-7" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Users & Access</h3>
                                        <p className="text-xs text-slate-500 mt-1">Manage system logins and permissions</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group" onClick={() => router.push('/admin/users-roles')}>
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Shield className="h-7 w-7" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Roles & Security</h3>
                                        <p className="text-xs text-slate-500 mt-1">Define module-level access controls</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group">
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Lock className="h-7 w-7" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">2FA & Auth</h3>
                                        <p className="text-xs text-slate-500 mt-1">Configure multi-factor authentication</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* 3. Master Data Content */}
                        <TabsContent value="masters" className="space-y-6">
                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Core Business Records</CardTitle>
                                    <CardDescription className="text-xs font-medium">Manage the centralized data used across all modules</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MasterLinkCard title="Products" desc="Items & Materials" icon={Package} href="/admin/inventory" color="blue" />
                                    <MasterLinkCard title="Vendors" desc="Suppliers & Sub-cons" icon={ShoppingCart} href="/admin/purchases" color="orange" />
                                    <MasterLinkCard title="Customers" desc="Clients & Accounts" icon={UserCheck} href="/admin/sales" color="emerald" />
                                    <MasterLinkCard title="Employees" desc="Staff Directory" icon={Users} href="/admin/hr" color="violet" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 4. Integrations Content */}
                        <TabsContent value="config" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <OpsLinkCard title="Email (SMTP)" desc="Transactional alerts" icon={Mail} connected={true} />
                                <OpsLinkCard title="Payments" desc="Stripe / Bank Feeds" icon={CreditCard} connected={false} />
                                <OpsLinkCard title="Tally / ERP" desc="Data synchronization" icon={RefreshCcw} connected={false} />
                            </div>
                        </TabsContent>

                        {/* 5. System Health Content */}
                        <TabsContent value="maintenance" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                    <CardHeader><CardTitle className="text-base font-bold">Audit Log</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {[
                                            { action: 'Config Change', user: 'Admin', time: '10m ago' },
                                            { action: 'User Created', user: 'Admin', time: '1h ago' },
                                        ].map((log, i) => (
                                            <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/20 text-xs font-medium">
                                                <span>{log.action} by <b>{log.user}</b></span>
                                                <span className="text-muted-foreground">{log.time}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-border/50">
                                    <CardHeader><CardTitle className="text-base font-bold">Maintenance</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button variant="outline" className="w-full rounded-xl text-xs font-bold gap-2">
                                            <Database className="h-4 w-4" /> Re-index Database
                                        </Button>
                                        <Button variant="outline" className="w-full rounded-xl text-xs font-bold gap-2">
                                            <Monitor className="h-4 w-4" /> Purge Cache
                                        </Button>
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

function MasterLinkCard({ title, desc, icon: Icon, href, color }: any) {
    const variants: any = {
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
    };
    return (
        <Link href={href}>
            <Card className="rounded-2xl border-none bg-slate-50 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", variants[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{desc}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function OpsLinkCard({ title, desc, icon: Icon, connected }: any) {
    return (
        <Card className="rounded-3xl border-border/50 group">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant={connected ? "default" : "outline"} className="rounded-full text-[9px] font-bold">
                        {connected ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                </div>
                <h4 className="font-bold text-slate-900">{title}</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">{desc}</p>
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-bold">Config</Button>
            </CardContent>
        </Card>
    );
}