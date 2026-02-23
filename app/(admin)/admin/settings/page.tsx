'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
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

import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { getSettings, saveSettings } from '@/lib/api';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant-context';

// Import Setup Components
import { BusinessModelSelector, BusinessType, CompanySize } from '@/app/(admin)/admin/settings/_components/business-model-selector';
import { ModuleSelector } from '@/app/(admin)/admin/settings/_components/module-selector';
import { DocumentBranding } from '@/app/(admin)/admin/settings/_components/document-branding';
import { TaxSystemConfig } from '@/app/(admin)/admin/settings/_components/tax-system-config';
import { RolePermissionConfig } from '@/app/(admin)/admin/settings/_components/role-permission-config';
import { FinanceEngineSettings } from '@/app/(admin)/admin/settings/_components/finance-engine-settings';

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
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to save settings');
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
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                            <p className="text-sm text-muted-foreground">Manage your company profile and system preferences</p>
                        </div>
                        <Button
                            disabled={saving}
                            onClick={handleSaveAll}
                            className="gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-muted/50 border">
                            <TabsTrigger value="company">Business Profile</TabsTrigger>
                            <TabsTrigger value="fiscal">Tax & Fiscal</TabsTrigger>
                            <TabsTrigger value="identity">Roles & Access</TabsTrigger>
                            <TabsTrigger value="branding">Branding</TabsTrigger>
                            <TabsTrigger value="alerts">Notifications</TabsTrigger>
                            <TabsTrigger value="maintenance">System</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: PROFILE / SECTOR */}
                        <TabsContent value="company" className="mt-0 space-y-8 animate-in fade-in duration-500">
                            <Card className="border-border shadow-sm rounded-xl bg-card overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                                        <div className="p-6 space-y-6 lg:col-span-2">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold">Business Model</h3>
                                                <p className="text-xs text-muted-foreground">Select your industry type and size</p>
                                            </div>
                                            <BusinessModelSelector
                                                value={{ type: company.businessType, size: company.companySize }}
                                                onChange={(v: { type: BusinessType; size: CompanySize }) => setCompany({ ...company, businessType: v.type, companySize: v.size })}
                                            />
                                        </div>
                                        <div className="p-6 bg-muted/20 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold">Enabled Modules</h3>
                                                <p className="text-xs text-muted-foreground">Toggle application features</p>
                                            </div>
                                            <ModuleSelector
                                                businessType={company.businessType}
                                                onChange={(modules: Record<string, boolean>) => setCompany({ ...company, activeModules: modules })}
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
                            <TaxSystemConfig onChange={(tc: any) => setCompany({ ...company, taxConfig: tc })} />
                        </TabsContent>

                        {/* TAB 3: ACCESS */}
                        <TabsContent value="identity" className="mt-0 animate-in fade-in duration-500">
                            <RolePermissionConfig />
                        </TabsContent>

                        {/* TAB 4: VISUALS */}
                        <TabsContent value="branding" className="mt-0 animate-in fade-in duration-500">
                            <DocumentBranding value={company.branding} onChange={(b: any) => setCompany({ ...company, branding: b })} />
                        </TabsContent>

                        {/* TAB 5: ALERTS */}
                        <TabsContent value="alerts" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>Configure how you receive system alerts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <SettingsToggle label="Email Summaries" desc="Periodic emails with business highlights" active={notifications.emailDigest} onToggle={v => setNotifications({ ...notifications, emailDigest: v })} />
                                    <SettingsToggle label="Stock Alerts" desc="Notifications when inventory falls below thresholds" active={notifications.lowStockAlerts} onToggle={v => setNotifications({ ...notifications, lowStockAlerts: v })} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 6: MAINTENANCE */}
                        <TabsContent value="maintenance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Maintenance</CardTitle>
                                    <CardDescription>Nuclear tools for system administrators</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button variant="outline" className="justify-start gap-2 h-12">
                                        <RefreshCcw className="h-4 w-4" /> Re-index Database
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2 h-12">
                                        <Database className="h-4 w-4" /> Full Backup
                                    </Button>
                                </CardContent>
                            </Card>
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
            <Label className="text-sm font-medium">{label}</Label>
            <Input value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

function SettingsToggle({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} />
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
