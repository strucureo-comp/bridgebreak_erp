'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
    Building2, MapPin, Globe2, Calendar, FileText, Shield,
    CheckCircle2, AlertCircle, ChevronRight, Landmark,
    Receipt, Users, GitBranch, Banknote, Settings2,
    ArrowRight, Sparkles, Clock
} from 'lucide-react';

// Company configuration data (would come from API in real implementation)
const companyData = {
    name: 'System Steel Engineering LLC',
    legalName: 'System Steel Engineering LLC',
    businessType: 'Manufacturing',
    industry: 'Steel Engineering & Structural Fabrication',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    currency: 'AED',
    taxRegime: 'VAT',
    registrationNo: 'LLC-2024-00145',
    taxId: 'TRN-100-234-567-890',
    phone: '+971 4 234 5678',
    email: 'admin@systemsteel.ae',
    website: 'www.systemsteel.ae',
    address: 'Industrial Area 4, Sharjah, UAE',
};

const branches = [
    { id: 1, name: 'Main Office (HQ)', location: 'Sharjah, UAE', type: 'Head Office', status: 'active', employees: 45 },
    { id: 2, name: 'Workshop Unit A', location: 'Ajman, UAE', type: 'Workshop', status: 'active', employees: 120 },
    { id: 3, name: 'Dubai Sales Office', location: 'Dubai, UAE', type: 'Sales', status: 'active', employees: 8 },
];

const setupChecklist = [
    { id: 'profile', label: 'Company Profile', done: true, icon: Building2 },
    { id: 'branches', label: 'Branches / Locations', done: true, icon: GitBranch },
    { id: 'fy', label: 'Financial Year', done: true, icon: Calendar },
    { id: 'coa', label: 'Chart of Accounts', done: true, icon: FileText },
    { id: 'tax', label: 'Tax Structure', done: true, icon: Receipt },
    { id: 'approval', label: 'Approval Hierarchy', done: false, icon: Shield },
];

export default function CompanyPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const completedSteps = setupChecklist.filter(s => s.done).length;
    const progress = Math.round((completedSteps / setupChecklist.length) * 100);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Company</h1>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Company profile, configuration & setup
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            Active
                        </Badge>
                    </div>
                </div>

                {/* Setup Progress Bar */}
                <Card className="border-border/50 rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold">Company Setup Progress</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {completedSteps} of {setupChecklist.length} steps completed
                                </p>
                            </div>
                            <span className="text-2xl font-bold text-primary">{progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {setupChecklist.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                                            step.done
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-amber-50 text-amber-700"
                                        )}
                                    >
                                        {step.done ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        )}
                                        <span className="truncate">{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="rounded-2xl bg-background border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                        <TabsTrigger value="profile" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                            <Building2 className="h-3.5 w-3.5" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="branches" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                            <GitBranch className="h-3.5 w-3.5" /> Branches
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                            <Calendar className="h-3.5 w-3.5" /> Financial Year
                        </TabsTrigger>
                        <TabsTrigger value="tax" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                            <Receipt className="h-3.5 w-3.5" /> Tax Structure
                        </TabsTrigger>
                        <TabsTrigger value="approval" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                            <Shield className="h-3.5 w-3.5" /> Approval Hierarchy
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Company Identity */}
                            <Card className="lg:col-span-2 rounded-3xl border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Company Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</Label>
                                            <Input defaultValue={companyData.name} className="rounded-xl h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legal Name</Label>
                                            <Input defaultValue={companyData.legalName} className="rounded-xl h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Type</Label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['Service', 'Trading', 'Manufacturing', 'Hybrid'].map(type => (
                                                    <button
                                                        key={type}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                                                            type === companyData.businessType
                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                                        )}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry</Label>
                                            <Input defaultValue={companyData.industry} className="rounded-xl h-11" />
                                        </div>
                                    </div>
                                    <div className="border-t pt-6">
                                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                            <Globe2 className="h-4 w-4 text-primary" />
                                            Regional Configuration
                                        </h4>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</Label>
                                                <Input defaultValue={companyData.country} className="rounded-xl h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</Label>
                                                <Input defaultValue={companyData.currency} className="rounded-xl h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax Regime</Label>
                                                <Input defaultValue={companyData.taxRegime} className="rounded-xl h-11" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button className="rounded-xl px-8 h-11 font-semibold">
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Info Sidebar */}
                            <div className="space-y-4">
                                <Card className="rounded-3xl border-border/50 overflow-hidden">
                                    <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                                        <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-lg font-bold">{companyData.name}</h3>
                                        <p className="text-sm text-primary-foreground/70 mt-1">{companyData.industry}</p>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        <InfoRow icon={MapPin} label="Location" value={companyData.country} />
                                        <InfoRow icon={Banknote} label="Currency" value={companyData.currency} />
                                        <InfoRow icon={Receipt} label="Tax Regime" value={companyData.taxRegime} />
                                        <InfoRow icon={FileText} label="Reg. No." value={companyData.registrationNo} />
                                        <InfoRow icon={Landmark} label="Tax ID" value={companyData.taxId} />
                                    </CardContent>
                                </Card>

                                <Card className="rounded-3xl border-border/50 bg-amber-50/50">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-900">Pending Setup</h4>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    Configure your approval hierarchy to enable workflow automation across modules.
                                                </p>
                                                <Button variant="outline" size="sm" className="mt-3 rounded-lg text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setActiveTab('approval')}>
                                                    Complete Now <ArrowRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Branches Tab */}
                    <TabsContent value="branches" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Branches & Locations</h3>
                                <p className="text-sm text-muted-foreground">{branches.length} locations configured</p>
                            </div>
                            <Button className="rounded-xl font-semibold">
                                + Add Branch
                            </Button>
                        </div>
                        <div className="grid gap-4">
                            {branches.map(branch => (
                                <Card key={branch.id} className="rounded-2xl border-border/50 hover:shadow-md transition-all duration-300 group cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{branch.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{branch.location}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="rounded-lg text-[10px] font-semibold">{branch.type}</Badge>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold">{branch.employees}</p>
                                                    <p className="text-[10px] text-muted-foreground">Employees</p>
                                                </div>
                                                <Badge className={cn(
                                                    "rounded-full text-[10px] font-semibold border-none",
                                                    branch.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                )}>
                                                    {branch.status}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Financial Year Tab */}
                    <TabsContent value="financial" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        Current Financial Year
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Period</p>
                                                <h3 className="text-2xl font-bold mt-1">FY 2025-26</h3>
                                            </div>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold rounded-lg">
                                                Active
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Start Date</p>
                                                <p className="font-bold text-sm">April 1, 2025</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">End Date</p>
                                                <p className="font-bold text-sm">March 31, 2026</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Period 11 of 12 — 92% complete</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-primary" />
                                        FY Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">FY Start Month</Label>
                                        <Input defaultValue="April" className="rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Format</Label>
                                        <Input defaultValue="DD/MM/YYYY" className="rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fiscal Period</Label>
                                        <div className="flex gap-2">
                                            {['Monthly', 'Quarterly'].map(p => (
                                                <button key={p} className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                                                    p === 'Monthly'
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                                )}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button className="rounded-xl px-8 h-11 font-semibold">
                                            Save Settings
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tax Structure Tab */}
                    <TabsContent value="tax" className="space-y-6">
                        <Card className="rounded-3xl border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-primary" />
                                    Tax Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { name: 'VAT Standard', rate: '5%', type: 'VAT', status: 'active' },
                                        { name: 'VAT Zero-Rated', rate: '0%', type: 'VAT', status: 'active' },
                                        { name: 'VAT Exempt', rate: 'Exempt', type: 'VAT', status: 'active' },
                                        { name: 'Reverse Charge', rate: '5%', type: 'VAT', status: 'active' },
                                    ].map((tax, i) => (
                                        <div key={i} className="p-4 rounded-2xl border border-border/50 hover:shadow-md transition-all group cursor-pointer">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="outline" className="rounded-lg text-[10px] font-semibold">{tax.type}</Badge>
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-semibold rounded-full">{tax.status}</Badge>
                                            </div>
                                            <h4 className="font-bold text-sm">{tax.name}</h4>
                                            <p className="text-2xl font-bold text-primary mt-1">{tax.rate}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Tax regime is based on your company&apos;s country setting.</p>
                                    <Button variant="outline" className="rounded-xl font-semibold">
                                        Manage Tax Rates
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Approval Hierarchy Tab */}
                    <TabsContent value="approval" className="space-y-6">
                        <Card className="rounded-3xl border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Approval Hierarchy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-sm text-muted-foreground">
                                    Configure who approves what. Each module can have its own approval chain based on amount thresholds.
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { module: 'Invoices', approver: 'Finance Manager', threshold: '> AED 10,000', configured: true },
                                        { module: 'Purchase Orders', approver: 'Operations Head', threshold: '> AED 5,000', configured: true },
                                        { module: 'Journal Entries', approver: 'CFO', threshold: '> AED 25,000', configured: true },
                                        { module: 'Bills', approver: 'Finance Manager', threshold: '> AED 10,000', configured: true },
                                        { module: 'Payroll', approver: 'CEO', threshold: 'All', configured: false },
                                        { module: 'Leave Requests', approver: 'Department Head', threshold: '> 3 Days', configured: false },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {item.configured ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                                )}
                                                <div>
                                                    <h4 className="text-sm font-bold">{item.module}</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.approver} — Threshold: {item.threshold}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="rounded-lg text-xs">
                                                Configure
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button className="rounded-xl px-8 h-11 font-semibold">
                                        Save Approval Rules
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase">{label}</p>
                <p className="text-sm font-semibold truncate">{value}</p>
            </div>
        </div>
    );
}
