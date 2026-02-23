'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
    getInvoices, 
    getTaxDatabaseStatus, 
    getTaxJobHistory, 
    triggerTaxDataCollection 
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Globe,
    Search,
    Calculator,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Landmark,
    AlertCircle,
    Building2,
    Shield,
    ChevronRight,
    ChevronDown,
    Activity,
    CheckCircle2
} from 'lucide-react';
import type { Invoice } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UAEVATReturnView } from './uae-vat-return-view';

// Import comprehensive tax engine
type TaxCalculationResult = {
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    currency?: string;
    countryCode: string;
    isReverseCharge: boolean;
    breakdown: { rate: number; name: string; taxAmount: number }[];
    lineItems?: any[];
};
type TaxRateDefinition = { id: string; code: string; name: string; rate: number; type: string; countryCode: string; region?: string; category: string; description?: string; isCompound: boolean };
type CountryTaxConfig = { countryCode: string; countryName: string; currency: string; primaryTaxType: string; taxTypes: string[]; isFederalSystem: boolean; hasReverseCharge: boolean; registrationThreshold?: number; digitalServicesThreshold?: number };

export function TaxContent() {
    const { user } = useAuth();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [jobHistory, setJobHistory] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const [calculationInput, setCalculationInput] = useState({
        amount: 1000,
        countryCode: 'AE',
        region: '',
        isB2B: false,
        isTaxExempt: false,
        customerTaxId: '',
        category: 'standard',
    });
    const [calculationResult, setCalculationResult] = useState<any | null>(null);
    const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
    const [strategicConfigs, setStrategicConfigs] = useState<Record<string, { config: CountryTaxConfig | null; rates: TaxRateDefinition[] }>>({});
    const [ratesByCode, setRatesByCode] = useState<Record<string, number>>({});

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invoicesData, historyData] = await Promise.all([
                getInvoices(),
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

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${apiBase}/finance/tax/calculate`, { credentials: 'include' });
                const data = await res.json();
                if (data?.countries) {
                    setCountries(data.countries.map((c: any) => ({ code: c.code, name: c.name })));
                }
                const codes = ['AE', 'SA', 'GB', 'US'];
                const results: Record<string, { config: CountryTaxConfig | null; rates: TaxRateDefinition[] }> = {};
                await Promise.all(codes.map(async (code) => {
                    const r = await fetch(`${apiBase}/finance/tax/calculate?countryCode=${code}`, { credentials: 'include' });
                    const d = await r.json();
                    results[code] = { config: d?.config || null, rates: d?.rates || [] };
                }));
                setStrategicConfigs(results);
            } catch {}
        })();
    }, []);

    useEffect(() => {
        const loadRates = async () => {
            const filtered = countries.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const entries: Record<string, number> = {};
            await Promise.all(filtered.map(async (c) => {
                const r = await fetch(`${apiBase}/finance/tax/calculate?countryCode=${c.code}`, { credentials: 'include' });
                const d = await r.json();
                const std = (d?.rates || []).find((rr: any) => rr.category === 'standard')?.rate || 0;
                entries[c.code] = std;
            }));
            setRatesByCode(entries);
        };
        if (countries.length > 0) loadRates();
    }, [countries, searchQuery]);

    const performCalculation = async () => {
        try {
            const res = await fetch(`${apiBase}/finance/tax/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: calculationInput.amount,
                    countryCode: calculationInput.countryCode,
                    region: calculationInput.region || undefined,
                    isB2B: calculationInput.isB2B,
                    isTaxExempt: calculationInput.isTaxExempt,
                    customerTaxId: calculationInput.customerTaxId || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Calculation failed');
            setCalculationResult(data);
        } catch (error) {
            toast.error('Calculation failed: ' + (error as Error).message);
        }
    };

    const taxLiability = useMemo(() => {
        const paidInvoices = invoices.filter(i => i.status === 'paid');
        const totalTaxable = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
        return totalTaxable * 0.05; // 5% estimate for UAE
    }, [invoices]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-foreground">Synchronizing Tax Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Tax Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">Compliance, VAT returns and global tax rate monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={handleRunSync}
                        disabled={syncing}
                    >
                        <RefreshCcw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                        Hard Sync
                    </Button>
                    <Button size="sm" className="h-9 bg-primary hover:bg-primary/90">
                        Export Report
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 border h-10 p-0.5">
                    <TabsTrigger value="overview" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                    <TabsTrigger value="uae-return" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">FTA Form 201</TabsTrigger>
                    <TabsTrigger value="calculator" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Calculator</TabsTrigger>
                    <TabsTrigger value="countries" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Jurisdictions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="VAT Payable"
                            value={`AED ${taxLiability.toLocaleString()}`}
                            description="Estimated for current period"
                            trend="+4.2%"
                            trendUp={false}
                        />
                        <MetricCard
                            title="Countries Supported"
                            value={countries.length.toString()}
                            description="Global jurisdictions"
                            trend="Live"
                            trendUp={true}
                        />
                        <MetricCard
                            title="Compliance Status"
                            value="Compliant"
                            description="Last audit 2 days ago"
                            trend="Secure"
                            trendUp={true}
                        />
                        <MetricCard
                            title="Next Filing"
                            value="Mar 31"
                            description="57 Days remaining"
                            trend="Upcoming"
                            trendUp={true}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border shadow-sm">
                            <CardHeader className="border-b bg-muted/50">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Strategic Jurisdictions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                        {['AE', 'SA', 'GB', 'US'].map((code) => {
                                            const cfg = strategicConfigs[code];
                                            const standardRate = (cfg?.rates || []).find(r => r.category === 'standard')?.rate || 0;
                                        return (
                                            <div
                                                key={code}
                                                className="flex items-center justify-between p-4 border-b last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setCalculationInput({ ...calculationInput, countryCode: code });
                                                    setActiveTab('calculator');
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl h-8 w-8 flex items-center justify-center bg-muted rounded-md">{getCountryFlag(code)}</div>
                                                    <div>
                                                            <p className="text-sm font-bold text-foreground">{cfg?.config?.countryName || code}</p>
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">{cfg?.config?.primaryTaxType}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-primary">{standardRate}%</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Standard</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm bg-foreground text-card-foreground">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">System Logs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {jobHistory.slice(0, 4).map((job, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
                                        <div>
                                            <p className="text-xs font-bold">{new Date(job.timestamp).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">{job.countriesCollected} Jurisdictions Sync</p>
                                        </div>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* UAE Return Tab */}
                <TabsContent value="uae-return" className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-primary text-card-foreground flex items-center justify-center">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">FTA UAE VAT Return (Form 201)</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">Official reporting format for Federal Tax Authority</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input type="date" className="h-8 w-36 text-xs font-bold" defaultValue="2026-01-01" />
                                <span className="text-muted-foreground">to</span>
                                <Input type="date" className="h-8 w-36 text-xs font-bold" defaultValue="2026-03-31" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <UAEVATReturnView 
                                trn="100123456789003" 
                                fromDate="2026-01-01"
                                toDate="2026-03-31"
                                invoices={invoices}
                                bills={[]}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Calculator Tab */}
                <TabsContent value="calculator" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b bg-muted/50">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Engine Inputs</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</Label>
                                        <Select
                                            value={calculationInput.countryCode}
                                            onValueChange={(v) => setCalculationInput({ ...calculationInput, countryCode: v })}
                                        >
                                            <SelectTrigger className="h-10 rounded-md border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countries.map(c => (
                                                    <SelectItem key={c.code} value={c.code}>{getCountryFlag(c.code)} {c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (AED/USD)</Label>
                                        <Input
                                            type="number"
                                            value={calculationInput.amount}
                                            onChange={(e) => setCalculationInput({ ...calculationInput, amount: Number(e.target.value) })}
                                            className="h-10 rounded-md border-border font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tax Category</Label>
                                    <Select
                                        value={calculationInput.category}
                                        onValueChange={(v) => setCalculationInput({ ...calculationInput, category: v })}
                                    >
                                        <SelectTrigger className="h-10 rounded-md border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard Rate</SelectItem>
                                            <SelectItem value="reduced">Reduced Rate</SelectItem>
                                            <SelectItem value="zero">Zero Rated</SelectItem>
                                            <SelectItem value="exempt">Exempt</SelectItem>
                                            <SelectItem value="digital">Digital Services</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-4 bg-muted border border-border rounded-md space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-bold text-foreground">B2B Transaction</Label>
                                            <p className="text-[10px] text-muted-foreground">Enable reverse charge logic</p>
                                        </div>
                                        <Switch
                                            checked={calculationInput.isB2B}
                                            onCheckedChange={(v) => setCalculationInput({ ...calculationInput, isB2B: v })}
                                        />
                                    </div>
                                    <Separator className="bg-zinc-200" />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-bold text-foreground">Tax Exempt</Label>
                                            <p className="text-[10px] text-muted-foreground">Apply exemption rules</p>
                                        </div>
                                        <Switch
                                            checked={calculationInput.isTaxExempt}
                                            onCheckedChange={(v) => setCalculationInput({ ...calculationInput, isTaxExempt: v })}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-11 bg-primary hover:bg-primary/90 rounded-md font-bold uppercase tracking-widest text-xs"
                                    onClick={performCalculation}
                                >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate Liability
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className={cn(
                            "border-border shadow-sm",
                            calculationResult ? "bg-foreground text-card-foreground" : "bg-muted/50"
                        )}>
                            <CardHeader className="border-b border-zinc-800">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Engine Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8">
                                {calculationResult ? (
                                    <div className="space-y-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Tax Inclusive</p>
                                            <h3 className="text-5xl font-black tracking-tighter">
                                                {calculationResult.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </h3>
                                            <div className="flex items-center justify-center gap-4 mt-6">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Subtotal</p>
                                                    <p className="text-sm font-bold">{calculationResult.subtotal.toLocaleString()}</p>
                                                </div>
                                                <div className="w-px h-8 bg-primary/90" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-primary uppercase">Tax Applied</p>
                                                    <p className="text-sm font-bold text-primary">+{calculationResult.totalTax.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Breakdown</p>
                                            {calculationResult.breakdown.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-muted-foreground">{item.rate}%</Badge>
                                                        <span className="text-xs font-bold">{item.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black">+{item.taxAmount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                                        <Calculator className="h-10 w-10 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">Engine idle. Provide inputs to begin.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Jurisdictions Tab */}
                <TabsContent value="countries" className="space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b bg-muted/50 flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-sm font-bold">Global Jurisdictions</CardTitle>
                                <p className="text-xs text-muted-foreground">Monitor rates for {countries.length} countries</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-8 w-64 text-xs rounded-md"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                {countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => {
                                    const std = ratesByCode[c.code] ?? 0;
                                    return (
                                        <div key={c.code} className="p-4 border-b border-r last:border-r-0 hover:bg-accent hover:text-accent-foreground transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getCountryFlag(c.code)}</span>
                                                    <span className="text-xs font-bold text-foreground truncate w-24">{c.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary">{std}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MetricCard({ title, value, description, trend, trendUp }: any) {
    return (
        <Card className="border-border shadow-sm hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                    trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                    {trend}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold tracking-tight text-foreground">{value}</div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{description}</p>
            </CardContent>
        </Card>
    );
}

function HealthIndicator({ label, percent }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                <span className="text-xs font-bold text-foreground">{percent}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

function getCountryFlag(code: string): string {
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
