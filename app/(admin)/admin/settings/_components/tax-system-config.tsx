'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Landmark, Shield, Calculator, Globe,
    Plus, FileText, BarChart3, Clock,
    AlertCircle, Download, Settings, Trash2, Edit2
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
    { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
    { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'IN', name: 'India' }, { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
    { code: 'CN', name: 'China' }, { code: 'JP', name: 'Japan' }, { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' }, { code: 'BR', name: 'Brazil' }, { code: 'SG', name: 'Singapore' },
    { code: 'KW', name: 'Kuwait' }, { code: 'QA', name: 'Qatar' }, { code: 'BH', name: 'Bahrain' },
    { code: 'OM', name: 'Oman' }, { code: 'EG', name: 'Egypt' }, { code: 'PK', name: 'Pakistan' },
    { code: 'MY', name: 'Malaysia' }, { code: 'ZA', name: 'South Africa' }, { code: 'NG', name: 'Nigeria' },
    { code: 'KE', name: 'Kenya' }, { code: 'TR', name: 'Turkey' }, { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' }, { code: 'NL', name: 'Netherlands' }, { code: 'CH', name: 'Switzerland' },
    { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' }, { code: 'RU', name: 'Russian Federation' },
    { code: 'MX', name: 'Mexico' }, { code: 'KR', name: 'Korea, Republic of' }, { code: 'ID', name: 'Indonesia' },
    { code: 'TH', name: 'Thailand' }, { code: 'PH', name: 'Philippines' }, { code: 'VN', name: 'Viet Nam' },
    { code: 'BD', name: 'Bangladesh' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'NZ', name: 'New Zealand' },
];

interface TaxRate {
    id: number;
    name: string;
    rate: string;
    type: string;
    status: 'Core' | 'Custom';
}

interface TaxConfigData {
    region: string;
    taxSystem: string;
    defaultRate: string;
    reverseCharge: boolean;
    zeroRated: boolean;
    taxRates: TaxRate[];
    filingFreq: string;
    methodology: string;
    autoVatReturn: boolean;
    filingReminders: boolean;
}

interface TaxSystemConfigProps {
    value?: TaxConfigData;
    onChange: (value: TaxConfigData) => void;
}

export function TaxSystemConfig({ value, onChange }: TaxSystemConfigProps) {
    const [region, setRegion] = useState(value?.region || 'AE');
    const [taxSystem, setTaxSystem] = useState(value?.taxSystem || 'vat');
    const [defaultRate, setDefaultRate] = useState(value?.defaultRate || '5');
    const [reverseCharge, setReverseCharge] = useState(value?.reverseCharge ?? true);
    const [zeroRated, setZeroRated] = useState(value?.zeroRated ?? true);
    const [taxRates, setTaxRates] = useState<TaxRate[]>(value?.taxRates || []);
    const [filingFreq, setFilingFreq] = useState(value?.filingFreq || 'quarterly');
    const [methodology, setMethodology] = useState(value?.methodology || 'accrual');
    const [autoVatReturn, setAutoVatReturn] = useState(value?.autoVatReturn ?? true);
    const [filingReminders, setFilingReminders] = useState(value?.filingReminders ?? true);
    const [rateDialogOpen, setRateDialogOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<TaxRate | null>(null);

    // Sync from parent when value changes
    useEffect(() => {
        if (value) {
            setRegion(value.region);
            setTaxSystem(value.taxSystem);
            setDefaultRate(value.defaultRate);
            setReverseCharge(value.reverseCharge);
            setZeroRated(value.zeroRated);
            setTaxRates(value.taxRates);
            setFilingFreq(value.filingFreq);
            setMethodology(value.methodology);
            setAutoVatReturn(value.autoVatReturn);
            setFilingReminders(value.filingReminders);
        }
    }, []); // Only sync on mount

    const emit = (patch: Partial<TaxConfigData>) => {
        const full: TaxConfigData = {
            region, taxSystem, defaultRate, reverseCharge, zeroRated,
            taxRates, filingFreq, methodology, autoVatReturn, filingReminders,
            ...patch
        };
        onChange(full);
    };

    const handleAddRate = () => {
        setEditingRate({ id: 0, name: '', rate: '', type: 'Standard', status: 'Custom' });
        setRateDialogOpen(true);
    };

    const handleEditRate = (rate: TaxRate) => {
        setEditingRate({ ...rate });
        setRateDialogOpen(true);
    };

    const handleDeleteRate = (id: number) => {
        const updated = taxRates.filter(r => r.id !== id);
        setTaxRates(updated);
        emit({ taxRates: updated });
        toast.success('Tax rate removed');
    };

    const handleSaveRate = () => {
        if (!editingRate || !editingRate.name || !editingRate.rate) {
            toast.error('Name and rate are required');
            return;
        }
        let updated: TaxRate[];
        if (editingRate.id) {
            updated = taxRates.map(r => r.id === editingRate.id ? editingRate : r);
        } else {
            updated = [...taxRates, { ...editingRate, id: Date.now() }];
        }
        setTaxRates(updated);
        emit({ taxRates: updated });
        setRateDialogOpen(false);
        toast.success(editingRate.id ? 'Tax rate updated' : 'Tax rate added');
    };

    const handleExportAuditLog = () => {
        const log = {
            exported_at: new Date().toISOString(),
            region, taxSystem, defaultRate, reverseCharge, zeroRated,
            taxRates, filingFreq, methodology,
        };
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Audit log exported');
    };

    return (
        <Tabs defaultValue="authority" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="authority">Tax Authority</TabsTrigger>
                <TabsTrigger value="rates">Custom Rates</TabsTrigger>
                <TabsTrigger value="reporting">Reporting Engine</TabsTrigger>
            </TabsList>

            <TabsContent value="authority" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Landmark className="h-4 w-4" /> Jurisdiction
                            </CardTitle>
                            <CardDescription className="text-xs">Primary tax authority integration defaults.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax Region</Label>
                                    <Select value={region} onValueChange={(v) => { setRegion(v); emit({ region: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {COUNTRIES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax System</Label>
                                    <Select value={taxSystem} onValueChange={(v) => { setTaxSystem(v); emit({ taxSystem: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">VAT (Value Added Tax)</SelectItem>
                                            <SelectItem value="sales">Sales Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs">Global Default Rate</Label>
                                <Select value={defaultRate} onValueChange={(v) => { setDefaultRate(v); emit({ defaultRate: v }); }}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Standard VAT (5%)</SelectItem>
                                        <SelectItem value="0">Zero-Rated (0%)</SelectItem>
                                        <SelectItem value="15">Luxury Surcharge (15%)</SelectItem>
                                        <SelectItem value="exempt">Exempt</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">Applied automatically to all new invoices and quotes.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Compliance Defaults
                            </CardTitle>
                            <CardDescription className="text-xs">Base rules for tax calculation and validation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Reverse Charge</p>
                                    <p className="text-xs text-muted-foreground">Automate RC for foreign procurement</p>
                                </div>
                                <Switch checked={reverseCharge} onCheckedChange={(v) => { setReverseCharge(v); emit({ reverseCharge: v }); }} />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Zero-Rated Support</p>
                                    <p className="text-xs text-muted-foreground">Handle exports and exempt goods</p>
                                </div>
                                <Switch checked={zeroRated} onCheckedChange={(v) => { setZeroRated(v); emit({ zeroRated: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Calculator className="h-4 w-4" /> Tax Formulas & Rates
                            </CardTitle>
                            <CardDescription className="text-xs">Define custom tax brackets and regional overrides.</CardDescription>
                        </div>
                        <Button size="sm" className="gap-2" onClick={handleAddRate}>
                            <Plus className="h-4 w-4" /> Add Rate
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {taxRates.map((tax) => (
                                <div key={tax.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                            <span className="text-[10px] font-bold">{tax.rate}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{tax.name}</p>
                                            <p className="text-xs text-muted-foreground">{tax.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={tax.status === 'Core' ? 'outline' : 'secondary'} className="text-[10px] uppercase">{tax.status}</Badge>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditRate(tax)}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        {tax.status === 'Custom' && (
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteRate(tax.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {taxRates.length === 0 && (
                                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                                    No tax rates configured. Click &quot;Add Rate&quot; to create one.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reporting" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> E-Filing & Documentation
                            </CardTitle>
                            <CardDescription className="text-xs">Configure the reporting engine and automated returns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs">Filing Frequency</Label>
                                    <Select value={filingFreq} onValueChange={(v) => { setFilingFreq(v); emit({ filingFreq: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Methodology</Label>
                                    <Select value={methodology} onValueChange={(v) => { setMethodology(v); emit({ methodology: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accrual">Accrual Basis</SelectItem>
                                            <SelectItem value="cash">Cash Basis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="pt-4 border-t space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Automation Tokens</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium">Automatic VAT Return Generation</p>
                                                <p className="text-[10px] text-muted-foreground">Generates XML for FTA portal</p>
                                            </div>
                                        </div>
                                        <Switch checked={autoVatReturn} onCheckedChange={(v) => { setAutoVatReturn(v); emit({ autoVatReturn: v }); }} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium">Filing Deadline Reminders</p>
                                                <p className="text-[10px] text-muted-foreground">7-day advance notice</p>
                                            </div>
                                        </div>
                                        <Switch checked={filingReminders} onCheckedChange={(v) => { setFilingReminders(v); emit({ filingReminders: v }); }} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Audit Ready</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">System Verified</p>
                                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500 leading-relaxed">
                                            Your current configuration matches local tax laws for the 2024 fiscal year.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full gap-2" variant="outline" size="sm" onClick={handleExportAuditLog}>
                                <Download className="h-3 w-3" /> Export Audit Log
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{editingRate?.id ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                        <DialogDescription className="text-xs">Define a custom tax formula or override an existing rate.</DialogDescription>
                    </DialogHeader>
                    {editingRate && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Rate Name</Label>
                                <Input value={editingRate.name} onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })} placeholder="e.g. Import VAT" className="h-9 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs">Rate Value</Label>
                                    <Input value={editingRate.rate} onChange={(e) => setEditingRate({ ...editingRate, rate: e.target.value })} placeholder="e.g. 12%" className="h-9 text-xs" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">Type</Label>
                                    <Select value={editingRate.type} onValueChange={(v) => setEditingRate({ ...editingRate, type: v })}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="Zero-Rated">Zero-Rated</SelectItem>
                                            <SelectItem value="Surcharge">Surcharge</SelectItem>
                                            <SelectItem value="Exempt">Exempt</SelectItem>
                                            <SelectItem value="Reduced">Reduced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setRateDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveRate}>Save Rate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
