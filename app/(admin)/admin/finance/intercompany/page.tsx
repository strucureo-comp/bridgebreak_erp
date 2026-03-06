'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Building2, ChevronLeft, ArrowRightLeft, CheckCircle2, AlertTriangle,
    Globe, ShieldCheck, RefreshCcw, FileText, PieChart, Landmark,
    TrendingUp, ExternalLink, Play, Lock, Database, Search, Filter,
    Layers, Scale, Briefcase, Zap, History
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/finance/KpiCard';

// ── TYPES ──────────────────────────────────────────────────────────────────────
type ConsolidationMethod = 'Full' | 'Equity' | 'Proportionate';

interface Entity {
    id: string;
    code: string;
    name: string;
    legalName: string;
    country: string;
    baseCurrency: string;
    functionalCurrency: string;
    taxJur: string;
    ownership: number;
    method: ConsolidationMethod;
    type: 'Parent' | 'Subsidiary' | 'Associate';
    clearingAccount: string;
    status: 'active' | 'locked';
}

interface ICTransaction {
    id: string;
    sourceEntity: string;
    targetEntity: string;
    type: 'Service' | 'Material' | 'Loan' | 'Dividend';
    amount: number;
    currency: string;
    description: string;
    date: string;
    status: 'Pending' | 'Mirrored' | 'Settled' | 'Eliminated';
    mirrorId?: string;
    reference: string;
}

interface Elimination {
    id: string;
    type: 'RevExpr' | 'RecPay' | 'Dividend' | 'UnrealizedProfit';
    entities: [string, string];
    amount: number;
    period: string;
    status: 'Review' | 'Applied' | 'Reversed';
    description: string;
}

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const ENTITIES: Entity[] = [
    {
        id: 'E001', code: 'GRP-UAE', name: 'System Steel UAE', legalName: 'SYSTEM STEEL ENGINEERING LLC',
        country: 'UAE', baseCurrency: 'AED', functionalCurrency: 'AED', taxJur: 'UAE FTA',
        ownership: 100, method: 'Full', type: 'Parent', clearingAccount: '125001', status: 'active'
    },
    {
        id: 'E002', code: 'SUB-KSA', name: 'System Steel KSA', legalName: 'SYSTEM STEEL KSA BRANCH',
        country: 'Saudi Arabia', baseCurrency: 'SAR', functionalCurrency: 'SAR', taxJur: 'ZATCA',
        ownership: 100, method: 'Full', type: 'Subsidiary', clearingAccount: '125002', status: 'active'
    },
    {
        id: 'E003', code: 'SUB-IND', name: 'System Steel India', legalName: 'SYSTEM STEEL INDIA PVT LTD',
        country: 'India', baseCurrency: 'INR', functionalCurrency: 'INR', taxJur: 'GST IND',
        ownership: 75, method: 'Full', type: 'Subsidiary', clearingAccount: '125003', status: 'active'
    },
];

const TRANSACTIONS: ICTransaction[] = [
    {
        id: 'IC-TX-901', sourceEntity: 'GRP-UAE', targetEntity: 'SUB-KSA', type: 'Service',
        amount: 85000, currency: 'AED', description: 'Management Fee Allocation Q4',
        date: '2026-02-15', status: 'Mirrored', mirrorId: 'KSA-J-442', reference: 'REF-IC-MGT-Q4'
    },
    {
        id: 'IC-TX-902', sourceEntity: 'SUB-IND', targetEntity: 'GRP-UAE', type: 'Material',
        amount: 1420000, currency: 'INR', description: 'Consumables Export',
        date: '2026-02-20', status: 'Pending', reference: 'EXP-882-IND'
    },
    {
        id: 'IC-TX-903', sourceEntity: 'SUB-KSA', targetEntity: 'SUB-IND', type: 'Loan',
        amount: 50000, currency: 'USD', description: 'Working Capital Support',
        date: '2026-02-22', status: 'Mirrored', mirrorId: 'IND-J-091', reference: 'LOAN-KSA-IND-01'
    }
];

const ELIMINATIONS: Elimination[] = [
    { id: 'ELIM-2601', type: 'RevExpr', entities: ['GRP-UAE', 'SUB-KSA'], amount: 85000, period: 'Feb 2026', status: 'Applied', description: 'Management Fee Contras' },
    { id: 'ELIM-2602', type: 'RecPay', entities: ['SUB-IND', 'GRP-UAE'], amount: 62000, period: 'Feb 2026', status: 'Review', description: 'Material Trade Elimination' },
    { id: 'ELIM-2603', type: 'Dividend', entities: ['SUB-KSA', 'GRP-UAE'], amount: 150000, period: 'FY2025', status: 'Applied', description: 'Annual Dividend' },
];

export default function IntercompanyPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('entities');
    const [consoStep, setConsoStep] = useState(0);

    const stats = useMemo(() => ({
        entities: ENTITIES.length,
        unsettled: TRANSACTIONS.filter(t => t.status === 'Pending').length,
        pendingElim: ELIMINATIONS.filter(e => e.status === 'Review').length,
        mismatchCount: 1, // Mock mismatch detected for UAE-IND
    }), []);

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-20">

                {/* ── Standardized Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 sticky top-0 z-20 bg-background/95 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/finance">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="h-11 w-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight uppercase leading-none">Intercompany Hub</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Group Consolidation Engine</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-4 hidden lg:flex text-right">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Reporting Standard</span>
                            <span className="text-xs font-black text-foreground uppercase mt-1">IFRS / IAS 21</span>
                        </div>
                        <Button className="h-10 px-6 gap-2 bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-200">
                            <RefreshCcw className="h-4 w-4" /> Run Consolidation
                        </Button>
                    </div>
                </div>

                {/* ── Strategic KPI Strip ── */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    <KpiCard label="Total Entities" value={String(stats.entities)} />
                    <KpiCard label="Unsettled Pairs" value={String(stats.unsettled)} alert={stats.unsettled > 0} />
                    <KpiCard label="Pending Elim." value={String(stats.pendingElim)} alert={stats.pendingElim > 0} />
                    <KpiCard label="Mismatch Alerts" value={String(stats.mismatchCount)} alert={stats.mismatchCount > 0} />
                    <KpiCard label="Consolidation" value="95%" footer="Period: Feb 2026" />
                </div>

                <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                    <TabsList className="bg-muted/50 border h-10 p-1 flex-wrap md:flex-nowrap">
                        <TabsTrigger value="entities" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Entity Master</TabsTrigger>
                        <TabsTrigger value="transactions" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">IC Engine</TabsTrigger>
                        <TabsTrigger value="recon" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Balance Matrix</TabsTrigger>
                        <TabsTrigger value="eliminations" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Elimination Logic</TabsTrigger>
                        <TabsTrigger value="consolidation" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Conso Run</TabsTrigger>
                        <TabsTrigger value="reports" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Group Web</TabsTrigger>
                    </TabsList>

                    {/* ── ENTITY MASTER ── */}
                    <TabsContent value="entities" className="animate-in fade-in duration-500">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ENTITIES.map(e => (
                                <Card key={e.id} className="border-border shadow-sm hover:border-red-200 transition-all group overflow-hidden">
                                    <div className="h-1 bg-red-600 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <Badge variant={e.type === 'Parent' ? 'default' : 'outline'} className="text-[8px] font-black uppercase tracking-widest mb-1">
                                                    {e.type}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{e.code}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground mb-1">{e.name}</h3>
                                        <p className="text-[11px] text-muted-foreground mb-4">{e.legalName}</p>

                                        <div className="grid grid-cols-2 gap-y-3 pt-4 border-t border-border mt-auto">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ownership</p>
                                                <p className="text-xs font-bold">{e.ownership}%</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Method</p>
                                                <p className="text-xs font-bold text-red-600">{e.method}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Base/Func</p>
                                                <p className="text-xs font-bold">{e.baseCurrency} / {e.functionalCurrency}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Clearing GL</p>
                                                <p className="text-xs font-mono font-bold">{e.clearingAccount}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ── IC ENGINE (TRANSACTIONS) ── */}
                    <TabsContent value="transactions" className="animate-in fade-in duration-500">
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b py-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Mirror Transaction Engine</CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Automatic dual-posting logic with source integrity checks</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 bg-white">
                                        <Zap className="h-3 w-3 text-red-600" /> New IC Entry
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] sticky top-0">
                                        <span className="col-span-1 text-center">Date</span>
                                        <span className="col-span-2">Source / Target</span>
                                        <span className="col-span-3">Description</span>
                                        <span className="col-span-2 text-right">Amount</span>
                                        <span className="col-span-2 text-center">Status</span>
                                        <span className="col-span-2 text-right">Reference</span>
                                    </div>
                                    {TRANSACTIONS.map((t, i) => (
                                        <div key={t.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/20 transition-colors group">
                                            <span className="col-span-1 text-[10px] font-bold text-muted-foreground">{t.date}</span>
                                            <div className="col-span-2 flex items-center gap-2">
                                                <span className="text-[11px] font-black text-slate-600">{t.sourceEntity}</span>
                                                <ArrowRightLeft className="h-3 w-3 text-red-400" />
                                                <span className="text-[11px] font-black text-red-600">{t.targetEntity}</span>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-xs font-bold text-foreground">{t.description}</p>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.type}</p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-sm font-black text-foreground">{fmt(t.amount)}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground">{t.currency}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center gap-1">
                                                <Badge
                                                    variant={t.status === 'Mirrored' ? 'default' : t.status === 'Pending' ? 'outline' : 'secondary'}
                                                    className={cn("text-[9px] font-black uppercase tracking-widest px-2 h-4", t.status === 'Pending' && "border-amber-300 text-amber-600")}
                                                >
                                                    {t.status}
                                                </Badge>
                                                {t.mirrorId && <span className="text-[8px] font-mono font-bold text-slate-400 group-hover:text-red-500 transition-colors">Mirror: {t.mirrorId}</span>}
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-[11px] font-mono font-bold text-red-600">{t.reference}</p>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">ID: {t.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-muted/20 border-t flex items-center justify-center">
                                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-600 h-8 gap-2">
                                        View Full Ledger Sync Trace <ChevronLeft className="h-3 w-3 rotate-180" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── RECONCILIATION MATRIX ── */}
                    <TabsContent value="recon" className="animate-in fade-in duration-500">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest">Entity-to-Entity Balance Matrix</CardTitle>
                                <CardDescription className="text-[11px] font-medium">Net exposure across the group structure with real-time discrepancy detection</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-border text-red-600">Counterparty ↓</th>
                                                {ENTITIES.map(e => (
                                                    <th key={e.id} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-border text-center">{e.code}</th>
                                                ))}
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-border text-right bg-slate-50">Total Assets</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {ENTITIES.map(rowE => (
                                                <tr key={rowE.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-[11px] font-black uppercase text-foreground">{rowE.code}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground">{rowE.country}</p>
                                                    </td>
                                                    {ENTITIES.map(colE => {
                                                        const isSame = rowE.id === colE.id;
                                                        const hasMismatch = rowE.code === 'GRP-UAE' && colE.code === 'SUB-IND';
                                                        return (
                                                            <td key={colE.id} className={cn("px-6 py-4 text-center", isSame && "bg-slate-50/50")}>
                                                                {isSame ? (
                                                                    <span className="text-[18px] text-slate-200">/</span>
                                                                ) : (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={cn("text-xs font-black", hasMismatch ? "text-red-600" : "text-foreground")}>
                                                                            {fmt(Math.random() * 500000)}
                                                                        </span>
                                                                        {hasMismatch && (
                                                                            <Badge className="bg-red-50 text-red-600 border-none text-[8px] h-3 px-1 font-black animate-pulse">MISMATCH</Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 text-right bg-slate-50 font-black text-xs">
                                                        {fmt(Math.random() * 2000000)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── ELIMINATIONS ── */}
                    <TabsContent value="eliminations" className="animate-in fade-in duration-500">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-4">
                                <Card className="border-border shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        <span className="col-span-2">Period</span>
                                        <span className="col-span-4">Description</span>
                                        <span className="col-span-3 text-right">Elim. Amount</span>
                                        <span className="col-span-3 text-right">Status</span>
                                    </div>
                                    <div className="divide-y">
                                        {ELIMINATIONS.map(e => (
                                            <div key={e.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                                                <span className="col-span-2 text-[10px] font-black text-slate-500">{e.period}</span>
                                                <div className="col-span-4">
                                                    <p className="text-xs font-bold">{e.description}</p>
                                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">{e.type}</p>
                                                </div>
                                                <span className="col-span-3 text-right text-sm font-black text-foreground">{fmt(e.amount)}</span>
                                                <div className="col-span-3 text-right">
                                                    <Badge variant={e.status === 'Applied' ? 'default' : 'outline'} className={cn("text-[9px] font-black uppercase tracking-widest px-2 h-4", e.status === 'Review' && "border-amber-300 text-amber-600")}>
                                                        {e.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card className="border-border shadow-sm bg-red-600 text-white">
                                    <CardContent className="p-6">
                                        <Scale className="h-8 w-8 mb-4 opacity-50" />
                                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Elimination Logic</h3>
                                        <p className="text-xs font-medium opacity-90 leading-relaxed mb-6">
                                            The system automatically targets IC Revenue, Receivables, Dividends, and Unrealized Profit based on IAS 27 guidelines.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Auto-Contras</span>
                                                <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] h-4">ENABLED</Badge>
                                            </div>
                                            <Button className="w-full bg-white text-red-600 hover:bg-white/90 font-black uppercase text-[10px] tracking-widest py-5">
                                                Configure Rules
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── CONSOLIDATION RUN ── */}
                    <TabsContent value="consolidation" className="animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto py-6">
                            <div className="relative mb-12">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2" />
                                <div className="relative flex justify-between">
                                    {['Lock Books', 'FX Translation', 'Eliminations', 'Generate TB'].map((step, idx) => (
                                        <div key={step} className="flex flex-col items-center gap-3 bg-background z-10 px-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                                consoStep >= idx ? "bg-red-600 border-red-600 text-white shadow-xl shadow-red-200" : "bg-white border-slate-200 text-slate-300"
                                            )}>
                                                {consoStep > idx ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-black">{idx + 1}</span>}
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", consoStep >= idx ? "text-foreground" : "text-muted-foreground")}>
                                                {step}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Card className="border-border shadow-xl">
                                <CardContent className="p-10 text-center">
                                    <div className="h-20 w-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
                                        <Zap className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Consolidation Readiness</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                                        Current period: <span className="font-bold text-foreground">Feb 2026</span>. All entity books are closed. IC Recon Mismatch: 1. Do you wish to override and proceed?
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        <Button variant="outline" className="h-12 px-10 font-black uppercase text-[11px] tracking-widest border-border hover:bg-slate-50">
                                            Run Logic Tests
                                        </Button>
                                        <Button className="h-12 px-14 font-black uppercase text-[11px] tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200">
                                            Start Process
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ── REPORTS HUB ── */}
                    <TabsContent value="reports" className="animate-in fade-in duration-500">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                { title: 'Consolidated Trial Balance', icon: Database, label: 'Full Group View' },
                                { title: 'Consolidated Balance Sheet', icon: Scale, label: 'Standard IFRS Form' },
                                { title: 'Consolidated P&L', icon: TrendingUp, label: 'Trading Performance' },
                                { title: 'IC Exposure Report', icon: ShieldCheck, label: 'Risk Analytics' },
                            ].map(repo => (
                                <Card key={repo.title} className="border-border shadow-sm hover:border-red-200 transition-all cursor-pointer group">
                                    <CardContent className="p-6">
                                        <div className="h-11 w-11 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 flex items-center justify-center mb-6 transition-colors">
                                            <repo.icon className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-[13px] font-black uppercase leading-tight mb-2">{repo.title}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">{repo.label}</p>
                                        <Button variant="ghost" className="p-0 h-auto text-[9px] font-black uppercase tracking-[0.2em] text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Generate Report <ExternalLink className="h-2.5 w-2.5 ml-1.5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}
