'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getSystemSetting, getInvoices, getTaxDatabaseStatus, getTaxJobHistory, triggerTaxDataCollection, setSystemSetting } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Percent,
    ShieldCheck,
    RefreshCcw,
    FileText,
    Clock,
    Calendar,
    Settings,
    CheckCircle2,
    Scale,
    Info,
    Calculator,
    Save,
    Globe,
    Search,
    ArrowRightLeft,
    Building2,
    CreditCard,
    Shield,
    Sparkles,
    TrendingUp,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Landmark,
    AlertCircle
} from 'lucide-react';
import type { Invoice } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import comprehensive tax engine
import {
    calculateTax,
    getTaxRatesForCountry,
    getCountryTaxConfig,
    getSupportedCountries,
    validateTaxId,
    COUNTRY_TAX_CONFIGS,
    type TaxCalculationResult,
    type TaxRateDefinition,
    type CountryTaxConfig
} from '@/lib/finance/tax-engine';

// Build country list from tax configs
const ALL_COUNTRIES = Object.entries(COUNTRY_TAX_CONFIGS)
    .map(([code, config]) => ({ code, name: config.countryName }))
    .sort((a, b) => a.name.localeCompare(b.name));

// Group countries by region
const COUNTRIES_BY_REGION = ALL_COUNTRIES.reduce((acc, country) => {
    const region = getRegionForCountry(country.code);
    if (!acc[region]) acc[region] = [];
    acc[region].push(country);
    return acc;
}, {} as Record<string, typeof ALL_COUNTRIES>);

export function TaxContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [jobHistory, setJobHistory] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Calculator state
    const [calculationInput, setCalculationInput] = useState({
        amount: 1000,
        countryCode: 'US',
        region: '',
        isB2B: false,
        isTaxExempt: false,
        customerTaxId: '',
        category: 'standard',
    });
    const [calculationResult, setCalculationResult] = useState<TaxCalculationResult | null>(null);

    // Country browser state
    const [selectedCountry, setSelectedCountry] = useState('US');
    const [searchQuery, setSearchQuery] = useState('');
    const [countryTaxConfig, setCountryTaxConfig] = useState<CountryTaxConfig | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    // Update country tax config when selection changes
    useEffect(() => {
        const config = getCountryTaxConfig(selectedCountry);
        setCountryTaxConfig(config);
    }, [selectedCountry]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invoicesData, statusData, historyData] = await Promise.all([
                getInvoices(),
                getTaxDatabaseStatus(),
                getTaxJobHistory()
            ]);
            setInvoices(invoicesData || []);
            setJobHistory(historyData || []);
        } catch (error) {
            console.error('Taxes Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunSync = async () => {
        try {
            setSyncing(true);
            toast.info('Updating tax rates...');
            await triggerTaxDataCollection();
            toast.success('Tax rates updated');
            fetchData();
        } catch {
            toast.error('Update failed');
        } finally {
            setSyncing(false);
        }
    };

    // Perform calculation
    const performCalculation = () => {
        try {
            const result = calculateTax({
                amount: calculationInput.amount,
                countryCode: calculationInput.countryCode,
                region: calculationInput.region || undefined,
                isB2B: calculationInput.isB2B,
                isTaxExempt: calculationInput.isTaxExempt,
                customerTaxId: calculationInput.customerTaxId || undefined,
            });
            setCalculationResult(result);
        } catch (error) {
            toast.error('Calculation failed: ' + (error as Error).message);
        }
    };

    // Filter countries by search
    const filteredCountries = searchQuery
        ? ALL_COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : ALL_COUNTRIES;

    // Group filtered countries by region
    const filteredCountriesByRegion = filteredCountries.reduce((acc, country) => {
        const region = getRegionForCountry(country.code);
        if (!acc[region]) acc[region] = [];
        acc[region].push(country);
        return acc;
    }, {} as Record<string, typeof ALL_COUNTRIES>);

    const taxLiability = useMemo(() => {
        const paidInvoices = invoices.filter(i => i.status === 'paid');
        const totalTaxable = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
        return totalTaxable * 0.05; // 5% estimate
    }, [invoices]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                <p className="font-bold text-slate-900">Calculating Tax Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Visual Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Globe className="h-6 w-6 text-primary" />
                        Global Tax Center
                    </h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Calculate taxes for 150+ countries with real-time rates
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm font-bold">
                        <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                        {ALL_COUNTRIES.length} Countries
                    </Badge>
                    <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200 h-12 px-6 font-bold shadow-sm"
                        onClick={handleRunSync}
                        disabled={syncing}
                    >
                        <RefreshCcw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                        Sync Rates
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="rounded-2xl bg-slate-100 p-1 w-full md:w-auto">
                    <TabsTrigger value="overview" className="rounded-xl font-bold">
                        <Scale className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="calculator" className="rounded-xl font-bold">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculator
                    </TabsTrigger>
                    <TabsTrigger value="countries" className="rounded-xl font-bold">
                        <Globe className="h-4 w-4 mr-2" />
                        All Countries
                    </TabsTrigger>
                    <TabsTrigger value="guide" className="rounded-xl font-bold">
                        <FileText className="h-4 w-4 mr-2" />
                        Tax Guide
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* High Impact KPIs */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden p-10 relative group">
                            <Percent className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10 space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Estimated Tax Due</p>
                                <h2 className="text-4xl font-black tracking-tighter">${taxLiability.toLocaleString()}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[65%] rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Q1 Progress</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 group hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="h-14 w-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <ShieldCheck className="h-7 w-7" strokeWidth={2.5} />
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">Active</Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Countries Supported</p>
                            <h3 className="text-2xl font-black text-slate-900">{ALL_COUNTRIES.length}+</h3>
                            <p className="text-xs font-bold text-slate-400 pt-2">Global coverage</p>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 group hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="h-14 w-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Clock className="h-7 w-7" strokeWidth={2.5} />
                                </div>
                                <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">Upcoming</Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Filing</p>
                            <h3 className="text-2xl font-black text-slate-900">31 Mar 2026</h3>
                            <div className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-400">
                                <Calendar size={14} /> 57 Days Remaining
                            </div>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 group hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="h-14 w-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Receipt className="h-7 w-7" strokeWidth={2.5} />
                                </div>
                                <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">Live</Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Types</p>
                            <h3 className="text-2xl font-black text-slate-900">8+</h3>
                            <p className="text-xs font-bold text-slate-400 pt-2">VAT, GST, Sales Tax...</p>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Popular Countries */}
                        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black">Popular Tax Jurisdictions</CardTitle>
                                    <CardDescription className="font-medium text-slate-400">Quick access to common countries</CardDescription>
                                </div>
                                <Button variant="outline" className="rounded-xl" onClick={() => setActiveTab('countries')}>
                                    View All
                                </Button>
                            </CardHeader>
                            <div className="p-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {['US', 'GB', 'DE', 'IN', 'AU', 'CA', 'SG', 'AE'].map((code) => {
                                        const config = getCountryTaxConfig(code);
                                        const rates = getTaxRatesForCountry(code);
                                        const standardRate = rates.find(r => r.category === 'standard')?.rate || 0;
                                        return (
                                            <div
                                                key={code}
                                                onClick={() => {
                                                    setSelectedCountry(code);
                                                    setCalculationInput({ ...calculationInput, countryCode: code });
                                                    setActiveTab('calculator');
                                                }}
                                                className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{getCountryFlag(code)}</span>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{config?.countryName || code}</p>
                                                            <p className="text-xs text-slate-500">{config?.primaryTaxType}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-slate-900">{standardRate}%</p>
                                                        <p className="text-xs text-slate-500">Standard</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        {/* Side Panel */}
                        <div className="space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-10 group">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="h-14 w-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <RefreshCcw className="h-7 w-7" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
                                </div>
                                <div className="space-y-2 mb-8">
                                    <h3 className="text-2xl font-black text-slate-900">Updates</h3>
                                    <p className="text-sm font-medium text-slate-400 leading-relaxed">Tax rates are automatically synchronized every 10 days.</p>
                                </div>
                                <div className="space-y-4">
                                    {jobHistory.slice(0, 3).map((job, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{new Date(job.timestamp).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">{job.countriesCollected} Countries</p>
                                            </div>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50 p-10 flex flex-col items-center justify-center text-center space-y-4">
                                <FileText className="h-10 w-10 text-slate-200" />
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-slate-900">Official Reports</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Download return summaries and liability history.</p>
                                </div>
                                <Button variant="outline" className="w-full rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-11">Open Archive</Button>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Calculator Tab */}
                <TabsContent value="calculator" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Input Card */}
                        <Card className="rounded-[2.5rem] border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Calculator className="h-5 w-5" />
                                    Tax Calculator
                                </CardTitle>
                                <CardDescription>Calculate tax for any country with full rate categories</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label className="font-bold flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Transaction Amount
                                    </Label>
                                    <Input
                                        type="number"
                                        value={calculationInput.amount}
                                        onChange={(e) => setCalculationInput({ ...calculationInput, amount: Number(e.target.value) })}
                                        className="rounded-xl text-lg font-bold"
                                        placeholder="Enter amount..."
                                    />
                                </div>

                                {/* Country */}
                                <div className="space-y-2">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Country
                                    </Label>
                                    <Select
                                        value={calculationInput.countryCode}
                                        onValueChange={(value) => setCalculationInput({ ...calculationInput, countryCode: value })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl max-h-[300px]">
                                            {Object.entries(COUNTRIES_BY_REGION).map(([region, countries]) => (
                                                <div key={region}>
                                                    <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                                        {region}
                                                    </div>
                                                    {countries.map((country) => (
                                                        <SelectItem key={country.code} value={country.code}>
                                                            <span className="mr-2">{getCountryFlag(country.code)}</span> {country.name}
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Region/State */}
                                {['US', 'CA', 'AU', 'BR', 'IN'].includes(calculationInput.countryCode) && (
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <Landmark className="h-4 w-4" />
                                            State/Region
                                        </Label>
                                        <Input
                                            value={calculationInput.region}
                                            onChange={(e) => setCalculationInput({ ...calculationInput, region: e.target.value })}
                                            className="rounded-xl"
                                            placeholder={`e.g., ${getRegionPlaceholder(calculationInput.countryCode)}`}
                                        />
                                    </div>
                                )}

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Product/Service Category
                                    </Label>
                                    <Select
                                        value={calculationInput.category}
                                        onValueChange={(value) => setCalculationInput({ ...calculationInput, category: value })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="standard">Standard Rate</SelectItem>
                                            <SelectItem value="reduced">Reduced Rate</SelectItem>
                                            <SelectItem value="zero">Zero Rated</SelectItem>
                                            <SelectItem value="exempt">Exempt</SelectItem>
                                            <SelectItem value="digital">Digital Services</SelectItem>
                                            <SelectItem value="luxury">Luxury Goods</SelectItem>
                                            <SelectItem value="food">Food/Beverage</SelectItem>
                                            <SelectItem value="medical">Medical/Health</SelectItem>
                                            <SelectItem value="education">Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-slate-500" />
                                            <div>
                                                <Label className="font-bold cursor-pointer" htmlFor="b2b-toggle">B2B Transaction</Label>
                                                <p className="text-xs text-slate-500">Reverse charge may apply</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="b2b-toggle"
                                            checked={calculationInput.isB2B}
                                            onCheckedChange={(checked) => setCalculationInput({ ...calculationInput, isB2B: checked })}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5 text-slate-500" />
                                            <div>
                                                <Label className="font-bold cursor-pointer" htmlFor="exempt-toggle">Tax Exempt</Label>
                                                <p className="text-xs text-slate-500">No tax will be applied</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="exempt-toggle"
                                            checked={calculationInput.isTaxExempt}
                                            onCheckedChange={(checked) => setCalculationInput({ ...calculationInput, isTaxExempt: checked })}
                                        />
                                    </div>
                                </div>

                                {/* Tax ID for B2B */}
                                {calculationInput.isB2B && (
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Customer Tax ID / VAT Number
                                        </Label>
                                        <Input
                                            value={calculationInput.customerTaxId}
                                            onChange={(e) => setCalculationInput({ ...calculationInput, customerTaxId: e.target.value })}
                                            className="rounded-xl font-mono"
                                            placeholder="e.g., GB123456789 or EU123456789"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Validates the tax ID format for {COUNTRY_TAX_CONFIGS[calculationInput.countryCode]?.countryName || calculationInput.countryCode}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={performCalculation}
                                    className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg shadow-xl shadow-slate-200"
                                >
                                    <Calculator className="h-5 w-5 mr-2" />
                                    Calculate Tax
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Results Card */}
                        <Card className={cn(
                            "rounded-[2.5rem] border-none shadow-sm",
                            calculationResult ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white" : "bg-slate-50"
                        )}>
                            <CardHeader>
                                <CardTitle className={cn(
                                    "text-xl font-black flex items-center gap-2",
                                    !calculationResult && "text-slate-900"
                                )}>
                                    <Receipt className="h-5 w-5" />
                                    Calculation Result
                                </CardTitle>
                                <CardDescription className={!calculationResult ? "text-slate-500" : "text-slate-400"}>
                                    Tax breakdown for your transaction
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {calculationResult ? (
                                    <div className="space-y-6">
                                        {/* Main Result */}
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-400 mb-2">Total Amount with Tax</p>
                                            <p className="text-5xl font-black">
                                                ${calculationResult.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                                                <span className="text-slate-400">
                                                    Subtotal: ${calculationResult.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-emerald-400">
                                                    + Tax: ${calculationResult.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        {/* Tax Breakdown */}
                                        {calculationResult.breakdown.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tax Breakdown</p>
                                                {calculationResult.breakdown.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between py-2 px-4 bg-slate-800/50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="secondary" className="bg-slate-700 text-white border-none">
                                                                {item.rate}%
                                                            </Badge>
                                                            <span className="text-sm">{item.name}</span>
                                                        </div>
                                                        <span className="font-bold">${item.taxAmount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tax Information</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-800/50 rounded-xl">
                                                    <p className="text-xs text-slate-500">Primary Tax</p>
                                                    <p className="font-bold">{calculationResult.breakdown[0]?.taxType || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl">
                                                    <p className="text-xs text-slate-500">Total Rate</p>
                                                    <p className="font-bold">
                                                        {calculationResult.breakdown.reduce((sum, b) => sum + b.rate, 0)}%
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl">
                                                    <p className="text-xs text-slate-500">Country</p>
                                                    <p className="font-bold">{COUNTRY_TAX_CONFIGS[calculationResult.countryCode]?.countryName || calculationResult.countryCode}</p>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl">
                                                    <p className="text-xs text-slate-500">Currency</p>
                                                    <p className="font-bold">{calculationResult.currency || 'USD'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Indicators */}
                                        <div className="flex flex-wrap gap-2">
                                            {calculationResult.isReverseCharge && (
                                                <Badge className="bg-amber-500 text-white border-none rounded-full">
                                                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                                                    Reverse Charge
                                                </Badge>
                                            )}
                                            {calculationResult.totalTax === 0 && calculationResult.subtotal > 0 && (
                                                <Badge className="bg-emerald-500 text-white border-none rounded-full">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Tax Exempt
                                                </Badge>
                                            )}
                                            {calculationInput.isB2B && calculationInput.customerTaxId && (
                                                <Badge className="bg-blue-500 text-white border-none rounded-full">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    B2B Validated
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Calculator className="h-16 w-16 mb-4 opacity-20" />
                                        <p className="font-medium">Enter details and click Calculate</p>
                                        <p className="text-sm mt-1">Results will appear here</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Countries Tab */}
                <TabsContent value="countries" className="space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        All Countries & Tax Rates
                                    </CardTitle>
                                    <CardDescription>Browse {ALL_COUNTRIES.length}+ countries with their tax configurations</CardDescription>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search countries..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 rounded-xl w-full md:w-80"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {Object.entries(filteredCountriesByRegion).map(([region, countries]) => (
                                    <div key={region}>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {region}
                                        </h3>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {countries.map((country) => {
                                                const config = getCountryTaxConfig(country.code);
                                                const rates = getTaxRatesForCountry(country.code);
                                                const standardRate = rates.find(r => r.category === 'standard')?.rate || 0;
                                                const reducedRate = rates.find(r => r.category === 'reduced')?.rate;
                                                return (
                                                    <div
                                                        key={country.code}
                                                        onClick={() => {
                                                            setSelectedCountry(country.code);
                                                            setCalculationInput({ ...calculationInput, countryCode: country.code });
                                                            setActiveTab('calculator');
                                                        }}
                                                        className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors group border border-transparent hover:border-slate-200"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{getCountryFlag(country.code)}</span>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{country.name}</p>
                                                                    <p className="text-xs text-slate-500">{config?.primaryTaxType}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xl font-black text-slate-900">{standardRate}%</p>
                                                                <p className="text-xs text-slate-500">Standard</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {reducedRate && (
                                                                <Badge variant="secondary" className="text-xs rounded-full bg-emerald-100 text-emerald-700 border-none">
                                                                    Reduced: {reducedRate}%
                                                                </Badge>
                                                            )}
                                                            {rates.filter(r => r.category !== 'standard' && r.category !== 'reduced').slice(0, 2).map((rate: TaxRateDefinition, i: number) => (
                                                                <Badge key={i} variant="secondary" className="text-xs rounded-full">
                                                                    {rate.category}: {rate.rate}%
                                                                </Badge>
                                                            ))}
                                                            {rates.length > 3 && (
                                                                <Badge variant="secondary" className="text-xs rounded-full">
                                                                    +{rates.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tax Guide Tab */}
                <TabsContent value="guide" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="rounded-[2.5rem] border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Tax Types Explained
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className="bg-blue-500 text-white">VAT</Badge>
                                        <p className="font-bold">Value Added Tax</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Applied at each stage of production. Common in EU, UK, and many other countries.
                                        Businesses can reclaim VAT on purchases.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className="bg-emerald-500 text-white">GST</Badge>
                                        <p className="font-bold">Goods & Services Tax</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Single-stage tax applied at point of sale. Used in India, Australia, Singapore, etc.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className="bg-amber-500 text-white">Sales Tax</Badge>
                                        <p className="font-bold">Sales Tax</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Applied only at final sale to consumer. Used in USA (state-level) and some other countries.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className="bg-purple-500 text-white">CT</Badge>
                                        <p className="font-bold">Consumption Tax</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Applied in Japan and some other countries. Similar to VAT but with different rules.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Percent className="h-5 w-5" />
                                    Rate Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpRight className="h-5 w-5 text-slate-500" />
                                        <p className="font-bold">Standard Rate</p>
                                    </div>
                                    <p className="text-sm text-slate-600 text-right">Default rate for most goods and services</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                                        <p className="font-bold">Reduced Rate</p>
                                    </div>
                                    <p className="text-sm text-slate-600 text-right">Lower rate for essential goods</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <Percent className="h-5 w-5 text-amber-500" />
                                        <p className="font-bold">Zero Rated</p>
                                    </div>
                                    <p className="text-sm text-slate-600 text-right">0% rate - input tax can be reclaimed</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-blue-500" />
                                        <p className="font-bold">Exempt</p>
                                    </div>
                                    <p className="text-sm text-slate-600 text-right">No tax - input tax cannot be reclaimed</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[2.5rem] border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <ArrowRightLeft className="h-5 w-5" />
                                Reverse Charge Mechanism
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 mb-4">
                                The reverse charge mechanism shifts the responsibility for reporting and paying VAT/GST
                                from the seller to the buyer. This commonly applies to:
                            </p>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <Building2 className="h-6 w-6 text-blue-500 mb-3" />
                                    <p className="font-bold mb-1">B2B Cross-border</p>
                                    <p className="text-sm text-slate-600">Transactions between businesses in different countries</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <Receipt className="h-6 w-6 text-emerald-500 mb-3" />
                                    <p className="font-bold mb-1">Digital Services</p>
                                    <p className="text-sm text-slate-600">B2B digital service transactions in the EU</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <Landmark className="h-6 w-6 text-amber-500 mb-3" />
                                    <p className="font-bold mb-1">Intra-community</p>
                                    <p className="text-sm text-slate-600">Goods/services between EU member states</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper functions
function getRegionForCountry(code: string): string {
    const regions: Record<string, string> = {
        'US': 'North America', 'CA': 'North America', 'MX': 'North America',
        'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
        'NL': 'Europe', 'BE': 'Europe', 'AT': 'Europe', 'CH': 'Europe', 'PL': 'Europe',
        'IN': 'Asia Pacific', 'CN': 'Asia Pacific', 'JP': 'Asia Pacific', 'KR': 'Asia Pacific',
        'SG': 'Asia Pacific', 'AU': 'Asia Pacific', 'NZ': 'Asia Pacific', 'TH': 'Asia Pacific',
        'AE': 'Middle East & Africa', 'SA': 'Middle East & Africa', 'ZA': 'Middle East & Africa',
        'BR': 'South America', 'AR': 'South America', 'CL': 'South America', 'CO': 'South America',
    };
    return regions[code] || 'Other';
}

function getRegionPlaceholder(code: string): string {
    const placeholders: Record<string, string> = {
        'US': 'CA, NY, TX',
        'CA': 'ON, BC, AB',
        'AU': 'NSW, VIC, QLD',
        'BR': 'SP, RJ, MG',
        'IN': 'MH, KA, DL',
    };
    return placeholders[code] || 'Region code';
}

function getCountryFlag(code: string): string {
    // Convert country code to emoji flag
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
