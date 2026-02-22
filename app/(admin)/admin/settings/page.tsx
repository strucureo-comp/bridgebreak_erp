'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    Settings, Building2, Shield, Database,
    Bell, Zap, RefreshCcw, Activity,
    Landmark, ShieldCheck,
    Save, Loader2, LayoutTemplate,
    CheckCircle2, Clock, ChevronRight,
    MapPin, Mail, Phone, CreditCard,
    Globe, FileText, AlertTriangle,
    Users, DollarSign, Fingerprint,
    Cpu, Cog, Sparkles, Smartphone,
    Lock
} from 'lucide-react';

import { ModuleGuard } from '@/components/layout/module-guard';
import { getSettings, saveSettings } from '@/lib/api';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant-context';

// Import Setup Components
import { BusinessModelSelector, BusinessType, CompanySize } from '@/components/admin/settings/business-model-selector';
import { ModuleSelector } from '@/components/admin/settings/module-selector';
import { DocumentBranding } from '@/components/admin/settings/document-branding';
import { TaxSystemConfig } from '@/components/admin/settings/tax-system-config';
import { RolePermissionConfig } from '@/components/admin/settings/role-permission-config';
import { FinanceEngineSettings } from '@/components/admin/settings/finance-engine-settings';

interface CompanyProfile {
    tradingName: string;
    legalName: string;
    baseCurrency: string;
    taxId: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    bankDetails: {
        bankName: string;
        iban: string;
        swift: string;
    };
    timezone: string;
    fiscalYearStart: string;
    businessType: BusinessType;
    companySize: CompanySize;
    activeModules: Record<string, boolean>;
    branding?: any;
    taxConfig?: any;
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { refreshTenantStatus } = useTenant();

    const [company, setCompany] = useState<CompanyProfile>({
        tradingName: 'SYSTEM STEEL ENGINEERING LLC',
        legalName: 'SYSTEM STEEL ENGINEERING LLC',
        baseCurrency: 'AED',
        taxId: '100123456789003',
        address: 'Warehouse 4, Al Quoz Industrial Area, Dubai, UAE',
        email: 'ops@systemsteel.ae',
        phone: '+971 4 123 4567',
        website: 'www.systemsteel.ae',
        bankDetails: {
            bankName: 'Emirates NBD',
            iban: 'AE000000000000000000000',
            swift: 'ENBD AE AD'
        },
        timezone: 'Asia/Dubai',
        fiscalYearStart: '1',
        businessType: 'construction',
        companySize: 'startup',
        activeModules: {
            finance: true,
            sales: true,
            operations: true,
            hr: true,
            inventory: true,
            projects: true
        }
    });

    const [notifications, setNotifications] = useState({
        invoiceReminders: true,
        lowStockAlerts: true,
        approvalTriggers: true,
        emailDigest: false,
        smsAlerts: false,
        highValueLeadAlert: true,
        dailyCashPosition: true
    });

    const fetchAllSettings = useCallback(async () => {
        try {
            setLoading(true);
            const [companyData, notifyData] = await Promise.all([
                getSettings<CompanyProfile>('company_profile'),
                getSettings<any>('notification_prefs')
            ]);

            if (companyData) setCompany(prev => ({ ...prev, ...companyData }));
            if (notifyData) setNotifications(prev => ({ ...prev, ...notifyData }));
        } catch (error) {
            console.error('Settings Sync Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllSettings();
    }, [fetchAllSettings]);

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            await Promise.all([
                saveSettings('company_profile', company),
                saveSettings('notification_prefs', notifications)
            ]);
            await refreshTenantStatus();
            toast.success('Enterprise Configuration Synchronized');
        } catch (error) {
            toast.error('Sync failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardShell requireAdmin>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Syncing System Hub</p>
            </div>
        </DashboardShell>
    );

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="settings">
                <div className="space-y-6 pb-20">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                <Settings className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
                                <p className="text-[13px] text-muted-foreground font-medium">Global orchestration and system identity</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50 text-[10px] font-bold text-emerald-700 uppercase tracking-widest mr-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Mode
                            </div>
                            <Button
                                disabled={saving}
                                onClick={handleSaveAll}
                                className="h-10 px-8 bg-foreground text-primary-foreground hover:bg-foreground/90 font-bold uppercase tracking-widest text-[11px] gap-2 rounded-lg shadow-xl shadow-primary/10"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                Commit Config
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-transparent h-auto p-0 border-b border-border w-full justify-start overflow-x-auto no-scrollbar gap-8">
                            {[
                                { val: 'company', label: 'Sector & Scope', icon: Building2 },
                                { val: 'fiscal', label: 'Fiscal Hub', icon: DollarSign },
                                { val: 'identity', label: 'Access Lab', icon: Lock },
                                { val: 'branding', label: 'Visual DNA', icon: Sparkles },
                                { val: 'alerts', label: 'Transmissions', icon: Bell },
                                { val: 'maintenance', label: 'Engine', icon: Cpu },
                            ].map(tab => (
                                <TabsTrigger
                                    key={tab.val}
                                    value={tab.val}
                                    className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-[13px] font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none gap-2"
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* TAB 1: PROFILE / SECTOR */}
                        <TabsContent value="company" className="mt-0 space-y-8 animate-in fade-in duration-500">
                            <Card className="border-border shadow-sm rounded-xl bg-card overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                                        <div className="p-8 space-y-6 lg:col-span-2">
                                            <div className="space-y-2">
                                                <h3 className="text-[15px] font-bold text-foreground uppercase tracking-widest">Business Model</h3>
                                                <p className="text-[12px] font-medium text-muted-foreground">Specify your industry and operational scale to adapt the system terminology.</p>
                                            </div>
                                            <BusinessModelSelector
                                                value={{ type: company.businessType, size: company.companySize }}
                                                onChange={(v) => setCompany({ ...company, businessType: v.type, companySize: v.size })}
                                            />
                                        </div>
                                        <div className="p-8 bg-muted/30 space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="text-[15px] font-bold text-foreground uppercase tracking-widest">Module Access</h3>
                                                <p className="text-[12px] font-medium text-muted-foreground">Activate or suspend Enterprise modules.</p>
                                            </div>
                                            <ModuleSelector
                                                businessType={company.businessType}
                                                onChange={(modules) => setCompany({ ...company, activeModules: modules })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm rounded-xl bg-card">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-[15px] font-bold text-foreground uppercase tracking-widest">Legal Identity</CardTitle>
                                    <CardDescription className="text-[12px] font-medium text-muted-foreground">Official business details used for tax-compliant documentation.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 space-y-8">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <DetailInput label="Legal Entity Name" value={company.legalName} onChange={v => setCompany({ ...company, legalName: v })} />
                                        <DetailInput label="Tax ID / TRN" value={company.taxId} onChange={v => setCompany({ ...company, taxId: v })} />
                                        <DetailInput label="Corporate Email" value={company.email} onChange={v => setCompany({ ...company, email: v })} />
                                        <DetailInput label="Primary Contact" value={company.phone} onChange={v => setCompany({ ...company, phone: v })} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Business Address</Label>
                                            <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className="h-11 rounded-lg border-border font-medium text-[13px] bg-muted/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Official Website</Label>
                                            <Input value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} className="h-11 rounded-lg border-border font-medium text-[13px] bg-muted/50" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: FISCAL */}
                        <TabsContent value="fiscal" className="mt-0 animate-in fade-in duration-500">
                            <TaxSystemConfig onChange={(tc) => setCompany({ ...company, taxConfig: tc })} />
                        </TabsContent>

                        {/* TAB 3: ACCESS */}
                        <TabsContent value="identity" className="mt-0 animate-in fade-in duration-500">
                            <RolePermissionConfig />
                        </TabsContent>

                        {/* TAB 4: VISUALS */}
                        <TabsContent value="branding" className="mt-0 animate-in fade-in duration-500">
                            <DocumentBranding value={company.branding} onChange={(b) => setCompany({ ...company, branding: b })} />
                        </TabsContent>

                        {/* TAB 5: ALERTS */}
                        <TabsContent value="alerts" className="mt-0 animate-in fade-in duration-500 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 border-border shadow-sm rounded-xl bg-card overflow-hidden">
                                    <CardHeader className="border-b border-border bg-muted/30 py-4">
                                        <CardTitle className="text-[14px] font-bold text-foreground uppercase tracking-widest flex items-center gap-3">
                                            <Bell className="h-4 w-4 text-primary" strokeWidth={2.5} /> System Notifications
                                        </CardTitle>
                                    </CardHeader>
                                    <div className="divide-y divide-border">
                                        <SettingsToggle label="Fiscal Pulse" desc="Daily summary of cashflow and revenue velocity" active={notifications.emailDigest} onToggle={v => setNotifications({ ...notifications, emailDigest: v })} />
                                        <SettingsToggle label="Strategic Alert" desc="Real-time notification for deals > AED 50k" active={notifications.highValueLeadAlert} onToggle={v => setNotifications({ ...notifications, highValueLeadAlert: v })} />
                                        <SettingsToggle label="Stock Thresholds" desc="Replenishment alerts for critical material inventory" active={notifications.lowStockAlerts} onToggle={v => setNotifications({ ...notifications, lowStockAlerts: v })} />
                                        <SettingsToggle label="Approval Chain" desc="Notify stakeholders of pending authorization requests" active={notifications.approvalTriggers} onToggle={v => setNotifications({ ...notifications, approvalTriggers: v })} />
                                    </div>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-none bg-foreground text-card-foreground rounded-xl p-8 flex flex-col justify-between h-full relative overflow-hidden group shadow-2xl shadow-foreground/5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
                                        <div className="space-y-6 relative z-10">
                                            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Zap size={20} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold uppercase tracking-[0.1em]">Automation Lab</h3>
                                                <p className="text-[12px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                                                    Configure enterprise-grade webhooks and smart triggers for external system integration.
                                                </p>
                                            </div>
                                        </div>
                                        <Button className="w-full bg-card text-foreground hover:bg-accent h-10 font-bold uppercase text-[11px] tracking-widest mt-8 rounded-lg">
                                            Manage Endpoints
                                        </Button>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 6: ENGINE */}
                        <TabsContent value="maintenance" className="mt-0 animate-in fade-in duration-500 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 border-border shadow-sm rounded-xl bg-card overflow-hidden">
                                    <CardHeader className="border-b border-border bg-muted/30 py-4">
                                        <CardTitle className="text-[14px] font-bold text-foreground uppercase tracking-widest flex items-center gap-3">
                                            <Activity className="h-4 w-4 text-primary" strokeWidth={2.5} /> System Telemetry
                                        </CardTitle>
                                    </CardHeader>
                                    <div className="divide-y divide-border">
                                        {[
                                            { action: 'Config Synchronized', user: 'SYS-ADMIN', time: '2m ago', icon: ShieldCheck, status: 'VERIFIED' },
                                            { action: 'Identity Update', user: 'SYS-ADMIN', time: '1h ago', icon: Users, status: 'VERIFIED' },
                                            { action: 'Fiscal Commitment', user: 'FIN-BOT', time: '4h ago', icon: DollarSign, status: 'VERIFIED' },
                                            { action: 'Kernel Re-index', user: 'ENGINE', time: '12h ago', icon: Cpu, status: 'VERIFIED' },
                                        ].map((log, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 hover:bg-accent hover:text-accent-foreground transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <log.icon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-foreground uppercase tracking-tight">{log.action}</p>
                                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tighter">{log.user} · {log.time}</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-sm shadow-sm">{log.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="space-y-4">
                                    <SystemActionTile label="Engine Re-Index" icon={RefreshCcw} desc="Optimizes query performance" />
                                    <SystemActionTile label="Vault Backup" icon={Database} desc="Full binary database extraction" />
                                    <SystemActionTile label="Flush Cache" icon={Zap} desc="Clear transient memory buffers" />
                                    <SystemActionTile label="Registry Audit" icon={FileText} desc="Verify master data integrity" />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell>
    );
}

function DetailInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
            <Input value={value} onChange={e => onChange(e.target.value)} className="h-11 rounded-lg border-border font-medium text-[13px] bg-muted/50 focus:bg-background transition-all" />
        </div>
    );
}

function SettingsToggle({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-6 hover:bg-accent hover:text-accent-foreground transition-colors">
            <div className="space-y-1">
                <p className="text-[13px] font-bold text-foreground uppercase tracking-tight">{label}</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{desc}</p>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} className="scale-90" />
        </div>
    );
}

function SystemActionTile({ label, icon: Icon, desc }: { label: string; icon: any; desc: string }) {
    return (
        <button className="w-full flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:border-primary/50 group transition-all shadow-sm hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className="text-[13px] font-bold text-foreground uppercase tracking-tight">{label}</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tighter">{desc}</p>
                </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/60 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
        </button>
    );
}
