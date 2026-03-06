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
            <TabsContent value="jurisdictions" className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Tax Jurisdictions</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Primary and regional nexus registration directory</p>
                    </div>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-4 h-9" onClick={handleAddJur}><Plus className="h-3.5 w-3.5 mr-2" /> Add Jurisdiction</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jurisdictions.map(j => (
                        <Card key={j.id} className="border-border shadow-md hover:border-red-500 transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-5 flex items-start justify-between bg-muted/20 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-white border shadow-sm flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-tight leading-none">{j.country || COUNTRIES.find(c => c.code === j.code)?.name || j.code}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-tighter bg-white">{j.system.toUpperCase()}</Badge>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nexus Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingJur({ ...j }); setJurDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteJur(j.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Registration (TRN)</span>
                                        <p className="font-mono text-[10px] font-black text-slate-900">{j.regNumber || 'PENDING'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Reporting Period</span>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{j.reportingPeriod}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Filing Method</span>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{j.filingMethod || 'ELECTRONIC'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Primary Authority</span>
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter truncate">{j.authority || '—'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            {/* ── TAX CODES ── */}
            <TabsContent value="codes" className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Code Master Registry</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">High-Precision tax mapping & account integration</p>
                    </div>
                    <Button size="sm" className="bg-slate-900 text-[10px] font-black uppercase tracking-widest h-9" onClick={handleAddCode}><Plus className="h-3.5 w-3.5 mr-2" /> New CodeDef</Button>
                </div>
                <Card className="border-border shadow-md overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 border-b">
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tax Code ID</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground">Classification</th>
                                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground">Precision %</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground">GL Integration</th>
                                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground">Policy</th>
                                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {taxCodes.map(tc => (
                                        <tr key={tc.id} className="hover:bg-muted/10 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-mono text-[10px] font-black text-red-600 uppercase tracking-tighter">{tc.code}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate max-w-[120px]">{tc.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <TaxTypeBadge type={tc.type} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[11px] font-black text-slate-900">{tc.rate}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {tc.glPayable && <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tighter flex items-center gap-1"><BookOpen className="h-2 w-2" /> {tc.glPayable} (CR)</span>}
                                                    {tc.glReceivable && <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tighter flex items-center gap-1"><BookOpen className="h-2 w-2" /> {tc.glReceivable} (DR)</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn("text-[10px] font-black uppercase tracking-tighter", Number(tc.recoverablePct) < 100 ? "text-amber-500" : "text-slate-900")}>Recov {tc.recoverablePct}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingCode({ ...tc }); setCodeDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteCode(tc.id)}><Trash2 className="h-3 w-3" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── COMPLIANCE ── */}
            <TabsContent value="compliance" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <Landmark className="h-3.5 w-3.5" />
                                </div>
                                Primary Jurisdiction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax Region</Label>
                                    <Select value={region} onValueChange={v => { setRegion(v); emit({ region: v }); }}>
                                        <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax System</Label>
                                    <Select value={taxSystem} onValueChange={v => { setTaxSystem(v); emit({ taxSystem: v }); }}>
                                        <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">Value Added Tax (VAT)</SelectItem>
                                            <SelectItem value="sales">Sales Tax</SelectItem>
                                            <SelectItem value="gst">Goods & Services Tax (GST)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Standard Baseline Rate (%)</Label>
                                <div className="relative flex items-center">
                                    <Input value={defaultRate} onChange={e => { setDefaultRate(e.target.value); emit({ defaultRate: e.target.value }); }} className="h-11 pl-4 pr-12 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 focus:bg-white transition-all shadow-inner" />
                                    <span className="absolute right-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">% SCALE</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-white">
                                    <Shield className="h-3.5 w-3.5" />
                                </div>
                                Compliance Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Reverse Charge Protocol</Label>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Auto RC for foreign procurement</p>
                                </div>
                                <Switch checked={reverseCharge} onCheckedChange={v => { setReverseCharge(v); emit({ reverseCharge: v }); }} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Zero-Rated Exemption</Label>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Handle exports and exempt supply</p>
                                </div>
                                <Switch checked={zeroRated} onCheckedChange={v => { setZeroRated(v); emit({ zeroRated: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── FILING & CONTROLS ── */}
            <TabsContent value="filing" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                Filing Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Filing Cycle</Label>
                                    <Select value={filingFreq} onValueChange={v => { setFilingFreq(v); emit({ filingFreq: v }); }}>
                                        <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly Posting</SelectItem>
                                            <SelectItem value="quarterly">Quarterly Submission</SelectItem>
                                            <SelectItem value="annual">Fiscal Year End</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Accounting Basis</Label>
                                    <Select value={methodology} onValueChange={v => { setMethodology(v); emit({ methodology: v }); }}>
                                        <SelectTrigger className="h-11 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accrual">Accrual Basis</SelectItem>
                                            <SelectItem value="cash">Cash Basis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Zap className="h-3.5 w-3.5" /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-700">Auto Return (FTA XML)</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Ready for e-Filing Portal</p>
                                        </div>
                                    </div>
                                    <Switch checked={autoVatReturn} onCheckedChange={v => { setAutoVatReturn(v); emit({ autoVatReturn: v }); }} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><AlertCircle className="h-3.5 w-3.5" /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-700">Compliance Alerts</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Critical Filing Deadlines</p>
                                        </div>
                                    </div>
                                    <Switch checked={filingReminders} onCheckedChange={v => { setFilingReminders(v); emit({ filingReminders: v }); }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-muted/10 border-b py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-white">
                                    <Lock className="h-3.5 w-3.5" />
                                </div>
                                System Integrity Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Hard Period Lock</Label>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Anti-tampering post-filing</p>
                                </div>
                                <Switch checked={taxLockAfterFiling} onCheckedChange={v => { setTaxLockAfterFiling(v); emit({ taxLockAfterFiling: v }); }} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black uppercase tracking-tight text-slate-700">VAT Transaction Freeze</Label>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Immutable logs for audit</p>
                                </div>
                                <Switch checked={periodVatFreeze} onCheckedChange={v => { setPeriodVatFreeze(v); emit({ periodVatFreeze: v }); }} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black uppercase tracking-tight text-slate-700">Correction-Only Phase</Label>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Restricted modification zone</p>
                                </div>
                                <Switch checked={adjustmentOnlyMode} onCheckedChange={v => { setAdjustmentOnlyMode(v); emit({ adjustmentOnlyMode: v }); }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── Jurisdiction Dialog ── */}
            <Dialog open={jurDialogOpen} onOpenChange={setJurDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                            {editingJur?.id ? 'Edit Internal Jurisdiction' : 'Add Strategic Tax Jurisdiction'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Register a tax nexus where your organization maintains legal reporting obligations.
                        </DialogDescription>
                    </DialogHeader>
                    {editingJur && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Regulatory Country</Label>
                                    <Select value={editingJur.code} onValueChange={v => { const c = COUNTRIES.find(cc => cc.code === v); setEditingJur({ ...editingJur, code: v, country: c?.name || '' }); }}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax Protocol</Label>
                                    <Select value={editingJur.system} onValueChange={v => setEditingJur({ ...editingJur, system: v })}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">Value Added Tax (VAT)</SelectItem>
                                            <SelectItem value="gst">Goods & Services Tax (GST)</SelectItem>
                                            <SelectItem value="sales">Sales & Use Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax Registration Number (TRN)</Label>
                                <Input value={editingJur.regNumber} onChange={e => setEditingJur({ ...editingJur, regNumber: e.target.value })} placeholder="TRN-100234567890003" className="h-10 rounded-lg border-slate-100 font-mono text-xs bg-slate-50/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Reporting Cycle</Label>
                                    <Select value={editingJur.reportingPeriod} onValueChange={v => setEditingJur({ ...editingJur, reportingPeriod: v })}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly Filing</SelectItem>
                                            <SelectItem value="quarterly">Quarterly Filing</SelectItem>
                                            <SelectItem value="annual">Annual Filing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Filing Interface</Label>
                                    <Input value={editingJur.filingMethod} onChange={e => setEditingJur({ ...editingJur, filingMethod: e.target.value })} placeholder="FTA E-Filing Portal" className="h-10 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Primary Tax Authority Name</Label>
                                <Input value={editingJur.authority} onChange={e => setEditingJur({ ...editingJur, authority: e.target.value })} placeholder="Federal Tax Authority" className="h-10 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50" />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setJurDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" className="bg-slate-900 text-[10px] font-black uppercase tracking-widest px-6" onClick={handleSaveJur}>Commit Jurisdiction</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Tax Code Dialog ── */}
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                            {editingCode?.id ? 'Adjust Tax Definition' : 'Define New Tax Code'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Configure GL mapping, recoverability rules, and effective lifecycle for this tax code.
                        </DialogDescription>
                    </DialogHeader>
                    {editingCode && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Internal Code</Label>
                                    <Input value={editingCode.code} onChange={e => setEditingCode({ ...editingCode, code: e.target.value })} placeholder="VAT5_OUTPUT" className="h-10 rounded-lg border-slate-100 font-mono text-xs bg-slate-50/50" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Code Description</Label>
                                    <Input value={editingCode.description} onChange={e => setEditingCode({ ...editingCode, description: e.target.value })} placeholder="Standard Output VAT" className="h-10 rounded-lg border-slate-100 font-bold text-xs bg-slate-50/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax Type</Label>
                                    <Select value={editingCode.type} onValueChange={v => setEditingCode({ ...editingCode, type: v })}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-100 font-bold text-xs uppercase bg-slate-50/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="output">Output VAT</SelectItem>
                                            <SelectItem value="input">Input VAT</SelectItem>
                                            <SelectItem value="reverse_charge">Reverse Charge</SelectItem>
                                            <SelectItem value="withholding">Withholding Tax</SelectItem>
                                            <SelectItem value="zero_rated">Zero-Rated</SelectItem>
                                            <SelectItem value="exempt">Exempt Supply</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Tax Rate (%)</Label>
                                    <div className="relative">
                                        <Input value={editingCode.rate} onChange={e => setEditingCode({ ...editingCode, rate: e.target.value })} placeholder="5" className="h-10 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 pr-8" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Recoverable %</Label>
                                    <div className="relative">
                                        <Input value={editingCode.recoverablePct} onChange={e => setEditingCode({ ...editingCode, recoverablePct: e.target.value })} placeholder="100" className="h-10 rounded-lg border-slate-100 font-black text-xs bg-slate-50/50 pr-8" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">GL Payable Account (CR)</Label>
                                    <Input value={editingCode.glPayable} onChange={e => setEditingCode({ ...editingCode, glPayable: e.target.value })} placeholder="2200 – VAT Payable" className="h-10 rounded-lg border-slate-100 font-mono text-xs bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">GL Receivable Account (DR)</Label>
                                    <Input value={editingCode.glReceivable} onChange={e => setEditingCode({ ...editingCode, glReceivable: e.target.value })} placeholder="1400 – VAT Receivable" className="h-10 rounded-lg border-slate-100 font-mono text-xs bg-slate-50/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Effective Date</Label>
                                    <Input type="date" value={editingCode.effectiveDate} onChange={e => setEditingCode({ ...editingCode, effectiveDate: e.target.value })} className="h-10 rounded-lg border-slate-100 font-bold text-xs bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Expiry Policy</Label>
                                    <Input type="date" value={editingCode.expiryDate} onChange={e => setEditingCode({ ...editingCode, expiryDate: e.target.value })} className="h-10 rounded-lg border-slate-100 font-bold text-xs bg-slate-50/50" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-700">Auto Self-Account (Reverse Charge)</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Trigger duplicate entry for RC compliance</p>
                                </div>
                                <Switch checked={editingCode.autoSelfAccount} onCheckedChange={v => setEditingCode({ ...editingCode, autoSelfAccount: v })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" className="bg-slate-900 text-[10px] font-black uppercase tracking-widest px-6" onClick={handleSaveCode}>Commit Tax Code</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}

function TaxTypeBadge({ type }: { type: string }) {
    const c: Record<string, string> = {
        output: 'bg-red-50 text-red-600 border-red-100',
        input: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        reverse_charge: 'bg-violet-50 text-violet-600 border-violet-100',
        withholding: 'bg-amber-50 text-amber-600 border-amber-100',
        exempt: 'bg-slate-100 text-slate-500 border-slate-200',
        zero_rated: 'bg-blue-50 text-blue-600 border-blue-100',
    };
    return <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border", c[type] ?? 'bg-muted border-transparent')}>
        {type.replace('_', ' ')}
    </span>;
}
