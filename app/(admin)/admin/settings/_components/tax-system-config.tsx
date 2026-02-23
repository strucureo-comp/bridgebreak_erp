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
    Landmark, Shield, Calculator, Globe, Scale,
    Plus, FileText, Lock, BookOpen,
    AlertCircle, Download, Trash2, Edit2, Loader2, Zap, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// ── Types ──────────────────────────────────────────────────────────────────────
interface Jurisdiction {
    id: number; country: string; code: string; regNumber: string;
    system: string; reportingPeriod: string; filingMethod: string; authority: string; status: string;
}

interface TaxCodeDef {
    id: number; code: string; description: string; jurisdiction: string;
    type: string; rate: string; glPayable: string; glReceivable: string;
    recoverablePct: string; effectiveDate: string; expiryDate: string; autoSelfAccount: boolean;
}

export interface TaxConfigData {
    region: string; taxSystem: string; defaultRate: string;
    reverseCharge: boolean; zeroRated: boolean;
    filingFreq: string; methodology: string;
    autoVatReturn: boolean; filingReminders: boolean;
    // Enterprise additions
    jurisdictions: Jurisdiction[];
    taxCodes: TaxCodeDef[];
    taxLockAfterFiling: boolean;
    periodVatFreeze: boolean;
    adjustmentOnlyMode: boolean;
    taxRates: any[];   // keep backward compat
}

interface TaxSystemConfigProps {
    value?: TaxConfigData;
    onChange: (value: TaxConfigData) => void;
}

// Default jurisdictions & codes
const DEFAULT_JURISDICTIONS: Jurisdiction[] = [
    { id: 1, country: 'United Arab Emirates', code: 'AE', regNumber: '', system: 'vat', reportingPeriod: 'quarterly', filingMethod: 'fta', authority: 'Federal Tax Authority', status: 'active' },
];
const DEFAULT_TAX_CODES: TaxCodeDef[] = [
    { id: 1, code: 'VAT5_OUTPUT', description: 'Standard Output VAT', jurisdiction: 'AE', type: 'output', rate: '5', glPayable: '2200', glReceivable: '', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
    { id: 2, code: 'VAT5_INPUT', description: 'Standard Input VAT', jurisdiction: 'AE', type: 'input', rate: '5', glPayable: '', glReceivable: '1400', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
    { id: 3, code: 'VAT_RC_IMPORT', description: 'Reverse Charge (Import)', jurisdiction: 'AE', type: 'reverse_charge', rate: '5', glPayable: '2200', glReceivable: '1400', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: true },
    { id: 4, code: 'VAT_ZERO', description: 'Zero-Rated Export', jurisdiction: 'AE', type: 'zero_rated', rate: '0', glPayable: '', glReceivable: '', recoverablePct: '100', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
    { id: 5, code: 'VAT_EXEMPT', description: 'Exempt Supply', jurisdiction: 'AE', type: 'exempt', rate: '0', glPayable: '', glReceivable: '', recoverablePct: '0', effectiveDate: '2018-01-01', expiryDate: '', autoSelfAccount: false },
];

export function TaxSystemConfig({ value, onChange }: TaxSystemConfigProps) {
    const [region, setRegion] = useState(value?.region || 'AE');
    const [taxSystem, setTaxSystem] = useState(value?.taxSystem || 'vat');
    const [defaultRate, setDefaultRate] = useState(value?.defaultRate || '5');
    const [reverseCharge, setReverseCharge] = useState(value?.reverseCharge ?? true);
    const [zeroRated, setZeroRated] = useState(value?.zeroRated ?? true);
    const [filingFreq, setFilingFreq] = useState(value?.filingFreq || 'quarterly');
    const [methodology, setMethodology] = useState(value?.methodology || 'accrual');
    const [autoVatReturn, setAutoVatReturn] = useState(value?.autoVatReturn ?? true);
    const [filingReminders, setFilingReminders] = useState(value?.filingReminders ?? true);
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(value?.jurisdictions || DEFAULT_JURISDICTIONS);
    const [taxCodes, setTaxCodes] = useState<TaxCodeDef[]>(value?.taxCodes || DEFAULT_TAX_CODES);
    const [taxLockAfterFiling, setTaxLockAfterFiling] = useState(value?.taxLockAfterFiling ?? true);
    const [periodVatFreeze, setPeriodVatFreeze] = useState(value?.periodVatFreeze ?? true);
    const [adjustmentOnlyMode, setAdjustmentOnlyMode] = useState(value?.adjustmentOnlyMode ?? true);

    // Dialog state
    const [jurDialogOpen, setJurDialogOpen] = useState(false);
    const [codeDialogOpen, setCodeDialogOpen] = useState(false);
    const [editingJur, setEditingJur] = useState<Jurisdiction | null>(null);
    const [editingCode, setEditingCode] = useState<TaxCodeDef | null>(null);

    useEffect(() => {
        if (value) {
            setRegion(value.region);
            setTaxSystem(value.taxSystem);
            setDefaultRate(value.defaultRate);
            setReverseCharge(value.reverseCharge);
            setZeroRated(value.zeroRated);
            setFilingFreq(value.filingFreq);
            setMethodology(value.methodology);
            setAutoVatReturn(value.autoVatReturn);
            setFilingReminders(value.filingReminders);
            if (value.jurisdictions) setJurisdictions(value.jurisdictions);
            if (value.taxCodes) setTaxCodes(value.taxCodes);
            if (value.taxLockAfterFiling !== undefined) setTaxLockAfterFiling(value.taxLockAfterFiling);
            if (value.periodVatFreeze !== undefined) setPeriodVatFreeze(value.periodVatFreeze);
            if (value.adjustmentOnlyMode !== undefined) setAdjustmentOnlyMode(value.adjustmentOnlyMode);
        }
    }, []);

    const emit = (patch: Partial<TaxConfigData>) => {
        const full: TaxConfigData = {
            region, taxSystem, defaultRate, reverseCharge, zeroRated,
            filingFreq, methodology, autoVatReturn, filingReminders,
            jurisdictions, taxCodes, taxLockAfterFiling, periodVatFreeze, adjustmentOnlyMode,
            taxRates: [],
            ...patch,
        };
        onChange(full);
    };

    // ── Jurisdiction CRUD ──
    const handleAddJur = () => {
        setEditingJur({ id: 0, country: '', code: '', regNumber: '', system: 'vat', reportingPeriod: 'quarterly', filingMethod: '', authority: '', status: 'active' });
        setJurDialogOpen(true);
    };
    const handleSaveJur = () => {
        if (!editingJur || !editingJur.code) { toast.error('Country code is required'); return; }
        let updated: Jurisdiction[];
        if (editingJur.id) {
            updated = jurisdictions.map(j => j.id === editingJur.id ? editingJur : j);
        } else {
            updated = [...jurisdictions, { ...editingJur, id: Date.now() }];
        }
        setJurisdictions(updated);
        emit({ jurisdictions: updated });
        setJurDialogOpen(false);
        toast.success(editingJur.id ? 'Jurisdiction updated' : 'Jurisdiction added');
    };
    const handleDeleteJur = (id: number) => {
        const updated = jurisdictions.filter(j => j.id !== id);
        setJurisdictions(updated);
        emit({ jurisdictions: updated });
        toast.success('Jurisdiction removed');
    };

    // ── Tax Code CRUD ──
    const handleAddCode = () => {
        setEditingCode({ id: 0, code: '', description: '', jurisdiction: region, type: 'output', rate: '', glPayable: '', glReceivable: '', recoverablePct: '100', effectiveDate: new Date().toISOString().slice(0, 10), expiryDate: '', autoSelfAccount: false });
        setCodeDialogOpen(true);
    };
    const handleSaveCode = () => {
        if (!editingCode || !editingCode.code || !editingCode.rate) { toast.error('Code and rate are required'); return; }
        let updated: TaxCodeDef[];
        if (editingCode.id) {
            updated = taxCodes.map(c => c.id === editingCode.id ? editingCode : c);
        } else {
            updated = [...taxCodes, { ...editingCode, id: Date.now() }];
        }
        setTaxCodes(updated);
        emit({ taxCodes: updated });
        setCodeDialogOpen(false);
        toast.success(editingCode.id ? 'Tax code updated' : 'Tax code added');
    };
    const handleDeleteCode = (id: number) => {
        const updated = taxCodes.filter(c => c.id !== id);
        setTaxCodes(updated);
        emit({ taxCodes: updated });
        toast.success('Tax code removed');
    };

    return (
        <Tabs defaultValue="jurisdictions" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
                <TabsTrigger value="codes">Tax Codes</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="filing">Filing & Controls</TabsTrigger>
            </TabsList>

            {/* ── JURISDICTIONS ── */}
            <TabsContent value="jurisdictions" className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm font-bold">Tax Jurisdictions</p><p className="text-[11px] text-muted-foreground">Register each country where you have a tax obligation</p></div>
                    <Button size="sm" className="gap-2" onClick={handleAddJur}><Plus className="h-3.5 w-3.5" /> Add Jurisdiction</Button>
                </div>
                {jurisdictions.map(j => (
                    <Card key={j.id} className="border-border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-red-600" />
                                    <h3 className="text-sm font-bold">{j.country || COUNTRIES.find(c => c.code === j.code)?.name || j.code}</h3>
                                    <Badge variant="default" className="text-[8px] h-4 px-1 bg-red-600">{j.system.toUpperCase()}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingJur({ ...j }); setJurDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteJur(j.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                                <div><span className="text-muted-foreground">Registration</span><p className="font-mono font-medium mt-0.5">{j.regNumber || '—'}</p></div>
                                <div><span className="text-muted-foreground">Reporting</span><p className="font-medium mt-0.5 capitalize">{j.reportingPeriod}</p></div>
                                <div><span className="text-muted-foreground">Filing</span><p className="font-medium mt-0.5">{j.filingMethod || '—'}</p></div>
                                <div><span className="text-muted-foreground">Authority</span><p className="font-medium mt-0.5">{j.authority || '—'}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>

            {/* ── TAX CODES ── */}
            <TabsContent value="codes" className="space-y-6">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm font-bold">Tax Codes with GL Mapping</p><p className="text-[11px] text-muted-foreground">Each code maps to GL accounts with effective date versioning</p></div>
                    <Button size="sm" className="gap-2" onClick={handleAddCode}><Plus className="h-3.5 w-3.5" /> Add Tax Code</Button>
                </div>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="col-span-2">Code</span><span className="col-span-1">Type</span><span className="col-span-1 text-right">Rate%</span>
                                <span className="col-span-2">GL Payable</span><span className="col-span-2">GL Receivable</span>
                                <span className="col-span-1 text-right">Recov%</span><span className="col-span-1">From</span><span className="col-span-2 text-right">Actions</span>
                            </div>
                            {taxCodes.map(tc => (
                                <div key={tc.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm group">
                                    <div className="col-span-2">
                                        <p className="font-mono text-[10px] text-red-600 font-bold">{tc.code}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{tc.description}</p>
                                    </div>
                                    <span className="col-span-1"><TaxTypeBadge type={tc.type} /></span>
                                    <span className="col-span-1 text-right text-xs font-bold">{tc.rate}%</span>
                                    <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{tc.glPayable || '—'}</span>
                                    <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{tc.glReceivable || '—'}</span>
                                    <span className={cn("col-span-1 text-right text-xs font-bold", Number(tc.recoverablePct) < 100 && "text-amber-600")}>{tc.recoverablePct}%</span>
                                    <span className="col-span-1 text-[10px] text-muted-foreground">{tc.effectiveDate.slice(0, 7)}</span>
                                    <span className="col-span-2 text-right flex items-center justify-end gap-1">
                                        {tc.autoSelfAccount && <Badge variant="outline" className="text-[7px] h-3.5 px-1 border-violet-300 text-violet-600">RC</Badge>}
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => { setEditingCode({ ...tc }); setCodeDialogOpen(true); }}><Edit2 className="h-2.5 w-2.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteCode(tc.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── COMPLIANCE ── */}
            <TabsContent value="compliance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4" /> Primary Jurisdiction</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax Region</Label>
                                    <Select value={region} onValueChange={v => { setRegion(v); emit({ region: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax System</Label>
                                    <Select value={taxSystem} onValueChange={v => { setTaxSystem(v); emit({ taxSystem: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">VAT</SelectItem>
                                            <SelectItem value="sales">Sales Tax</SelectItem>
                                            <SelectItem value="gst">GST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Standard Rate (%)</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={defaultRate} onChange={e => { setDefaultRate(e.target.value); emit({ defaultRate: e.target.value }); }} className="h-9 w-24 text-sm" />
                                    <span className="text-xs text-muted-foreground">%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Compliance Defaults</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div><p className="text-sm font-medium">Reverse Charge</p><p className="text-[10px] text-muted-foreground">Auto RC for foreign procurement</p></div>
                                <Switch checked={reverseCharge} onCheckedChange={v => { setReverseCharge(v); emit({ reverseCharge: v }); }} />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div><p className="text-sm font-medium">Zero-Rated Support</p><p className="text-[10px] text-muted-foreground">Handle exports and exempt goods</p></div>
                                <Switch checked={zeroRated} onCheckedChange={v => { setZeroRated(v); emit({ zeroRated: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── FILING & CONTROLS ── */}
            <TabsContent value="filing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Filing Engine</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Filing Frequency</Label>
                                    <Select value={filingFreq} onValueChange={v => { setFilingFreq(v); emit({ filingFreq: v }); }}>
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
                                    <Select value={methodology} onValueChange={v => { setMethodology(v); emit({ methodology: v }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accrual">Accrual Basis</SelectItem>
                                            <SelectItem value="cash">Cash Basis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs font-medium">Auto VAT Return</p><p className="text-[10px] text-muted-foreground">Generate XML for FTA portal</p></div></div>
                                <Switch checked={autoVatReturn} onCheckedChange={v => { setAutoVatReturn(v); emit({ autoVatReturn: v }); }} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div className="flex items-center gap-3"><AlertCircle className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs font-medium">Filing Reminders</p><p className="text-[10px] text-muted-foreground">7-day advance notice</p></div></div>
                                <Switch checked={filingReminders} onCheckedChange={v => { setFilingReminders(v); emit({ filingReminders: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-red-600" /> Audit Controls</CardTitle><CardDescription className="text-[11px]">Enterprise-grade controls to prevent post-filing tampering</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div><p className="text-sm font-medium">Tax lock after filing</p><p className="text-[10px] text-muted-foreground">Prevents modification of transactions in filed periods</p></div>
                                <Switch checked={taxLockAfterFiling} onCheckedChange={v => { setTaxLockAfterFiling(v); emit({ taxLockAfterFiling: v }); }} />
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div><p className="text-sm font-medium">Period VAT freeze</p><p className="text-[10px] text-muted-foreground">Freezes all VAT-bearing entries once filed</p></div>
                                <Switch checked={periodVatFreeze} onCheckedChange={v => { setPeriodVatFreeze(v); emit({ periodVatFreeze: v }); }} />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div><p className="text-sm font-medium">Adjustment-only mode</p><p className="text-[10px] text-muted-foreground">Only tagged adjustments allowed after filing</p></div>
                                <Switch checked={adjustmentOnlyMode} onCheckedChange={v => { setAdjustmentOnlyMode(v); emit({ adjustmentOnlyMode: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── Jurisdiction Dialog ── */}
            <Dialog open={jurDialogOpen} onOpenChange={setJurDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingJur?.id ? 'Edit Jurisdiction' : 'Add Tax Jurisdiction'}</DialogTitle>
                        <DialogDescription className="text-xs">Register a tax jurisdiction where your organization has obligations.</DialogDescription>
                    </DialogHeader>
                    {editingJur && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Country</Label>
                                    <Select value={editingJur.code} onValueChange={v => { const c = COUNTRIES.find(cc => cc.code === v); setEditingJur({ ...editingJur, code: v, country: c?.name || '' }); }}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax System</Label>
                                    <Select value={editingJur.system} onValueChange={v => setEditingJur({ ...editingJur, system: v })}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">VAT</SelectItem>
                                            <SelectItem value="gst">GST</SelectItem>
                                            <SelectItem value="sales">Sales Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Tax Registration Number</Label>
                                <Input value={editingJur.regNumber} onChange={e => setEditingJur({ ...editingJur, regNumber: e.target.value })} placeholder="TRN-100234567890003" className="h-9 text-xs font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Reporting Period</Label>
                                    <Select value={editingJur.reportingPeriod} onValueChange={v => setEditingJur({ ...editingJur, reportingPeriod: v })}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Filing Method</Label>
                                    <Input value={editingJur.filingMethod} onChange={e => setEditingJur({ ...editingJur, filingMethod: e.target.value })} placeholder="FTA E-Filing" className="h-9 text-xs" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Tax Authority Name</Label>
                                <Input value={editingJur.authority} onChange={e => setEditingJur({ ...editingJur, authority: e.target.value })} placeholder="Federal Tax Authority" className="h-9 text-xs" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setJurDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveJur}>Save Jurisdiction</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Tax Code Dialog ── */}
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>{editingCode?.id ? 'Edit Tax Code' : 'Add Tax Code'}</DialogTitle>
                        <DialogDescription className="text-xs">Define a tax code with GL mapping, recoverability, and effective dates.</DialogDescription>
                    </DialogHeader>
                    {editingCode && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Code</Label>
                                    <Input value={editingCode.code} onChange={e => setEditingCode({ ...editingCode, code: e.target.value })} placeholder="VAT5_OUTPUT" className="h-9 text-xs font-mono" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs">Description</Label>
                                    <Input value={editingCode.description} onChange={e => setEditingCode({ ...editingCode, description: e.target.value })} placeholder="Standard Output VAT" className="h-9 text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax Type</Label>
                                    <Select value={editingCode.type} onValueChange={v => setEditingCode({ ...editingCode, type: v })}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="output">Output</SelectItem>
                                            <SelectItem value="input">Input</SelectItem>
                                            <SelectItem value="reverse_charge">Reverse Charge</SelectItem>
                                            <SelectItem value="withholding">Withholding</SelectItem>
                                            <SelectItem value="zero_rated">Zero-Rated</SelectItem>
                                            <SelectItem value="exempt">Exempt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Rate (%)</Label>
                                    <Input value={editingCode.rate} onChange={e => setEditingCode({ ...editingCode, rate: e.target.value })} placeholder="5" className="h-9 text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Recoverable %</Label>
                                    <Input value={editingCode.recoverablePct} onChange={e => setEditingCode({ ...editingCode, recoverablePct: e.target.value })} placeholder="100" className="h-9 text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">GL Payable Account</Label>
                                    <Input value={editingCode.glPayable} onChange={e => setEditingCode({ ...editingCode, glPayable: e.target.value })} placeholder="2200 – VAT Payable" className="h-9 text-xs font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">GL Receivable Account</Label>
                                    <Input value={editingCode.glReceivable} onChange={e => setEditingCode({ ...editingCode, glReceivable: e.target.value })} placeholder="1400 – VAT Receivable" className="h-9 text-xs font-mono" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Effective Date</Label>
                                    <Input type="date" value={editingCode.effectiveDate} onChange={e => setEditingCode({ ...editingCode, effectiveDate: e.target.value })} className="h-9 text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Expiry Date (optional)</Label>
                                    <Input type="date" value={editingCode.expiryDate} onChange={e => setEditingCode({ ...editingCode, expiryDate: e.target.value })} className="h-9 text-xs" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div><p className="text-xs font-medium">Auto Self-Account (Reverse Charge)</p><p className="text-[10px] text-muted-foreground">Auto-generate mirror entry for reverse charge</p></div>
                                <Switch checked={editingCode.autoSelfAccount} onCheckedChange={v => setEditingCode({ ...editingCode, autoSelfAccount: v })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveCode}>Save Tax Code</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}

function TaxTypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = {
        output: 'bg-red-50 text-red-700', input: 'bg-emerald-50 text-emerald-700',
        reverse_charge: 'bg-violet-50 text-violet-700', withholding: 'bg-amber-50 text-amber-700',
        exempt: 'bg-gray-100 text-gray-600', zero_rated: 'bg-blue-50 text-blue-700',
    };
    return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", c[type] ?? 'bg-muted')}>{type.replace('_', ' ')}</span>;
}
