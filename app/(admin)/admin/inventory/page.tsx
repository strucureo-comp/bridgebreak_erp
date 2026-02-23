'use client';

import React, { useState, useMemo } from 'react';
import {
  Package, Search, Plus, FileText, Settings as SettingsIcon, AlertTriangle, Activity,
  RefreshCw, DollarSign, Clock, ShieldAlert,
  ArrowRightLeft, CheckCircle2, Filter, MapPin, Trash2, Check, X, Shield, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- INITIAL MOCK DATA --- //
const INITIAL_SETTINGS = {
  wasteTolerancePercent: 5,
  writeOffApprovalThreshold: 5000,
  lowStockThreshold: 20, // Global baseline
};

const INITIAL_SKUS = [
  { id: 'STL-001', name: 'Structural Steel H-Beam', category: 'Raw Materials', unit: 'Tons', stock: 250, minThreshold: 50, costPerUnit: 1200, wastePercent: 2.0, siteAllocated: 100 },
  { id: 'CEM-002', name: 'Portland Cement Grade 43', category: 'Raw Materials', unit: 'Bags', stock: 15, minThreshold: 100, costPerUnit: 8, wastePercent: 6.5, siteAllocated: 500 },
  { id: 'CBL-003', name: 'Electrical Copper Cable', category: 'Electrical', unit: 'Meters', stock: 0, minThreshold: 500, costPerUnit: 15, wastePercent: 0.5, siteAllocated: 200 },
  { id: 'GLS-004', name: 'Tempered Glass Panels', category: 'Finishing', unit: 'Sq Meters', stock: 80, minThreshold: 30, costPerUnit: 150, wastePercent: 1.2, siteAllocated: 40 },
];

type WasteStatus = 'Pending' | 'Approved' | 'Rejected';

const INITIAL_WASTE_LOGS = [
  { id: 'W-001', skuId: 'CEM-002', quantity: 20, reason: 'Water Damage', reportedBy: 'Site Engineer', status: 'Pending' as WasteStatus, value: 160 },
  { id: 'W-002', skuId: 'STL-001', quantity: 5, reason: 'Cutting Error', reportedBy: 'Warehouse Manager', status: 'Approved' as WasteStatus, value: 6000 },
];

const INITIAL_MOVEMENTS = [
  { id: 'M-001', date: '2026-02-23 09:00', skuId: 'STL-001', type: 'Increase', quantity: 100, value: 120000, user: 'Warehouse Manager' },
  { id: 'M-002', date: '2026-02-22 14:30', skuId: 'CEM-002', type: 'Allocation', quantity: -50, value: -400, user: 'Warehouse Manager' },
];

const INITIAL_ALLOCATIONS = [
  { id: 'A-001', site: 'Site A - Downtown Tower', skuId: 'STL-001', allocated: 100, consumed: 80 },
  { id: 'A-002', site: 'Site B - Riverside Complex', skuId: 'CEM-002', allocated: 500, consumed: 450 },
];

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function InventoryDashboard() {
  // STATE MANAGERS
  const [currentRole, setCurrentRole] = useState<'Super Admin' | 'Warehouse Manager' | 'Site Engineer' | 'Finance Controller'>('Super Admin');
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [skus, setSkus] = useState(INITIAL_SKUS);
  const [wasteLogs, setWasteLogs] = useState(INITIAL_WASTE_LOGS);
  const [movements, setMovements] = useState(INITIAL_MOVEMENTS);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);

  // MODAL STATES
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isWasteOpen, setIsWasteOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // FORM STATES (Temporaries)
  const [formRegister, setFormRegister] = useState({ id: '', name: '', category: 'Raw Materials', unit: '', stock: 0, minThreshold: 10, costPerUnit: 0 });
  const [formAdjust, setFormAdjust] = useState({ skuId: '', type: 'Increase', quantity: 0 });
  const [formWaste, setFormWaste] = useState({ skuId: '', quantity: 0, reason: '' });
  const [formAllocate, setFormAllocate] = useState({ site: '', skuId: '', quantity: 0 });
  const [formSettings, setFormSettings] = useState({ ...INITIAL_SETTINGS });

  // ROLE PERMISSIONS
  const canEditSku = currentRole === 'Super Admin';
  const canChangeSettings = currentRole === 'Super Admin';
  const canOverrideApprovals = currentRole === 'Super Admin';

  const canAdjustStock = currentRole === 'Super Admin' || currentRole === 'Warehouse Manager';
  const canRegisterSku = currentRole === 'Super Admin' || currentRole === 'Warehouse Manager';
  const canAllocateToSite = currentRole === 'Super Admin' || currentRole === 'Warehouse Manager';

  const canReportWaste = currentRole === 'Super Admin' || currentRole === 'Site Engineer' || currentRole === 'Warehouse Manager';
  const canApproveWriteOffs = currentRole === 'Super Admin' || currentRole === 'Finance Controller';

  // COMPUTED METRICS
  const metrics = useMemo(() => {
    let lowStock = 0;
    let criticalStock = 0;
    let holdingValue = 0;
    let siteAllocatedValue = 0;
    let totalWasteUnits = 0;

    skus.forEach(s => {
      if (s.stock === 0) criticalStock++;
      else if (s.stock < s.minThreshold) lowStock++;
      holdingValue += s.stock * s.costPerUnit;
      siteAllocatedValue += s.siteAllocated * s.costPerUnit;
    });

    // Total waste this month
    const thisMonthWaste = wasteLogs.reduce((sum, log) => sum + log.quantity, 0);
    const thisMonthWasteValue = wasteLogs.reduce((sum, log) => sum + log.value, 0);

    // Overall waste percentage logic (for system alert)
    const overallWastePct = siteAllocatedValue > 0 ? (thisMonthWasteValue / siteAllocatedValue) * 100 : 0;
    const isWasteCritical = overallWastePct > settings.wasteTolerancePercent;

    return {
      totalSkus: skus.length,
      lowStock,
      criticalStock,
      holdingValue,
      siteAllocatedValue,
      thisMonthWaste,
      thisMonthWasteValue,
      overallWastePct,
      isWasteCritical
    };
  }, [skus, wasteLogs, settings]);

  // ACTION LOGIC
  const logMovement = (skuId: string, type: string, qty: number, val: number) => {
    setMovements(prev => [
      { id: `M-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), skuId, type: type as any, quantity: qty, value: val, user: currentRole },
      ...prev
    ]);
  };

  const handleRegisterSku = () => {
    if (!canRegisterSku) return;
    setSkus([...skus, { ...formRegister, wastePercent: 0, siteAllocated: 0 }]);
    toast.success(`Registered SKU: ${formRegister.id}`);
    setIsRegisterOpen(false);
  };

  const handleAdjustStock = () => {
    if (!canAdjustStock) return;
    const sku = skus.find(s => s.id === formAdjust.skuId);
    if (!sku) return toast.error("Select a SKU");

    const qty = Number(formAdjust.quantity);
    if (qty <= 0) return toast.error("Quantity must be positive");

    let newStock = sku.stock;
    if (formAdjust.type === 'Increase') newStock += qty;
    else {
      if (sku.stock < qty) return toast.error("Insufficient stock");
      newStock -= qty;
    }

    setSkus(skus.map(s => s.id === sku.id ? { ...s, stock: newStock } : s));
    const valueImpact = qty * sku.costPerUnit * (formAdjust.type === 'Increase' ? 1 : -1);
    logMovement(sku.id, formAdjust.type, formAdjust.type === 'Increase' ? qty : -qty, valueImpact);

    toast.success(`Stock adjusted for ${sku.id}`);
    setIsAdjustOpen(false);
  };

  const handleReportWaste = () => {
    if (!canReportWaste) return;
    const sku = skus.find(s => s.id === formWaste.skuId);
    if (!sku) return toast.error("Select a SKU");

    const qty = Number(formWaste.quantity);
    if (qty <= 0) return toast.error("Quantity must be positive");

    if (sku.stock < qty) return toast.error("Waste cannot exceed current stock");

    const value = qty * sku.costPerUnit;
    let status: WasteStatus = 'Approved';

    // Auto deduct stock
    setSkus(skus.map(s => s.id === sku.id ? { ...s, stock: s.stock - qty } : s));
    logMovement(sku.id, 'Waste', -qty, -value);

    // Write-off approval logic
    if (value > settings.writeOffApprovalThreshold) {
      status = 'Pending';
      toast.info(`Waste value ${formatCurrency(value)} exceeds threshold. Sent to Finance for approval.`);
    } else {
      toast.success("Waste reported and auto-approved.");
    }

    setWasteLogs([{
      id: `W-${Date.now()}`, skuId: sku.id, quantity: qty, reason: formWaste.reason, reportedBy: currentRole, status, value
    }, ...wasteLogs]);

    setIsWasteOpen(false);
  };

  const handleAllocate = () => {
    if (!canAllocateToSite) return;
    const sku = skus.find(s => s.id === formAllocate.skuId);
    if (!sku) return toast.error("Select a SKU");
    if (!formAllocate.site) return toast.error("Enter a site");

    const qty = Number(formAllocate.quantity);
    if (qty <= 0) return toast.error("Quantity must be positive");
    if (sku.stock < qty) return toast.error("Insufficient central stock");

    setSkus(skus.map(s => s.id === sku.id ? { ...s, stock: s.stock - qty, siteAllocated: s.siteAllocated + qty } : s));
    logMovement(sku.id, 'Allocation', -qty, -qty * sku.costPerUnit);

    const existing = allocations.find(a => a.skuId === sku.id && a.site === formAllocate.site);
    if (existing) {
      setAllocations(allocations.map(a => a.id === existing.id ? { ...a, allocated: a.allocated + qty } : a));
    } else {
      setAllocations([...allocations, { id: `A-${Date.now()}`, site: formAllocate.site, skuId: sku.id, allocated: qty, consumed: 0 }]);
    }

    toast.success(`Allocated ${qty} units of ${sku.id} to ${formAllocate.site}`);
    setIsAllocateOpen(false);
  };

  const handleApproveWaste = (logId: string, approve: boolean) => {
    if (!canApproveWriteOffs) return;
    setWasteLogs(logs => logs.map(l => l.id === logId ? { ...l, status: approve ? 'Approved' : 'Rejected' } : l));
    // Provide stock back if rejected
    const log = wasteLogs.find(l => l.id === logId);
    if (!approve && log) {
      setSkus(skus.map(s => s.id === log.skuId ? { ...s, stock: s.stock + log.quantity } : s));
      logMovement(log.skuId, 'Increase (Rejection Reversal)', log.quantity, log.value);
      toast.success("Waste record rejected. Stock reverted.");
    } else {
      toast.success("Waste record approved. Write-off logged.");
    }
  };

  const handleSaveSettings = () => {
    if (!canChangeSettings) return;
    setSettings(formSettings);
    toast.success("Global inventory settings updated.");
    setIsSettingsOpen(false);
  };

  // HELPER: Permission Wrapper
  const renderAction = (condition: boolean, button: React.ReactNode, tooltip: string) => {
    if (condition) return button;
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed opacity-50 pointer-events-none">
              {button}
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs bg-destructive text-destructive-foreground">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6 pb-12 font-sans -mx-4 md:-mx-8 -mt-4 md:-mt-8 text-foreground min-h-screen relative">

        {/* HEADER AREA */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-sm px-4 md:px-8 py-4">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">

            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full lg:w-auto overflow-hidden">
              <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-md hidden md:flex items-center justify-center">
                <Package className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-foreground truncate">Inventory Control</h1>
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200">LIVE MOCK</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Users className="h-3.5 w-3.5" />
                  Role Logic Simulator:
                  <Select value={currentRole} onValueChange={(val: any) => setCurrentRole(val)}>
                    <SelectTrigger className="h-6 px-2 border-primary/20 bg-primary/5 text-primary text-xs w-40 font-bold ml-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                      <SelectItem value="Site Engineer">Site Engineer</SelectItem>
                      <SelectItem value="Finance Controller">Finance Controller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm relative hidden lg:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search SKU, mock data..." className="w-full pl-9 h-9 bg-muted/50 rounded-md text-xs font-medium border-border" />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 overflow-x-auto pb-2 lg:pb-0">
              {renderAction(canRegisterSku,
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild><Button size="sm" className="h-8 text-[11px] font-bold"><Plus className="h-3.5 w-3.5 mr-1" /> Register Material</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Register New SKU</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-1"><Label className="text-xs">SKU ID</Label><Input value={formRegister.id} onChange={e => setFormRegister({ ...formRegister, id: e.target.value })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={formRegister.name} onChange={e => setFormRegister({ ...formRegister, name: e.target.value })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Category</Label><Input value={formRegister.category} onChange={e => setFormRegister({ ...formRegister, category: e.target.value })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Unit</Label><Input value={formRegister.unit} onChange={e => setFormRegister({ ...formRegister, unit: e.target.value })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Initial Stock</Label><Input type="number" value={formRegister.stock} onChange={e => setFormRegister({ ...formRegister, stock: Number(e.target.value) })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Cost per Unit ($)</Label><Input type="number" value={formRegister.costPerUnit} onChange={e => setFormRegister({ ...formRegister, costPerUnit: Number(e.target.value) })} className="text-xs" /></div>
                    </div>
                    <DialogFooter><Button onClick={handleRegisterSku} className="w-full text-xs" disabled={!formRegister.id}>Save SKU</Button></DialogFooter>
                  </DialogContent>
                </Dialog>,
                "Restricted to Warehouse Manager / Admin"
              )}

              {renderAction(canAdjustStock,
                <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                  <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 text-[11px] font-bold"><ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Adjust Stock</Button></DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Adjust Central Stock</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Select SKU</Label>
                        <Select onValueChange={v => setFormAdjust({ ...formAdjust, skuId: v })}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
                          <SelectContent>{skus.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.id}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select value={formAdjust.type} onValueChange={v => setFormAdjust({ ...formAdjust, type: v })}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Increase">Increase</SelectItem><SelectItem value="Deduct">Deduct</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-xs">Qty</Label><Input type="number" onChange={e => setFormAdjust({ ...formAdjust, quantity: Number(e.target.value) })} className="text-xs" /></div>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleAdjustStock} className="w-full text-xs">Execute Adjustment</Button></DialogFooter>
                  </DialogContent>
                </Dialog>,
                "Restricted to Warehouse Manager / Admin"
              )}

              {renderAction(canChangeSettings,
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><SettingsIcon className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Inventory System Settings</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1"><Label className="text-xs">System Waste Tolerance (%)</Label><Input type="number" value={formSettings.wasteTolerancePercent} onChange={e => setFormSettings({ ...formSettings, wasteTolerancePercent: Number(e.target.value) })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Write-Off Approval Threshold ($)</Label><Input type="number" value={formSettings.writeOffApprovalThreshold} onChange={e => setFormSettings({ ...formSettings, writeOffApprovalThreshold: Number(e.target.value) })} className="text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">Global Low Stock Baseline</Label><Input type="number" value={formSettings.lowStockThreshold} onChange={e => setFormSettings({ ...formSettings, lowStockThreshold: Number(e.target.value) })} className="text-xs" /></div>
                    </div>
                    <DialogFooter><Button onClick={handleSaveSettings} className="w-full text-xs">Save Settings</Button></DialogFooter>
                  </DialogContent>
                </Dialog>,
                "Restricted to Super Admin"
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-6 pt-6">

          {/* CRITICAL ALERTS */}
          {metrics.isWasteCritical && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Critical Waste Velocity Detected</AlertTitle>
              <AlertDescription className="text-xs font-medium mt-1">
                Current systemic waste level ({metrics.overallWastePct.toFixed(1)}%) exceeds the global tolerance threshold of {settings.wasteTolerancePercent}%. Finance & Admin interventions recommended.
              </AlertDescription>
            </Alert>
          )}

          {/* METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card className="shadow-xs"><CardContent className="p-4 flex flex-col justify-center h-full"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total SKUs</p><span className="text-2xl font-black">{metrics.totalSkus}</span></CardContent></Card>
            <Card className="shadow-xs"><CardContent className="p-4 flex flex-col justify-center h-full"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Holding Value</p><span className="text-xl font-black">{formatCurrency(metrics.holdingValue)}</span></CardContent></Card>
            <Card className="shadow-xs"><CardContent className="p-4 flex flex-col justify-center h-full"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Allocated Value</p><span className="text-xl font-black text-blue-600">{formatCurrency(metrics.siteAllocatedValue)}</span></CardContent></Card>
            <Card className={cn("shadow-xs", metrics.lowStock > 0 && "border-amber-200 bg-amber-50/10")}><CardContent className="p-4 flex flex-col justify-center h-full"><p className={cn("text-[10px] font-bold uppercase mb-1", metrics.lowStock > 0 ? "text-amber-600" : "text-muted-foreground")}>Low Stock Items</p><span className={cn("text-2xl font-black", metrics.lowStock > 0 && "text-amber-600")}>{metrics.lowStock}</span></CardContent></Card>
            <Card className={cn("shadow-xs", metrics.criticalStock > 0 && "border-rose-200 bg-rose-50/10")}><CardContent className="p-4 flex flex-col justify-center h-full"><p className={cn("text-[10px] font-bold uppercase mb-1", metrics.criticalStock > 0 ? "text-rose-600" : "text-muted-foreground")}>Critical Stockouts</p><span className={cn("text-2xl font-black", metrics.criticalStock > 0 && "text-rose-600")}>{metrics.criticalStock}</span></CardContent></Card>
            <Card className={cn("shadow-xs", metrics.isWasteCritical && "border-rose-200 bg-rose-50/10")}><CardContent className="p-4 flex flex-col justify-center h-full"><p className={cn("text-[10px] font-bold uppercase mb-1", metrics.isWasteCritical ? "text-rose-600" : "text-muted-foreground")}>Waste Tolerance</p><span className={cn("text-xl font-black", metrics.isWasteCritical && "text-rose-600")}>{metrics.overallWastePct.toFixed(1)}% <span className="text-xs text-muted-foreground font-normal">/ {settings.wasteTolerancePercent}%</span></span></CardContent></Card>
          </div>

          <Tabs defaultValue="catalog" className="w-full space-y-6">
            <TabsList className="bg-background border-border/50 border overflow-x-auto justify-start h-10 w-full rounded-md px-1 flex-nowrap shadow-sm">
              <TabsTrigger value="catalog" className="text-xs font-bold"><Package className="h-3.5 w-3.5 mr-1.5" />Master Catalog</TabsTrigger>
              <TabsTrigger value="movement" className="text-xs font-bold"><ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />Stock Movement</TabsTrigger>
              <TabsTrigger value="wastage" className="text-xs font-bold"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Waste Management</TabsTrigger>
              <TabsTrigger value="allocation" className="text-xs font-bold"><MapPin className="h-3.5 w-3.5 mr-1.5" />Site Allocation</TabsTrigger>
            </TabsList>

            {/* TAB 1: MASTER CATALOG */}
            <TabsContent value="catalog" className="m-0 border-none p-0">
              <Card className="shadow-xs border-border/60">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold">Catalog Dashboard</h3>
                  {/* Additional buttons could go here */}
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold uppercase">SKU</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Asset Name</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Live Stock</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Min Threshold</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Waste %</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Holding Val</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Status</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skus.map(s => {
                      const isZero = s.stock === 0;
                      const isLow = s.stock > 0 && s.stock < s.minThreshold;
                      const overWaste = s.wastePercent > settings.wasteTolerancePercent;

                      return (
                        <TableRow key={s.id}>
                          <TableCell className="py-3 font-mono text-xs font-bold text-primary">{s.id}</TableCell>
                          <TableCell className="py-3">
                            <p className="text-sm font-bold">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{s.category} • {s.unit}</p>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <span className={cn("text-lg font-black", isZero ? "text-rose-600" : isLow ? "text-amber-600" : "")}>{s.stock}</span>
                          </TableCell>
                          <TableCell className="py-3 text-center text-xs text-muted-foreground">{s.minThreshold}</TableCell>
                          <TableCell className="py-3 text-center text-xs">
                            <Badge variant="outline" className={cn("bg-transparent border", overWaste && "border-rose-500 text-rose-600 bg-rose-50")}>{s.wastePercent.toFixed(1)}%</Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right font-mono text-sm">{formatCurrency(s.stock * s.costPerUnit)}</TableCell>
                          <TableCell className="py-3 text-center">
                            {isZero ? <Badge variant="destructive" className="bg-rose-500 text-[10px]">CRITICAL</Badge> :
                              isLow ? <Badge className="bg-amber-500 text-[10px] hover:bg-amber-600">LOW</Badge> :
                                <Badge className="bg-emerald-500 text-[10px] hover:bg-emerald-600">HEALTHY</Badge>}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {canEditSku ? <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={() => toast.info('Edit SKU functionality available to Admin.')}>Edit</Button> : <span className="text-[10px] text-muted-foreground">Read Only</span>}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB 2: STOCK MOVEMENT */}
            <TabsContent value="movement" className="m-0 border-none p-0">
              <Card className="shadow-xs border-border/60">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-bold">Immutable Ledger Log</h3>
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold uppercase">Date & Time</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">SKU</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Operation Type</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Quantity</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Value Impact</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Executed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="py-3 text-[11px] text-muted-foreground">{m.date}</TableCell>
                        <TableCell className="py-3 font-mono font-bold text-xs">{m.skuId}</TableCell>
                        <TableCell className="py-3 text-xs">
                          <Badge variant="outline" className="uppercase text-[9px] font-black">{m.type}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm">
                          <span className={cn("font-bold", m.quantity > 0 ? "text-emerald-600" : "text-rose-600")}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-mono font-bold">{m.value > 0 ? '+' : ''}{formatCurrency(m.value)}</TableCell>
                        <TableCell className="py-3 text-right text-[10px] text-muted-foreground">{m.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB 3: WASTE MANAGEMENT */}
            <TabsContent value="wastage" className="m-0 border-none p-0 border">
              <Card className="shadow-xs border-border/60">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2"><Trash2 className="h-4 w-4" /> Loss & Write-Off Ledger</h3>
                    <p className="text-xs text-muted-foreground mt-1">Total Waste Value (This Month): <span className="font-bold text-foreground">{formatCurrency(metrics.thisMonthWasteValue)}</span></p>
                  </div>
                  {renderAction(canReportWaste,
                    <Dialog open={isWasteOpen} onOpenChange={setIsWasteOpen}>
                      <DialogTrigger asChild><Button size="sm" variant="destructive" className="h-8 text-[11px] font-bold"><Plus className="h-3.5 w-3.5 mr-1" /> Report Waste</Button></DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Report Material Loss / Waste</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-1">
                            <Label className="text-xs">SKU</Label>
                            <Select onValueChange={v => setFormWaste({ ...formWaste, skuId: v })}>
                              <SelectTrigger className="text-xs"><SelectValue placeholder="Select SKU" /></SelectTrigger>
                              <SelectContent>{skus.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.id}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1"><Label className="text-xs">Quantity Lost</Label><Input type="number" onChange={e => setFormWaste({ ...formWaste, quantity: Number(e.target.value) })} className="text-xs" /></div>
                          <div className="space-y-1"><Label className="text-xs">Reason/Root Cause</Label><Input onChange={e => setFormWaste({ ...formWaste, reason: e.target.value })} className="text-xs" /></div>
                          <p className="text-[10px] text-muted-foreground">Losses over ${settings.writeOffApprovalThreshold} will pend Finance Approval automatically.</p>
                        </div>
                        <DialogFooter><Button onClick={handleReportWaste} variant="destructive" className="w-full text-xs" disabled={!formWaste.skuId || !formWaste.quantity}>Log Waste Record</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>,
                    "Role lacks waste reporting permissions."
                  )}
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold uppercase">Log ID</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">SKU</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Reason</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Reporter</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Lost Qty</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-right">Financial Impact</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wasteLogs.map(w => (
                      <TableRow key={w.id}>
                        <TableCell className="py-3 font-mono text-xs text-muted-foreground">{w.id}</TableCell>
                        <TableCell className="py-3 font-mono font-bold text-xs">{w.skuId}</TableCell>
                        <TableCell className="py-3 text-xs">{w.reason}</TableCell>
                        <TableCell className="py-3 text-[10px] text-muted-foreground">{w.reportedBy}</TableCell>
                        <TableCell className="py-3 text-right text-sm font-black text-rose-600">-{w.quantity}</TableCell>
                        <TableCell className="py-3 text-right text-sm font-mono font-bold">{formatCurrency(w.value)}</TableCell>
                        <TableCell className="py-3 text-center">
                          {w.status === 'Pending' ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] uppercase">PENDING FINANCE</Badge>
                              {canApproveWriteOffs && (
                                <div className="flex gap-1 mt-1">
                                  <Button size="icon" variant="outline" className="h-5 w-5 rounded-full border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" onClick={() => handleApproveWaste(w.id, true)}><Check className="h-3 w-3" /></Button>
                                  <Button size="icon" variant="outline" className="h-5 w-5 rounded-full border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => handleApproveWaste(w.id, false)}><X className="h-3 w-3" /></Button>
                                </div>
                              )}
                            </div>
                          ) : w.status === 'Approved' ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none text-[9px] uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> APPROVED</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-none text-[9px] uppercase">REJECTED</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB 4: SITE ALLOCATION */}
            <TabsContent value="allocation" className="m-0 border-none p-0">
              <Card className="shadow-xs border-border/60">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">Site Project Bindings</h3>
                    <p className="text-xs text-muted-foreground mt-1">Deduct central stock by assigning directly to live construction sites.</p>
                  </div>
                  {renderAction(canAllocateToSite,
                    <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
                      <DialogTrigger asChild><Button size="sm" className="h-8 text-[11px] font-bold"><MapPin className="h-3.5 w-3.5 mr-1" /> Allocate Stock</Button></DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>New Site Allocation</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Select Target Site</Label>
                            <Select onValueChange={v => setFormAllocate({ ...formAllocate, site: v })}>
                              <SelectTrigger className="text-xs"><SelectValue placeholder="Project Site" /></SelectTrigger>
                              <SelectContent><SelectItem value="Site A - Downtown Tower">Site A - Downtown Tower</SelectItem><SelectItem value="Site B - Riverside Complex">Site B - Riverside Complex</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SKU to Allocate</Label>
                            <Select onValueChange={v => setFormAllocate({ ...formAllocate, skuId: v })}>
                              <SelectTrigger className="text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
                              <SelectContent>{skus.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.id}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1"><Label className="text-xs">Quantity</Label><Input type="number" onChange={e => setFormAllocate({ ...formAllocate, quantity: Number(e.target.value) })} className="text-xs" /></div>
                        </div>
                        <DialogFooter><Button onClick={handleAllocate} className="w-full text-xs">Push Allocation to Site</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>,
                    "Role lacks allocation permissions."
                  )}
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold uppercase">Destination Site</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Linked SKU</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Total Allocated</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Reported Consumption</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-center">Burn %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map(a => {
                      const pct = a.allocated > 0 ? (a.consumed / a.allocated) * 100 : 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="py-4 text-sm font-bold">{a.site}</TableCell>
                          <TableCell className="py-4 text-xs font-mono font-bold text-primary">{a.skuId}</TableCell>
                          <TableCell className="py-4 text-center text-sm font-bold">{a.allocated}</TableCell>
                          <TableCell className="py-4 text-center text-sm">{a.consumed}</TableCell>
                          <TableCell className="py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Progress value={pct} className="w-16 h-1.5" />
                              <span className="text-[9px] text-muted-foreground font-medium">{pct.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </DashboardShell>
  );
}
