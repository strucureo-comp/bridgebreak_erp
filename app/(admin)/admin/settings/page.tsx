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
    CreditCard, GitBranch, Banknote, Landmark,
    Sparkles, Clock, Crown, Briefcase, Eye,
    MoreHorizontal, UserPlus, Pencil, XCircle
} from 'lucide-react';

import { ModuleGuard } from '@/components/layout/module-guard';
import Link from 'next/link';

// Import local logic components (defined below)
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
                                    Infrastructure Control: Company, Identity & Global Config
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full text-[10px] font-semibold px-3 py-1.5">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> CORE SERVICES ACTIVE
                            </Badge>
                        </div>
                    </div>

                    {/* Unified Tabs */}
                    <Tabs defaultValue="company" className="space-y-6">
                        <TabsList className="rounded-2xl bg-white border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="company" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Building2 className="h-3.5 w-3.5" /> 1. Company Profile
                            </TabsTrigger>
                            <TabsTrigger value="identity" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Shield className="h-3.5 w-3.5" /> 2. Users & Roles
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Bell className="h-3.5 w-3.5" /> 3. Notifications
                            </TabsTrigger>
                            <TabsTrigger value="integrations" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Zap className="h-3.5 w-3.5" /> 4. Integrations
                            </TabsTrigger>
                            <TabsTrigger value="maintenance" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Activity className="h-3.5 w-3.5" /> 5. Health & Audit
                            </TabsTrigger>
                        </TabsList>

                        {/* --- Tab Contents --- */}
                        <TabsContent value="company"><CompanyTabContent /></TabsContent>
                        <TabsContent value="identity"><IdentityTabContent /></TabsContent>
                        <TabsContent value="notifications"><NotificationsTabContent /></TabsContent>
                        <TabsContent value="integrations"><IntegrationsTabContent /></TabsContent>
                        <TabsContent value="maintenance"><MaintenanceTabContent /></TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. COMPANY TAB CONTENT (Unified from previous company page)
// ════════════════════════════════════════════════════════════════════════════
function CompanyTabContent() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-3xl border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Entity Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trading Name</Label>
                                <Input defaultValue="System Steel Engineering LLC" className="rounded-xl h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal Name</Label>
                                <Input defaultValue="System Steel Engineering LLC" className="rounded-xl h-11" />
                            </div>
                        </div>
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-900"> Regional Configuration</h4>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Base Currency</Label>
                                    <Input defaultValue="USD" className="rounded-xl h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tax ID / TRN</Label>
                                    <Input defaultValue="TRN-100-234-567" className="rounded-xl h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timezone</Label>
                                    <Input defaultValue="GST (Dubai)" className="rounded-xl h-11" disabled />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20">Save Profile</Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="space-y-4">
                    <Card className="rounded-3xl border-border/50 bg-primary/5 border-primary/10">
                        <CardHeader><CardTitle className="text-base font-bold text-primary">Regional Active Status</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Badge className="bg-emerald-500 text-white rounded-lg px-3 py-1 font-black text-[10px] tracking-widest">ENABLED</Badge>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                Your regional settings affect financial year closing, tax reporting periods, and invoice formatting.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. IDENTITY TAB CONTENT (Unified from previous users-roles page)
// ════════════════════════════════════════════════════════════════════════════
function IdentityTabContent() {
    const router = useRouter();
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/users-roles" className="block">
                    <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-6 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Users className="h-7 w-7" />
                            </div>
                            <h3 className="font-black text-slate-900">User Management</h3>
                            <p className="text-xs text-slate-500 mt-1">Manage system logins</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/users-roles" className="block">
                    <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-6 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Shield className="h-7 w-7" />
                            </div>
                            <h3 className="font-black text-slate-900">Access Roles</h3>
                            <p className="text-xs text-slate-500 mt-1">Define permissions</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card className="rounded-3xl border-border/50 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Lock className="h-7 w-7" />
                        </div>
                        <h3 className="font-black text-slate-900">Authentication</h3>
                        <p className="text-xs text-slate-500 mt-1">2FA & Security Policies</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. NOTIFICATIONS TAB CONTENT
// ════════════════════════════════════════════════════════════════════════════
function NotificationsTabContent() {
    return (
        <Card className="rounded-3xl border-border/50">
            <CardHeader><CardTitle className="text-base font-bold">Alert Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <SettingToggle label="Invoice Reminders" description="Auto-send to customers" defaultChecked={true} />
                <SettingToggle label="Low Stock Alerts" description="Notify warehouse managers" defaultChecked={true} />
                <SettingToggle label="Approval Triggers" description="Notify when action is needed" defaultChecked={true} />
            </CardContent>
        </Card>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. INTEGRATIONS TAB CONTENT
// ════════════════════════════════════════════════════════════════════════════
function IntegrationsTabContent() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OpsLinkCard title="Email (SMTP)" desc="Transactional alerts" icon={Mail} connected={true} />
            <OpsLinkCard title="Bank Feeds" desc="Automatic reconciliation" icon={Landmark} connected={false} />
            <OpsLinkCard title="Cloud Backup" desc="Secure data archiving" icon={Database} connected={true} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. MAINTENANCE TAB CONTENT
// ════════════════════════════════════════════════════════════════════════════
function MaintenanceTabContent() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                <CardHeader><CardTitle className="text-base font-bold">System Audit Log</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { action: 'Config Updated', user: 'Admin', time: '15m ago' },
                        { action: 'Role Modified', user: 'Admin', time: '2h ago' },
                    ].map((log, i) => (
                        <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/20 text-xs font-bold text-slate-600">
                            <span>{log.action} by {log.user}</span>
                            <span className="text-muted-foreground">{log.time}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <div className="space-y-4">
                <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-xs gap-3 justify-start px-6">
                    <RefreshCcw className="h-5 w-5 text-blue-500" /> RE-INDEX DATABASE
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-xs gap-3 justify-start px-6">
                    <Database className="h-5 w-5 text-orange-500" /> EXPORT SYSTEM DATA
                </Button>
            </div>
        </div>
    );
}

// Helper UI Components
function SettingToggle({ label, description, defaultChecked }: any) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-900">{label}</Label>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={setChecked} />
        </div>
    );
}

function OpsLinkCard({ title, desc, icon: Icon, connected }: any) {
    return (
        <Card className="rounded-3xl border-border/50 group">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                        <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant={connected ? "default" : "outline"} className="rounded-full text-[10px] font-black border-none bg-emerald-50 text-emerald-600">
                        {connected ? 'ACTIVE' : 'READY'}
                    </Badge>
                </div>
                <h4 className="font-black text-slate-900">{title}</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4 font-medium">{desc}</p>
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-bold h-10">Manage</Button>
            </CardContent>
        </Card>
    );
}
