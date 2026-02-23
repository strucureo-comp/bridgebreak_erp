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
import { broadcastCurrencyChange } from '@/lib/hooks/use-currency';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant-context';

// Import Setup Components
import { BusinessModelSelector, BusinessType, CompanySize } from '@/app/(admin)/admin/settings/_components/business-model-selector';
import { ModuleSelector } from '@/app/(admin)/admin/settings/_components/module-selector';
import { DocumentBranding } from '@/app/(admin)/admin/settings/_components/document-branding';
import { TaxSystemConfig } from '@/app/(admin)/admin/settings/_components/tax-system-config';
import { RolePermissionConfig } from '@/app/(admin)/admin/settings/_components/role-permission-config';

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
}

// Defaults
const DEFAULT_COMPANY: CompanyProfile = {
    tradingName: 'SYSTEM STEEL ENGINEERING LLC',
    legalName: 'SYSTEM STEEL ENGINEERING LLC',
    baseCurrency: 'AED',
    taxId: '100123456789003',
    address: 'Warehouse 4, Al Quoz Industrial Area, Dubai, UAE',
    email: 'ops@systemsteel.ae',
    phone: '+971 4 123 4567',
    website: 'www.systemsteel.ae',
    bankDetails: { bankName: 'Emirates NBD', iban: 'AE000000000000000000000', swift: 'ENBD AE AD' },
    timezone: 'Asia/Dubai',
    fiscalYearStart: '1',
    businessType: 'construction',
    companySize: 'startup',
    activeModules: { finance: true, sales: true, operations: true, hr: true, inventory: true, projects: true, purchases: true, manufacturing: true, reports: true, compliance: true }
};

const DEFAULT_NOTIFICATIONS = {
    invoiceReminders: true,
    lowStockAlerts: true,
    approvalTriggers: true,
    emailDigest: false,
    smsAlerts: false,
    highValueLeadAlert: true,
    dailyCashPosition: true
};

const DEFAULT_TAX_CONFIG = {
    region: 'AE',
    taxSystem: 'vat',
    defaultRate: '5',
    reverseCharge: true,
    zeroRated: true,
    taxRates: [
        { id: 1, name: 'Standard VAT', rate: '5%', type: 'Standard', status: 'Core' as const },
        { id: 2, name: 'Export Rate', rate: '0%', type: 'Zero-Rated', status: 'Core' as const },
        { id: 3, name: 'Luxury Surcharge', rate: '15%', type: 'Surcharge', status: 'Custom' as const },
        { id: 4, name: 'Exempt Services', rate: '0%', type: 'Exempt', status: 'Core' as const },
    ],
    filingFreq: 'quarterly',
    methodology: 'accrual',
    autoVatReturn: true,
    filingReminders: true
};

const DEFAULT_ROLES_CONFIG = {
    roles: [
        { id: 1, name: 'Administrator', users: 2, level: 'Full' },
        { id: 2, name: 'Finance Manager', users: 3, level: 'Audit & Approve' },
        { id: 3, name: 'Operations Lead', users: 5, level: 'Execution' },
        { id: 4, name: 'Sales Representative', users: 8, level: 'CRM Access' },
    ],
    users: [
        { id: 1, name: 'Ahmed Khalid', email: 'ahmed@systemsteel.ae', role: 'Administrator', status: 'Active' as const },
        { id: 2, name: 'Sarah Connor', email: 'sarah@systemsteel.ae', role: 'Finance Manager', status: 'Active' as const },
        { id: 3, name: 'John Doe', email: 'john@systemsteel.ae', role: 'Operations Lead', status: 'On Leave' as const },
        { id: 4, name: 'Maria Garcia', email: 'maria@systemsteel.ae', role: 'Sales Representative', status: 'Active' as const },
    ],
    workflows: [
        {
            id: 1, title: 'Payroll & Salary Increases', status: 'Active', stages: 3, threshold: 'All',
            flow: [
                { role: 'HR Manager', action: 'Initiate Request' },
                { role: 'MD / Admin', action: 'Strategic Approval' },
                { role: 'Finance Team', action: 'Disbursement & Post' }
            ]
        },
        {
            id: 2, title: 'Purchase Orders', status: 'Active', stages: 3, threshold: 'AED 10,000',
            flow: [
                { role: 'Dept Head', action: 'Review' },
                { role: 'Procurement', action: 'Verify' },
                { role: 'MD / Admin', action: 'Authorize' }
            ]
        }
    ],
    globalSettings: { autoEscalation: false, parallelApprovals: true, mobileSignoff: true }
};

const DEFAULT_BRANDING = {
    primaryColor: '#0F172A',
    accentColor: '#10B981',
    logo: null
};

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { refreshTenantStatus } = useTenant();

    // All settings state
    const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
    const [taxConfig, setTaxConfig] = useState(DEFAULT_TAX_CONFIG);
    const [rolesConfig, setRolesConfig] = useState(DEFAULT_ROLES_CONFIG);
    const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING);

    // Load ALL settings from backend/localStorage
    const fetchAllSettings = useCallback(async () => {
        try {
            setLoading(true);
            const [companyData, notifyData, taxData, rolesData, brandingData] = await Promise.all([
                getSettings<CompanyProfile>('company_profile'),
                getSettings<any>('notification_prefs'),
                getSettings<any>('tax_config'),
                getSettings<any>('roles_config'),
                getSettings<any>('branding_config'),
            ]);

            if (companyData) setCompany(prev => ({ ...prev, ...companyData }));
            if (notifyData) setNotifications(prev => ({ ...prev, ...notifyData }));
            if (taxData) setTaxConfig(prev => ({ ...prev, ...taxData }));
            if (rolesData) setRolesConfig(prev => ({ ...prev, ...rolesData }));
            if (brandingData) setBrandingConfig(prev => ({ ...prev, ...brandingData }));
        } catch (error) {
            console.error('Settings Sync Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllSettings();
    }, [fetchAllSettings]);

    // Save ALL settings to backend/localStorage
    const handleSaveAll = async () => {
        try {
            setSaving(true);
            await Promise.all([
                saveSettings('company_profile', company),
                saveSettings('notification_prefs', notifications),
                saveSettings('tax_config', taxConfig),
                saveSettings('roles_config', rolesConfig),
                saveSettings('branding_config', brandingConfig),
            ]);
            await refreshTenantStatus();
            // Broadcast currency change to all finance components
            broadcastCurrencyChange(company.baseCurrency);
            toast.success('All settings saved successfully');
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
                            <TabsTrigger value="alerts" disabled className="gap-1.5 opacity-50 cursor-not-allowed">Notifications <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 font-black border-border">SOON</Badge></TabsTrigger>
                            <TabsTrigger value="maintenance" disabled className="gap-1.5 opacity-50 cursor-not-allowed">System <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 font-black border-border">SOON</Badge></TabsTrigger>
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
                                                activeModules={company.activeModules}
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

                        {/* TAB 2: FISCAL — receives saved data, reports changes */}
                        <TabsContent value="fiscal" className="mt-0 animate-in fade-in duration-500">
                            <TaxSystemConfig
                                value={taxConfig}
                                onChange={(tc: any) => setTaxConfig(tc)}
                            />
                        </TabsContent>

                        {/* TAB 3: ACCESS — receives saved data, reports changes */}
                        <TabsContent value="identity" className="mt-0 animate-in fade-in duration-500">
                            <RolePermissionConfig
                                value={rolesConfig}
                                onChange={(rc: any) => setRolesConfig(rc)}
                            />
                        </TabsContent>

                        {/* TAB 4: VISUALS — receives saved data, reports changes */}
                        <TabsContent value="branding" className="mt-0 animate-in fade-in duration-500">
                            <DocumentBranding
                                value={brandingConfig}
                                onChange={(b: any) => setBrandingConfig(b)}
                            />
                        </TabsContent>

                        {/* TAB 5: ALERTS */}
                        <TabsContent value="alerts" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>Configure how you receive system alerts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <SettingsToggle label="Invoice Reminders" desc="Send reminders for overdue invoices" active={notifications.invoiceReminders} onToggle={v => setNotifications({ ...notifications, invoiceReminders: v })} />
                                    <SettingsToggle label="Low Stock Alerts" desc="Notifications when inventory falls below thresholds" active={notifications.lowStockAlerts} onToggle={v => setNotifications({ ...notifications, lowStockAlerts: v })} />
                                    <SettingsToggle label="Approval Triggers" desc="Notify when an item is pending your approval" active={notifications.approvalTriggers} onToggle={v => setNotifications({ ...notifications, approvalTriggers: v })} />
                                    <SettingsToggle label="Email Summaries" desc="Periodic emails with business highlights" active={notifications.emailDigest} onToggle={v => setNotifications({ ...notifications, emailDigest: v })} />
                                    <SettingsToggle label="SMS Alerts" desc="Critical notifications via SMS" active={notifications.smsAlerts} onToggle={v => setNotifications({ ...notifications, smsAlerts: v })} />
                                    <SettingsToggle label="High Value Lead Alert" desc="Instant ping for high-value opportunity changes" active={notifications.highValueLeadAlert} onToggle={v => setNotifications({ ...notifications, highValueLeadAlert: v })} />
                                    <SettingsToggle label="Daily Cash Position" desc="End-of-day financial summary" active={notifications.dailyCashPosition} onToggle={v => setNotifications({ ...notifications, dailyCashPosition: v })} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 6: MAINTENANCE */}
                        <TabsContent value="maintenance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Maintenance</CardTitle>
                                    <CardDescription>Administrative tools for system operations</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <MaintenanceAction
                                        icon={RefreshCcw}
                                        label="Re-index Database"
                                        desc="Rebuild search indexes and optimize queries"
                                        successMsg="Database re-indexed successfully"
                                    />
                                    <MaintenanceAction
                                        icon={Database}
                                        label="Full Backup"
                                        desc="Create a complete system snapshot"
                                        successMsg="Backup created successfully"
                                    />
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

function MaintenanceAction({ icon: Icon, label, desc, successMsg }: { icon: any; label: string; desc: string; successMsg: string }) {
    const [running, setRunning] = useState(false);

    const handleClick = async () => {
        setRunning(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setRunning(false);
        toast.success(successMsg);
    };

    return (
        <Button
            variant="outline"
            className="justify-start gap-3 h-14 px-4"
            disabled={running}
            onClick={handleClick}
        >
            {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Icon className="h-4 w-4" />
            )}
            <div className="text-left">
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-muted-foreground font-normal">{desc}</p>
            </div>
        </Button>
    );
}
