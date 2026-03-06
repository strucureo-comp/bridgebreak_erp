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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
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
import { RolePermissionConfig, RolesConfigData } from '@/app/(admin)/admin/settings/_components/role-permission-config';
import { AccountsReceivableConfig, ARConfigData } from '@/app/(admin)/admin/settings/_components/ar-config';
import { AccountsPayableConfig, APConfigData } from '@/app/(admin)/admin/settings/_components/ap-config';
import { FinanceEngineSettings, FinanceEngineConfig } from '@/app/(admin)/admin/settings/_components/finance-engine-settings';
import { InventoryConfig, InventoryConfigData } from '@/app/(admin)/admin/settings/_components/inventory-config';
import { ConsolidationConfig, ConsolidationConfigData } from '@/app/(admin)/admin/settings/_components/consolidation-config';

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
    filingReminders: true,
    // Enterprise fields required by TaxConfigData
    jurisdictions: [
        { id: 1, country: 'United Arab Emirates', code: 'AE', regNumber: '', system: 'vat', reportingPeriod: 'quarterly', filingMethod: 'fta', authority: 'Federal Tax Authority', status: 'active' },
    ],
    taxCodes: [
        { id: 1, code: 'VAT5_OUTPUT', description: 'Standard Output VAT', jurisdiction: 'AE', type: 'output', rate: '5', glPayable: '2200', glReceivable: '', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
        { id: 2, code: 'VAT5_INPUT', description: 'Standard Input VAT', jurisdiction: 'AE', type: 'input', rate: '5', glPayable: '', glReceivable: '1400', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
        { id: 3, code: 'VAT_RC_IMPORT', description: 'Reverse Charge (Import)', jurisdiction: 'AE', type: 'reverse_charge', rate: '5', glPayable: '2200', glReceivable: '1400', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: true },
        { id: 4, code: 'VAT_ZERO', description: 'Zero-Rated Export', jurisdiction: 'AE', type: 'zero_rated', rate: '0', glPayable: '', glReceivable: '', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
        { id: 5, code: 'VAT_EXEMPT', description: 'Exempt Supply', jurisdiction: 'AE', type: 'exempt', rate: '0', glPayable: '', glReceivable: '', recoverablePct: '0', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
    ],
    taxLockAfterFiling: true,
    periodVatFreeze: true,
    adjustmentOnlyMode: true,
};

const DEFAULT_AR_CONFIG: ARConfigData = {
    defaultCreditTerms: 'Net 30',
    creditLimitEnforcement: 'hard',
    agingBuckets: [
        { label: 'Current', days: 0 },
        { label: '1-30 Days', days: 30 },
        { label: '31-60 Days', days: 60 },
        { label: '61-90 Days', days: 90 },
        { label: '90+ Days', days: 91 },
    ],
    riskThresholds: { low: 5, medium: 15, high: 30 },
    automations: { autoDunning: true, autoECLProvisioning: true, autoChargeLateFees: false },
    glMapping: { receivableAccount: '1200', revenueAccount: '4000', badDebtAccount: '6500', taxAccount: '2200' }
};

const DEFAULT_AP_CONFIG: APConfigData = {
    defaultPaymentTerms: 'Net 30',
    procurementMatching: '3-way',
    agingBuckets: [
        { label: 'Current', days: 0 },
        { label: '1-30 Days', days: 30 },
        { label: '31-60 Days', days: 60 },
        { label: '61-90 Days', days: 90 },
        { label: '90+ Days', days: 91 },
    ],
    autoPostBills: false,
    paymentThresholds: { requireApprovalAbove: 10000, highPriorityDays: 5 },
    automations: { autoSchedulePayments: true, documentCapture: true, vatReconciliation: true },
    glMapping: { payableAccount: '2100', expenseAccount: '6000', taxAccount: '1400', discountAccount: '4100' }
};

const DEFAULT_FINANCE_ENGINE: FinanceEngineConfig = {
    accountingBasis: 'accrual',
    fiscalYearStart: '1',
    reportingCurrency: 'AED',
    multiCurrencyEnabled: true,
    autoJournalPosting: false,
    toleranceLevel: 0.5,
    backdatingRestricted: true,
    periodLocking: {
        currentPeriod: '1',
        isLocked: false
    },
    integrationState: {
        inventoryCOGS: true,
        taxAutoProvision: true,
        amortizationAuto: false
    }
};

const DEFAULT_INVENTORY_CONFIG: InventoryConfigData = {
    valuationMethod: 'FIFO',
    negativeStockAllowed: false,
    backdatedTxnsLocked: true,
    periodEndLock: true,
    cogsTrigger: 'SalesInvoice',
    multiWarehouseCogs: true,
    projectBasedAccounting: false,
    autoRecalculateWac: true,
    glMapping: {
        inventoryAsset: '1300',
        cogsAccount: '5000',
        inventoryAdjustment: '5100',
        revaluationSurplus: '3100'
    },
    standardCosts: {}
};

const DEFAULT_CONSOLIDATION_CONFIG: ConsolidationConfigData = {
    entities: [
        { id: '1', code: 'SSE-UAE', name: 'SYSTEM STEEL UAE (HQ)', currency: 'AED', functionalCurrency: 'AED', country: 'UAE', taxJurisdiction: 'DUBAI', ownershipPercentage: 100, method: 'full' },
        { id: '2', code: 'SSE-UK', name: 'SYSTEM STEEL UK LTD', currency: 'GBP', functionalCurrency: 'GBP', country: 'United Kingdom', taxJurisdiction: 'HMRC', ownershipPercentage: 100, method: 'full' },
        { id: '3', code: 'SSE-US', name: 'SYSTEM STEEL INC', currency: 'USD', functionalCurrency: 'USD', country: 'USA', taxJurisdiction: 'Delaware', ownershipPercentage: 100, method: 'full' },
    ],
    eliminationRules: {
        autoEliminateIC: true,
        profitElimination: true,
        threshold: 50
    },
    glMapping: {
        icClearingAccount: '2900',
        fxTranslationGain: '7100',
        fxTranslationLoss: '8100',
        minorityInterest: '3200'
    },
    consolidationFrequency: 'monthly'
};

const DEFAULT_ROLES_CONFIG = {
    roles: [
        { id: 1, name: 'Strategic Lead (CFO)', users: 1, level: 'Full (Superuser)' },
        { id: 2, name: 'Group Controller', users: 2, level: 'Advanced Control' },
        { id: 3, name: 'Module Administrator', users: 4, level: 'Module Governance' },
        { id: 4, name: 'Execution Handler', users: 12, level: 'Process & Entry' },
    ],
    users: [
        { id: 1, name: 'Ahmed Khalid', email: 'cfo@systemsteel.ae', role: 'Strategic Lead (CFO)', status: 'Active' as const },
        { id: 2, name: 'Sarah Connor', email: 'controller@systemsteel.ae', role: 'Group Controller', status: 'Active' as const },
        { id: 3, name: 'John Doe', email: 'inventory.lead@systemsteel.ae', role: 'Module Administrator', status: 'Active' as const },
        { id: 4, name: 'Maria Garcia', email: 'clerk@systemsteel.ae', role: 'Execution Handler', status: 'Active' as const },
    ],
    workflows: [
        {
            id: 1,
            title: 'GL Journal Approval (High Value)',
            status: 'Active',
            stages: 2,
            threshold: '> AED 50,000',
            flow: [
                { role: 'Group Controller', action: 'VERIFY' },
                { role: 'Strategic Lead (CFO)', action: 'AUTHORIZE' }
            ]
        },
        {
            id: 2,
            title: 'Inventory Revaluation Workflow',
            status: 'Active',
            stages: 2,
            threshold: 'Materiality > 5%',
            flow: [
                { role: 'Module Administrator', action: 'REVIEW' },
                { role: 'Group Controller', action: 'APPROVE' }
            ]
        },
        {
            id: 3,
            title: 'Consolidation Run Stage-Gate',
            status: 'Active',
            stages: 3,
            threshold: 'Global Period Close',
            flow: [
                { role: 'Execution Handler', action: 'SYNC' },
                { role: 'Group Controller', action: 'POST-ELIMINATION' },
                { role: 'Strategic Lead (CFO)', action: 'FINAL-LOCK' }
            ]
        }
    ],
    globalSettings: {
        autoEscalation: true,
        parallelApprovals: true,
        mobileSignoff: true
    },
    intelligence: {
        credentialScanActive: true,
        geoFencingEnabled: true,
        policyEnforcementActive: true,
        sessionRotationMinutes: 15
    }
} as RolesConfigData;

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
    const [arConfig, setArConfig] = useState<ARConfigData>(DEFAULT_AR_CONFIG);
    const [apConfig, setApConfig] = useState<APConfigData>(DEFAULT_AP_CONFIG);
    const [financeEngine, setFinanceEngine] = useState<FinanceEngineConfig>(DEFAULT_FINANCE_ENGINE);
    const [inventoryConfig, setInventoryConfig] = useState<InventoryConfigData>(DEFAULT_INVENTORY_CONFIG);
    const [consolidationConfig, setConsolidationConfig] = useState<ConsolidationConfigData>(DEFAULT_CONSOLIDATION_CONFIG);
    const [rolesConfig, setRolesConfig] = useState<RolesConfigData>(DEFAULT_ROLES_CONFIG);
    const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING);

    // Load ALL settings from backend/localStorage
    const fetchAllSettings = useCallback(async () => {
        try {
            setLoading(true);
            const [companyData, notifyData, taxData, arData, apData, financeData, inventoryData, consolidationData, rolesData, brandingData] = await Promise.all([
                getSettings<CompanyProfile>('company_profile'),
                getSettings<any>('notification_prefs'),
                getSettings<any>('tax_config'),
                getSettings<ARConfigData>('ar_config'),
                getSettings<APConfigData>('ap_config'),
                getSettings<FinanceEngineConfig>('finance_engine'),
                getSettings<InventoryConfigData>('inventory_config'),
                getSettings<ConsolidationConfigData>('consolidation_config'),
                getSettings<any>('roles_config'),
                getSettings<any>('branding_config'),
            ]);

            if (companyData) setCompany((prev: CompanyProfile) => ({ ...prev, ...companyData }));
            if (notifyData) setNotifications((prev: any) => ({ ...prev, ...notifyData }));
            if (taxData) setTaxConfig((prev: any) => ({ ...prev, ...taxData }));
            if (arData) setArConfig((prev: ARConfigData) => ({ ...prev, ...arData }));
            if (apData) setApConfig((prev: APConfigData) => ({ ...prev, ...apData }));
            if (financeData) setFinanceEngine((prev: FinanceEngineConfig) => ({ ...prev, ...financeData }));
            if (inventoryData) setInventoryConfig((prev: InventoryConfigData) => ({ ...prev, ...inventoryData }));
            if (consolidationData) setConsolidationConfig((prev: ConsolidationConfigData) => ({ ...prev, ...consolidationData }));
            if (rolesData) setRolesConfig((prev: any) => ({ ...prev, ...rolesData }));
            if (brandingData) setBrandingConfig((prev: any) => ({ ...prev, ...brandingData }));
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
                saveSettings('ar_config', arConfig),
                saveSettings('ap_config', apConfig),
                saveSettings('finance_engine', financeEngine),
                saveSettings('inventory_config', inventoryConfig),
                saveSettings('consolidation_config', consolidationConfig),
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
                    <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                <Settings className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">System Architecture</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Enterprise OS Configuration</span>
                                    <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                                        V 2.0.4
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Button
                            disabled={saving}
                            onClick={handleSaveAll}
                            className="h-10 px-6 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Commit Changes
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 max-w-full">
                        <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                            <TabsList className="bg-muted/50 border w-max inline-flex justify-start">
                                <TabsTrigger value="company">Business Profile</TabsTrigger>
                                <TabsTrigger value="architecture">Finance Architecture</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory Accounting</TabsTrigger>
                                <TabsTrigger value="consolidation">Consolidation Hub</TabsTrigger>
                                <TabsTrigger value="fiscal">Tax & Compliance</TabsTrigger>
                                <TabsTrigger value="ar">Receivables & Credit</TabsTrigger>
                                <TabsTrigger value="ap">Payables & Procurement</TabsTrigger>
                                <TabsTrigger value="identity">Roles & Access</TabsTrigger>
                                <TabsTrigger value="branding">Branding</TabsTrigger>
                            </TabsList>
                        </div>

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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-border shadow-md rounded-xl bg-card overflow-hidden">
                                    <CardHeader className="bg-muted/10 border-b py-6 px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center text-white shadow-sm">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Legal Identity Hub</CardTitle>
                                                <CardDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Corporate credentials & jurisdictional mapping</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <DetailInput label="Legal Entity Name" value={company.legalName} onChange={v => setCompany({ ...company, legalName: v })} />
                                            <DetailInput label="Tax ID / TRN" value={company.taxId} onChange={v => setCompany({ ...company, taxId: v })} />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <DetailInput label="Corporate Email" value={company.email} onChange={v => setCompany({ ...company, email: v })} />
                                            <DetailInput label="Primary Contact" value={company.phone} onChange={v => setCompany({ ...company, phone: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Business HQ Address</Label>
                                            <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase tracking-tight bg-slate-50/50 focus:bg-white transition-colors" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border shadow-md rounded-xl bg-card overflow-hidden">
                                    <CardHeader className="bg-muted/10 border-b py-6 px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center text-white shadow-sm">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Regional & Currency Core</CardTitle>
                                                <CardDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Global operational parameters</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Base reporting Currency</Label>
                                                <Select
                                                    value={company.baseCurrency}
                                                    onValueChange={v => {
                                                        setCompany({ ...company, baseCurrency: v });
                                                        setFinanceEngine({ ...financeEngine, reportingCurrency: v });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-11 font-bold text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Fiscal Start Month</Label>
                                                <Select
                                                    value={company.fiscalYearStart}
                                                    onValueChange={v => {
                                                        setCompany({ ...company, fiscalYearStart: v });
                                                        setFinanceEngine({ ...financeEngine, fiscalYearStart: v });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-11 font-bold text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">January</SelectItem>
                                                        <SelectItem value="4">April</SelectItem>
                                                        <SelectItem value="7">July</SelectItem>
                                                        <SelectItem value="10">October</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Corporate Digital Identity (URL)</Label>
                                            <Input value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} className="h-11 rounded-lg border-slate-100 font-bold text-xs lowercase bg-slate-50/50 focus:bg-white transition-colors" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 1.5: FINANCE ENGINE */}
                        <TabsContent value="architecture" className="mt-0 animate-in fade-in duration-500">
                            <FinanceEngineSettings
                                value={financeEngine}
                                onChange={(fe: FinanceEngineConfig) => {
                                    setFinanceEngine(fe);
                                    // Sync back to company profile if important bits change
                                    if (fe.reportingCurrency !== company.baseCurrency || fe.fiscalYearStart !== company.fiscalYearStart) {
                                        setCompany({
                                            ...company,
                                            baseCurrency: fe.reportingCurrency,
                                            fiscalYearStart: fe.fiscalYearStart
                                        });
                                    }
                                }}
                            />
                        </TabsContent>

                        {/* TAB 1.8: CONSOLIDATION HUB */}
                        <TabsContent value="consolidation" className="mt-0 animate-in fade-in duration-500">
                            <ConsolidationConfig
                                value={consolidationConfig}
                                onChange={(cc: ConsolidationConfigData) => setConsolidationConfig(cc)}
                            />
                        </TabsContent>

                        {/* TAB 1.7: INVENTORY ACCOUNTING */}
                        <TabsContent value="inventory" className="mt-0 animate-in fade-in duration-500">
                            <InventoryConfig
                                value={inventoryConfig}
                                onChange={(ic: InventoryConfigData) => setInventoryConfig(ic)}
                            />
                        </TabsContent>

                        {/* TAB 2: FISCAL — receives saved data, reports changes */}
                        <TabsContent value="fiscal" className="mt-0 animate-in fade-in duration-500">
                            <TaxSystemConfig
                                value={taxConfig}
                                onChange={(tc: any) => setTaxConfig(tc)}
                            />
                        </TabsContent>

                        {/* TAB AR: RECEIVABLES */}
                        <TabsContent value="ar" className="mt-0 animate-in fade-in duration-500">
                            <AccountsReceivableConfig
                                value={arConfig}
                                onChange={(ac: ARConfigData) => setArConfig(ac)}
                            />
                        </TabsContent>

                        {/* TAB AP: PAYABLES */}
                        <TabsContent value="ap" className="mt-0 animate-in fade-in duration-500">
                            <AccountsPayableConfig
                                value={apConfig}
                                onChange={(apc: APConfigData) => setApConfig(apc)}
                            />
                        </TabsContent>

                        {/* TAB 3: ACCESS — receives saved data, reports changes */}
                        <TabsContent value="identity" className="mt-0 animate-in fade-in duration-500">
                            <RolePermissionConfig
                                value={rolesConfig}
                                onChange={(rc: RolesConfigData) => setRolesConfig(rc)}
                            />
                        </TabsContent>

                        {/* TAB 4: VISUALS — receives saved data, reports changes */}
                        <TabsContent value="branding" className="mt-0 animate-in fade-in duration-500">
                            <DocumentBranding
                                value={brandingConfig}
                                onChange={(b: any) => setBrandingConfig(b)}
                            />
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
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</Label>
            <Input value={value} onChange={e => onChange(e.target.value)} className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase tracking-tight bg-slate-50/50 focus:bg-white transition-colors" />
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
