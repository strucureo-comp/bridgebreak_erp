'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Scale, ChevronLeft, Globe, Plus, Lock,
  AlertTriangle, Settings, BookOpen, Trash2, Edit2,
  FileText, Calendar
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getTaxJurisdictions, createTaxJurisdiction, updateTaxJurisdiction, deleteTaxJurisdiction as apiDeleteJur,
  getTaxCodes as apiGetCodes, createTaxCode, updateTaxCode, deleteTaxCode as apiDeleteCode,
  getFilingPeriods as apiGetFilings, createFilingPeriod, toggleFilingPeriodStatus as apiToggleFiling,
  getTaxAdjustments, createTaxAdjustment, postTaxAdjustment as apiPostAdj, deleteTaxAdjustment as apiDeleteAdj,
} from '@/lib/api';

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface Jurisdiction {
  id: string; country: string; code: string; regNumber: string;
  system: string; reportingPeriod: string; filingMethod: string;
  authority: string; status: string;
}
interface TaxCode {
  id: string; code: string; description: string; jurisdiction: string;
  type: string; rate: number;
  glPayable: string; glReceivable: string;
  recoverablePct: number; effectiveDate: string; expiryDate: string;
  autoSelfAccount: boolean; status: string;
}
interface FilingPeriod {
  id: string; jurisdiction: string; period: string; startDate: string;
  endDate: string; dueDate: string; status: 'open' | 'filed' | 'locked';
  filedBy: string; filedAt: string;
  taxPayable: number; taxReceivable: number; netLiability: number;
}
interface TaxAdjustment {
  id: string; date: string; type: string; period: string;
  description: string; amount: number; je: string; status: string;
}

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' }, { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'SG', name: 'Singapore' }, { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' },
  { code: 'KW', name: 'Kuwait' }, { code: 'QA', name: 'Qatar' }, { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' }, { code: 'EG', name: 'Egypt' },
];

// ── JE REFERENCE EXAMPLES (educational, not mock data) ────────────────────────
const JE_EXAMPLES = [
  { scenario: 'Standard Purchase (Input VAT)', entries: [{ account: 'Expense', dr: 10000, cr: 0 }, { account: 'VAT Input', dr: 500, cr: 0 }, { account: 'Accounts Payable', dr: 0, cr: 10500 }] },
  { scenario: 'Reverse Charge Import', entries: [{ account: 'Expense', dr: 10000, cr: 0 }, { account: 'VAT Input', dr: 500, cr: 0 }, { account: 'VAT Output', dr: 0, cr: 500 }, { account: 'Accounts Payable', dr: 0, cr: 10000 }] },
  { scenario: 'Partial Recovery (60%)', entries: [{ account: 'Expense', dr: 10000, cr: 0 }, { account: 'VAT Input (Recoverable)', dr: 300, cr: 0 }, { account: 'Non-Recoverable VAT', dr: 200, cr: 0 }, { account: 'Accounts Payable', dr: 0, cr: 10500 }] },
];

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function TaxCenterPage() {
  const { format: fmt } = useCurrency();
  const [tab, setTab] = useState('jurisdictions');
  const [selectedJur, setSelectedJur] = useState<string>('');

  // ── STATE ──
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [filingPeriods, setFilingPeriods] = useState<FilingPeriod[]>([]);
  const [adjustments, setAdjustments] = useState<TaxAdjustment[]>([]);

  // ── FILING CONTROLS STATE ──
  const [taxLockAfterFiling, setTaxLockAfterFiling] = useState(true);
  const [periodVatFreeze, setPeriodVatFreeze] = useState(true);
  const [adjustmentOnlyMode, setAdjustmentOnlyMode] = useState(true);

  // ── DIALOGS ──
  const [jurDialogOpen, setJurDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [filingDialogOpen, setFilingDialogOpen] = useState(false);
  const [adjDialogOpen, setAdjDialogOpen] = useState(false);

  const [editingJur, setEditingJur] = useState<Jurisdiction | null>(null);
  const [editingCode, setEditingCode] = useState<TaxCode | null>(null);
  const [editingFiling, setEditingFiling] = useState<FilingPeriod | null>(null);
  const [editingAdj, setEditingAdj] = useState<TaxAdjustment | null>(null);

  // ── LOAD FROM BACKEND ──
  const normalize = (item: any): any => ({ ...item, id: item._id || item.id });
  const loadAll = useCallback(async () => {
    const [jurs, codes, filings, adjs] = await Promise.all([
      getTaxJurisdictions(), apiGetCodes(), apiGetFilings(), getTaxAdjustments(),
    ]);
    setJurisdictions(jurs.map(normalize));
    setTaxCodes(codes.map(normalize));
    setFilingPeriods(filings.map(normalize));
    setAdjustments(adjs.map(normalize));
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── COMPUTED ──
  const filteredCodes = selectedJur ? taxCodes.filter(tc => tc.jurisdiction === selectedJur) : taxCodes;
  const filteredPeriods = selectedJur ? filingPeriods.filter(fp => fp.jurisdiction === selectedJur) : filingPeriods;
  const openPeriods = filingPeriods.filter(fp => fp.status === 'open').length;
  const totalNetLiability = filingPeriods.filter(fp => fp.status === 'open').reduce((s, fp) => s + fp.netLiability, 0);

  // ── JURISDICTION CRUD ──
  const openAddJur = () => {
    setEditingJur({ id: '', country: '', code: '', regNumber: '', system: 'vat', reportingPeriod: 'quarterly', filingMethod: '', authority: '', status: 'active' });
    setJurDialogOpen(true);
  };
  const openEditJur = (j: Jurisdiction) => { setEditingJur({ ...j }); setJurDialogOpen(true); };
  const saveJur = async () => {
    if (!editingJur || !editingJur.code) { toast.error('Country is required'); return; }
    const countryName = COUNTRIES.find(c => c.code === editingJur.code)?.name || editingJur.code;
    const payload = { ...editingJur, country: countryName };
    try {
      if (editingJur.id) {
        await updateTaxJurisdiction(editingJur.id, payload);
      } else {
        const created = await createTaxJurisdiction(payload);
        if (!selectedJur) setSelectedJur(created.code);
      }
      await loadAll();
      setJurDialogOpen(false);
      toast.success('Jurisdiction saved');
    } catch { toast.error('Failed to save jurisdiction'); }
  };
  const deleteJur = async (id: string) => {
    try { await apiDeleteJur(id); await loadAll(); toast.success('Jurisdiction removed'); }
    catch { toast.error('Failed to delete jurisdiction'); }
  };

  // ── TAX CODE CRUD ──
  const openAddCode = () => {
    setEditingCode({ id: '', code: '', description: '', jurisdiction: selectedJur || '', type: 'output', rate: 0, glPayable: '', glReceivable: '', recoverablePct: 100, effectiveDate: new Date().toISOString().slice(0, 10), expiryDate: '', autoSelfAccount: false, status: 'active' });
    setCodeDialogOpen(true);
  };
  const openEditCode = (tc: TaxCode) => { setEditingCode({ ...tc }); setCodeDialogOpen(true); };
  const saveCode = async () => {
    if (!editingCode || !editingCode.code) { toast.error('Code is required'); return; }
    try {
      if (editingCode.id) { await updateTaxCode(editingCode.id, editingCode); }
      else { await createTaxCode(editingCode); }
      await loadAll();
      setCodeDialogOpen(false);
      toast.success('Tax code saved');
    } catch { toast.error('Failed to save tax code'); }
  };
  const deleteCode = async (id: string) => {
    try { await apiDeleteCode(id); await loadAll(); toast.success('Tax code removed'); }
    catch { toast.error('Failed to delete tax code'); }
  };

  // ── FILING PERIOD CRUD ──
  const openAddFiling = () => {
    setEditingFiling({ id: '', jurisdiction: selectedJur || '', period: '', startDate: '', endDate: '', dueDate: '', status: 'open', filedBy: '', filedAt: '', taxPayable: 0, taxReceivable: 0, netLiability: 0 });
    setFilingDialogOpen(true);
  };
  const saveFiling = async () => {
    if (!editingFiling || !editingFiling.period) { toast.error('Period name is required'); return; }
    try {
      await createFilingPeriod(editingFiling);
      await loadAll();
      setFilingDialogOpen(false);
      toast.success('Filing period saved');
    } catch { toast.error('Failed to save filing period'); }
  };
  const toggleFilingStatus = async (id: string) => {
    try {
      await apiToggleFiling(id);
      await loadAll();
      toast.success('Filing status updated');
    } catch { toast.error('Failed to update filing status'); }
  };

  // ── ADJUSTMENT CRUD ──
  const openAddAdj = () => {
    setEditingAdj({ id: '', date: new Date().toISOString().slice(0, 10), type: 'Correction', period: '', description: '', amount: 0, je: '', status: 'draft' });
    setAdjDialogOpen(true);
  };
  const saveAdj = async () => {
    if (!editingAdj || !editingAdj.description) { toast.error('Description is required'); return; }
    try {
      await createTaxAdjustment(editingAdj);
      await loadAll();
      setAdjDialogOpen(false);
      toast.success('Adjustment saved');
    } catch { toast.error('Failed to save adjustment'); }
  };
  const postAdj = async (id: string) => {
    try { await apiPostAdj(id); await loadAll(); toast.success('Adjustment posted'); }
    catch { toast.error('Failed to post adjustment'); }
  };

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
            <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Scale className="h-5 w-5" /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase leading-none">Tax Center</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Compliance & Audit Controls</span>
                <Badge variant="secondary" className="hidden sm:inline-flex font-bold uppercase text-[9px] tracking-widest bg-slate-100 text-slate-600">
                  IFRS / GAAP
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {openPeriods > 0 && <Badge variant="outline" className="border-amber-300 text-amber-600 text-[9px]">{openPeriods} Open</Badge>}
            <Link href="/admin/settings"><Button variant="outline" size="sm" className="gap-2 text-xs"><Settings className="h-3.5 w-3.5" /> Settings</Button></Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <Kpi label="Jurisdictions" value={String(jurisdictions.length)} />
          <Kpi label="Tax Codes" value={String(taxCodes.length)} />
          <Kpi label="Open Periods" value={String(openPeriods)} warn={openPeriods > 0} />
          <Kpi label="Net Liability" value={totalNetLiability ? fmt(totalNetLiability) : '—'} alert={totalNetLiability > 0} />
          <Kpi label="Adjustments" value={String(adjustments.length)} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 border h-9 p-0.5">
            <TabsTrigger value="jurisdictions" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Jurisdictions</TabsTrigger>
            <TabsTrigger value="codes" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Tax Codes</TabsTrigger>
            <TabsTrigger value="filing" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Filing Periods</TabsTrigger>
            <TabsTrigger value="adjustments" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Adjustments</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Filing Controls</TabsTrigger>
            <TabsTrigger value="entries" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">JE Logic</TabsTrigger>
          </TabsList>

          {/* ── JURISDICTIONS ── */}
          <TabsContent value="jurisdictions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Tax Jurisdictions</p>
              <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={openAddJur}><Plus className="h-3.5 w-3.5" /> Add Jurisdiction</Button>
            </div>
            {jurisdictions.length === 0 ? (
              <Card className="border-border shadow-sm"><CardContent className="p-12 text-center"><Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No jurisdictions configured</p><p className="text-[11px] text-muted-foreground mt-1">Add a jurisdiction to register your tax obligations</p><Button size="sm" className="mt-4 gap-2" onClick={openAddJur}><Plus className="h-3.5 w-3.5" /> Add Jurisdiction</Button></CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {jurisdictions.map(j => (
                  <Card key={j.id} className={cn("border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer", selectedJur === j.code && "ring-2 ring-red-200 border-red-300")} onClick={() => setSelectedJur(j.code)}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="default" className="text-[9px] bg-red-600">{j.system.toUpperCase()}</Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); openEditJur(j); }}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={e => { e.stopPropagation(); deleteJur(j.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold mb-1">{j.country}</h3>
                      <div className="space-y-1.5 mt-3 text-[11px]">
                        <div className="flex justify-between"><span className="text-muted-foreground">TRN</span><span className="font-mono font-medium text-[10px]">{j.regNumber || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Reporting</span><span className="font-medium capitalize">{j.reportingPeriod}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Filing</span><span className="font-medium">{j.filingMethod || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Authority</span><span className="font-medium">{j.authority || '—'}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── TAX CODES ── */}
          <TabsContent value="codes" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant={!selectedJur ? 'default' : 'outline'} size="sm" className={cn("text-[11px] h-7", !selectedJur && "bg-red-600 hover:bg-red-700")} onClick={() => setSelectedJur('')}>All</Button>
                {jurisdictions.map(j => (
                  <Button key={j.code} variant={selectedJur === j.code ? 'default' : 'outline'} size="sm"
                    className={cn("text-[11px] h-7", selectedJur === j.code && "bg-red-600 hover:bg-red-700")}
                    onClick={() => setSelectedJur(j.code)}>{j.country}</Button>
                ))}
              </div>
              <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={openAddCode}><Plus className="h-3.5 w-3.5" /> Add Tax Code</Button>
            </div>
            {filteredCodes.length === 0 ? (
              <Card className="border-border shadow-sm"><CardContent className="p-12 text-center"><BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No tax codes configured</p><Button size="sm" className="mt-4 gap-2" onClick={openAddCode}><Plus className="h-3.5 w-3.5" /> Add Tax Code</Button></CardContent></Card>
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="col-span-2">Code</span><span className="col-span-2">Type</span>
                      <span className="col-span-1 text-right">Rate</span><span className="col-span-2">GL Payable</span>
                      <span className="col-span-2">GL Receivable</span><span className="col-span-1 text-right">Recov%</span>
                      <span className="col-span-1">From</span><span className="col-span-1 text-right">Actions</span>
                    </div>
                    {filteredCodes.map(tc => (
                      <div key={tc.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm group">
                        <div className="col-span-2"><p className="font-mono text-[10px] text-red-600 font-bold">{tc.code}</p><p className="text-[10px] text-muted-foreground truncate">{tc.description}</p></div>
                        <span className="col-span-2"><TaxTypeBadge type={tc.type} /></span>
                        <span className="col-span-1 text-right text-xs font-bold">{tc.rate}%</span>
                        <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{tc.glPayable || '—'}</span>
                        <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{tc.glReceivable || '—'}</span>
                        <span className={cn("col-span-1 text-right text-xs font-bold", tc.recoverablePct < 100 && "text-amber-600")}>{tc.recoverablePct}%</span>
                        <span className="col-span-1 text-[10px] text-muted-foreground">{tc.effectiveDate.slice(0, 7)}</span>
                        <span className="col-span-1 text-right flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => openEditCode(tc)}><Edit2 className="h-2.5 w-2.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteCode(tc.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── FILING PERIODS ── */}
          <TabsContent value="filing" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant={!selectedJur ? 'default' : 'outline'} size="sm" className={cn("text-[11px] h-7", !selectedJur && "bg-red-600 hover:bg-red-700")} onClick={() => setSelectedJur('')}>All</Button>
                {jurisdictions.map(j => (
                  <Button key={j.code} variant={selectedJur === j.code ? 'default' : 'outline'} size="sm"
                    className={cn("text-[11px] h-7", selectedJur === j.code && "bg-red-600 hover:bg-red-700")}
                    onClick={() => setSelectedJur(j.code)}>{j.country}</Button>
                ))}
              </div>
              <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={openAddFiling}><Plus className="h-3.5 w-3.5" /> Add Period</Button>
            </div>
            {filteredPeriods.length === 0 ? (
              <Card className="border-border shadow-sm"><CardContent className="p-12 text-center"><Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No filing periods configured</p><Button size="sm" className="mt-4 gap-2" onClick={openAddFiling}><Plus className="h-3.5 w-3.5" /> Add Filing Period</Button></CardContent></Card>
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="col-span-2">Period</span><span className="col-span-1">Due</span>
                      <span className="col-span-2 text-right">Output Tax</span><span className="col-span-2 text-right">Input Tax</span>
                      <span className="col-span-2 text-right">Net</span><span className="col-span-1">Status</span>
                      <span className="col-span-2 text-right">Action</span>
                    </div>
                    {filteredPeriods.map(fp => (
                      <div key={fp.id} className={cn("grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm", fp.status === 'locked' && "opacity-60")}>
                        <div className="col-span-2"><span className="text-xs font-medium">{fp.period}</span><p className="font-mono text-[9px] text-red-600">{fp.id}</p></div>
                        <span className="col-span-1 text-[10px] text-muted-foreground">{fp.dueDate.slice(5) || '—'}</span>
                        <span className="col-span-2 text-right text-xs">{fmt(fp.taxPayable)}</span>
                        <span className="col-span-2 text-right text-xs text-emerald-600">({fmt(fp.taxReceivable)})</span>
                        <span className="col-span-2 text-right text-xs font-bold text-red-600">{fmt(fp.netLiability)}</span>
                        <span className="col-span-1"><FilingBadge status={fp.status} /></span>
                        <span className="col-span-2 text-right">
                          {fp.status !== 'locked' && (
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => toggleFilingStatus(fp.id)}>
                              {fp.status === 'open' ? 'Mark Filed' : 'Lock'}
                            </Button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ADJUSTMENTS ── */}
          <TabsContent value="adjustments" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-bold">Tax Adjustment Journal</p><p className="text-[11px] text-muted-foreground">All adjustments tagged and linked to journal entries</p></div>
              <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={openAddAdj}><Plus className="h-3.5 w-3.5" /> Add Adjustment</Button>
            </div>
            {adjustments.length === 0 ? (
              <Card className="border-border shadow-sm"><CardContent className="p-12 text-center"><AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No adjustments recorded</p><Button size="sm" className="mt-4 gap-2" onClick={openAddAdj}><Plus className="h-3.5 w-3.5" /> Add Adjustment</Button></CardContent></Card>
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="col-span-1">ID</span><span className="col-span-2">Date</span><span className="col-span-1">Type</span>
                      <span className="col-span-1">Period</span><span className="col-span-3">Description</span>
                      <span className="col-span-2 text-right">Amount</span><span className="col-span-1">JE</span><span className="col-span-1 text-right">Status</span>
                    </div>
                    {adjustments.map(a => (
                      <div key={a.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                        <span className="col-span-1 font-mono text-[10px] text-red-600">{a.id}</span>
                        <span className="col-span-2 text-xs text-muted-foreground">{a.date}</span>
                        <span className="col-span-1"><Badge variant="outline" className="text-[8px] h-4 px-1">{a.type}</Badge></span>
                        <span className="col-span-1 text-[10px] text-muted-foreground">{a.period}</span>
                        <span className="col-span-3 text-xs truncate">{a.description}</span>
                        <span className={cn("col-span-2 text-right text-xs font-bold", a.amount < 0 ? "text-emerald-600" : "text-red-600")}>{fmt(a.amount)}</span>
                        <span className="col-span-1 font-mono text-[10px] text-blue-600">{a.je || '—'}</span>
                        <span className="col-span-1 text-right">
                          {a.status === 'draft' ? (
                            <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => postAdj(a.id)}>Post</Button>
                          ) : (
                            <Badge variant="default" className="text-[7px] h-3.5 px-1">posted</Badge>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── FILING CONTROLS ── */}
          <TabsContent value="controls" className="mt-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-red-600" /> Filing Controls</CardTitle>
                <CardDescription className="text-[11px]">Enterprise-grade controls to prevent post-filing tampering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div><p className="text-sm font-medium">Tax lock after filing</p><p className="text-[10px] text-muted-foreground">Prevents modification of transactions in filed periods</p></div>
                  <Switch checked={taxLockAfterFiling} onCheckedChange={setTaxLockAfterFiling} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div><p className="text-sm font-medium">Period VAT freeze</p><p className="text-[10px] text-muted-foreground">Freezes all VAT-bearing entries once period is filed</p></div>
                  <Switch checked={periodVatFreeze} onCheckedChange={setPeriodVatFreeze} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium">Adjustment-only mode (Filed periods)</p><p className="text-[10px] text-muted-foreground">Only tagged tax adjustments allowed after filing</p></div>
                  <Switch checked={adjustmentOnlyMode} onCheckedChange={setAdjustmentOnlyMode} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── JE LOGIC (Reference) ── */}
          <TabsContent value="entries" className="mt-6 space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tax-Aware Journal Entry Logic (Reference)</p>
            {JE_EXAMPLES.map((ex, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-red-600" /> {ex.scenario}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    <div className="grid grid-cols-3 px-6 py-2 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span>
                    </div>
                    {ex.entries.map((e, j) => (
                      <div key={j} className="grid grid-cols-3 px-6 py-2 text-xs hover:bg-muted/20">
                        <span className="font-medium">{e.account}</span>
                        <span className="text-right font-bold">{e.dr > 0 ? fmt(e.dr) : ''}</span>
                        <span className="text-right font-bold">{e.cr > 0 ? fmt(e.cr) : ''}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* ── JURISDICTION DIALOG ── */}
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
                    <Select value={editingJur.code} onValueChange={v => setEditingJur({ ...editingJur, code: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select country" /></SelectTrigger>
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
              <Button size="sm" onClick={saveJur}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── TAX CODE DIALOG ── */}
        <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editingCode?.id ? 'Edit Tax Code' : 'Add Tax Code'}</DialogTitle>
              <DialogDescription className="text-xs">Define a tax code with GL mapping, recoverability, and effective dates.</DialogDescription>
            </DialogHeader>
            {editingCode && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Code</Label><Input value={editingCode.code} onChange={e => setEditingCode({ ...editingCode, code: e.target.value })} placeholder="VAT5_OUTPUT" className="h-9 text-xs font-mono" /></div>
                  <div className="col-span-2 space-y-2"><Label className="text-xs">Description</Label><Input value={editingCode.description} onChange={e => setEditingCode({ ...editingCode, description: e.target.value })} placeholder="Standard Output VAT" className="h-9 text-xs" /></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Jurisdiction</Label>
                    <Select value={editingCode.jurisdiction} onValueChange={v => setEditingCode({ ...editingCode, jurisdiction: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{jurisdictions.map(j => <SelectItem key={j.code} value={j.code}>{j.country}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tax Type</Label>
                    <Select value={editingCode.type} onValueChange={v => setEditingCode({ ...editingCode, type: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="output">Output</SelectItem><SelectItem value="input">Input</SelectItem>
                        <SelectItem value="reverse_charge">Reverse Charge</SelectItem><SelectItem value="withholding">Withholding</SelectItem>
                        <SelectItem value="zero_rated">Zero-Rated</SelectItem><SelectItem value="exempt">Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">Rate (%)</Label><Input type="number" value={editingCode.rate} onChange={e => setEditingCode({ ...editingCode, rate: Number(e.target.value) })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Recoverable %</Label><Input type="number" value={editingCode.recoverablePct} onChange={e => setEditingCode({ ...editingCode, recoverablePct: Number(e.target.value) })} className="h-9 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs">GL Payable Account</Label><Input value={editingCode.glPayable} onChange={e => setEditingCode({ ...editingCode, glPayable: e.target.value })} placeholder="2200 – VAT Payable" className="h-9 text-xs font-mono" /></div>
                  <div className="space-y-2"><Label className="text-xs">GL Receivable Account</Label><Input value={editingCode.glReceivable} onChange={e => setEditingCode({ ...editingCode, glReceivable: e.target.value })} placeholder="1400 – VAT Receivable" className="h-9 text-xs font-mono" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Effective Date</Label><Input type="date" value={editingCode.effectiveDate} onChange={e => setEditingCode({ ...editingCode, effectiveDate: e.target.value })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Expiry Date (optional)</Label><Input type="date" value={editingCode.expiryDate} onChange={e => setEditingCode({ ...editingCode, expiryDate: e.target.value })} className="h-9 text-xs" /></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div><p className="text-xs font-medium">Auto Self-Account (Reverse Charge)</p><p className="text-[10px] text-muted-foreground">Auto-generate mirror entry for RC</p></div>
                  <Switch checked={editingCode.autoSelfAccount} onCheckedChange={v => setEditingCode({ ...editingCode, autoSelfAccount: v })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveCode}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── FILING PERIOD DIALOG ── */}
        <Dialog open={filingDialogOpen} onOpenChange={setFilingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Filing Period</DialogTitle>
              <DialogDescription className="text-xs">Define a tax filing period with dates and amounts.</DialogDescription>
            </DialogHeader>
            {editingFiling && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Jurisdiction</Label>
                    <Select value={editingFiling.jurisdiction} onValueChange={v => setEditingFiling({ ...editingFiling, jurisdiction: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{jurisdictions.map(j => <SelectItem key={j.code} value={j.code}>{j.country}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">Period Name</Label><Input value={editingFiling.period} onChange={e => setEditingFiling({ ...editingFiling, period: e.target.value })} placeholder="Q1 2026" className="h-9 text-xs" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Start Date</Label><Input type="date" value={editingFiling.startDate} onChange={e => setEditingFiling({ ...editingFiling, startDate: e.target.value })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">End Date</Label><Input type="date" value={editingFiling.endDate} onChange={e => setEditingFiling({ ...editingFiling, endDate: e.target.value })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Due Date</Label><Input type="date" value={editingFiling.dueDate} onChange={e => setEditingFiling({ ...editingFiling, dueDate: e.target.value })} className="h-9 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Tax Payable (Output)</Label><Input type="number" value={editingFiling.taxPayable} onChange={e => setEditingFiling({ ...editingFiling, taxPayable: Number(e.target.value) })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Tax Receivable (Input)</Label><Input type="number" value={editingFiling.taxReceivable} onChange={e => setEditingFiling({ ...editingFiling, taxReceivable: Number(e.target.value) })} className="h-9 text-xs" /></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setFilingDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveFiling}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── ADJUSTMENT DIALOG ── */}
        <Dialog open={adjDialogOpen} onOpenChange={setAdjDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Tax Adjustment</DialogTitle>
              <DialogDescription className="text-xs">Record a tax adjustment linked to a journal entry.</DialogDescription>
            </DialogHeader>
            {editingAdj && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Date</Label><Input type="date" value={editingAdj.date} onChange={e => setEditingAdj({ ...editingAdj, date: e.target.value })} className="h-9 text-xs" /></div>
                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select value={editingAdj.type} onValueChange={v => setEditingAdj({ ...editingAdj, type: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Correction">Correction</SelectItem>
                        <SelectItem value="Credit Note">Credit Note</SelectItem>
                        <SelectItem value="Bad Debt">Bad Debt</SelectItem>
                        <SelectItem value="Reclassification">Reclassification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">Period</Label><Input value={editingAdj.period} onChange={e => setEditingAdj({ ...editingAdj, period: e.target.value })} placeholder="Q1 2026" className="h-9 text-xs" /></div>
                </div>
                <div className="space-y-2"><Label className="text-xs">Description</Label><Input value={editingAdj.description} onChange={e => setEditingAdj({ ...editingAdj, description: e.target.value })} placeholder="Describe the adjustment..." className="h-9 text-xs" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs">Amount (negative for reversals)</Label><Input type="number" value={editingAdj.amount} onChange={e => setEditingAdj({ ...editingAdj, amount: Number(e.target.value) })} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-xs">Journal Entry Ref</Label><Input value={editingAdj.je} onChange={e => setEditingAdj({ ...editingAdj, je: e.target.value })} placeholder="JE-0001" className="h-9 text-xs font-mono" /></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAdjDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveAdj}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Kpi({ label, value, alert, warn }: { label: string; value: string; alert?: boolean; warn?: boolean }) {
  return (<Card className={cn("border-border shadow-sm", alert && "border-red-200", warn && "border-amber-200")}><CardContent className="p-3"><p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p><p className={cn("text-lg font-bold tracking-tight", alert && "text-red-600")}>{value}</p></CardContent></Card>);
}
function TaxTypeBadge({ type }: { type: string }) {
  const c: Record<string, string> = { output: 'bg-red-50 text-red-700', input: 'bg-emerald-50 text-emerald-700', reverse_charge: 'bg-violet-50 text-violet-700', withholding: 'bg-amber-50 text-amber-700', exempt: 'bg-gray-100 text-gray-600', zero_rated: 'bg-blue-50 text-blue-700' };
  return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", c[type] ?? 'bg-muted')}>{type.replace('_', ' ')}</span>;
}
function FilingBadge({ status }: { status: string }) {
  return <Badge variant={status === 'open' ? 'outline' : status === 'filed' ? 'default' : 'secondary'} className={cn("text-[8px] h-4 px-1", status === 'locked' && "border-red-300 text-red-600")}>{status === 'locked' && <Lock className="h-2 w-2 mr-0.5" />}{status}</Badge>;
}