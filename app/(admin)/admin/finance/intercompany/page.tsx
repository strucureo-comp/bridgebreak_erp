'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, ChevronLeft, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

const ENTITIES = [
    { id: 'E001', name: 'System Steel Engineering LLC', country: 'UAE', currency: 'AED', type: 'Parent' },
    { id: 'E002', name: 'System Steel KSA', country: 'Saudi Arabia', currency: 'SAR', type: 'Subsidiary' },
    { id: 'E003', name: 'System Steel India Pvt Ltd', country: 'India', currency: 'INR', type: 'Subsidiary' },
];

const IC_BALANCES = [
    { from: 'E001', to: 'E002', fromName: 'SS UAE', toName: 'SS KSA', amount: 185000, currency: 'AED', status: 'unsettled', type: 'Service Charge' },
    { from: 'E003', to: 'E001', fromName: 'SS India', toName: 'SS UAE', amount: 42000, currency: 'AED', status: 'settled', type: 'Engineering Support' },
    { from: 'E002', to: 'E003', fromName: 'SS KSA', toName: 'SS India', amount: 28000, currency: 'SAR', status: 'unsettled', type: 'Material Supply' },
];

const ELIMINATIONS = [
    { id: 'ELIM-003', description: 'IC Revenue/Expense — UAE↔KSA Q4 2025', amount: 320000, status: 'pending' },
    { id: 'ELIM-002', description: 'IC Receivable/Payable — India↔UAE', amount: 42000, status: 'applied' },
    { id: 'ELIM-001', description: 'IC Dividend — KSA→UAE FY2025', amount: 150000, status: 'applied' },
];

export default function IntercompanyPage() {
    const { format: fmt } = useCurrency();
    const [tab, setTab] = useState('entities');
    const unsettled = IC_BALANCES.filter(b => b.status === 'unsettled').length;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance"><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button></Link>
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Intercompany Accounting</h1>
                            <p className="text-[11px] text-muted-foreground">Multi-Entity · Mirror Journals · Elimination · Consolidation</p>
                        </div>
                    </div>
                    {unsettled > 0 && <Badge variant="outline" className="border-amber-300 text-amber-600 text-[9px]">{unsettled} Unsettled</Badge>}
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Kpi label="Entities" value={String(ENTITIES.length)} /><Kpi label="IC Transactions" value={String(IC_BALANCES.length)} />
                    <Kpi label="Unsettled" value={String(unsettled)} alert={unsettled > 0} /><Kpi label="Pending Elimination" value={String(ELIMINATIONS.filter(e => e.status === 'pending').length)} />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-muted/50 border h-9 p-0.5">
                        <TabsTrigger value="entities" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Entities</TabsTrigger>
                        <TabsTrigger value="balances" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">IC Balances</TabsTrigger>
                        <TabsTrigger value="eliminations" className="text-xs font-semibold h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Eliminations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entities" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            {ENTITIES.map(e => (
                                <Card key={e.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge variant={e.type === 'Parent' ? 'default' : 'secondary'} className="text-[9px]">{e.type}</Badge>
                                            <span className="font-mono text-xs text-red-600">{e.id}</span>
                                        </div>
                                        <h3 className="text-sm font-bold mb-1">{e.name}</h3>
                                        <p className="text-[11px] text-muted-foreground">{e.country} · {e.currency}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="balances" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">From</span><span className="col-span-2">To</span>
                                        <span className="col-span-2">Type</span><span className="col-span-2 text-right">Amount</span>
                                        <span className="col-span-2">Currency</span><span className="col-span-2 text-right">Status</span>
                                    </div>
                                    {IC_BALANCES.map((b, i) => (
                                        <div key={i} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <span className="col-span-2 text-xs font-medium">{b.fromName}</span>
                                            <span className="col-span-2 text-xs font-medium">{b.toName}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{b.type}</span>
                                            <span className="col-span-2 text-right text-xs font-bold">{fmt(b.amount)}</span>
                                            <span className="col-span-2 text-xs text-muted-foreground">{b.currency}</span>
                                            <span className="col-span-2 text-right">
                                                <Badge variant={b.status === 'settled' ? 'default' : 'outline'} className="text-[8px] h-4 px-1">{b.status}</Badge>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="eliminations" className="mt-6">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    {ELIMINATIONS.map(e => (
                                        <div key={e.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", e.status === 'applied' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                                    {e.status === 'applied' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{e.description}</p>
                                                    <p className="text-[10px] text-muted-foreground">{e.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold">{fmt(e.amount)}</span>
                                                <Badge variant={e.status === 'applied' ? 'default' : 'outline'} className="text-[8px] h-4 px-1">{e.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
    return (<Card className={cn("border-border shadow-sm", alert && "border-red-200")}><CardContent className="p-3"><p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p><p className={cn("text-lg font-bold tracking-tight", alert && "text-red-600")}>{value}</p></CardContent></Card>);
}
