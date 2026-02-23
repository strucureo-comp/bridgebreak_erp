"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  AlertCircle, AlertTriangle, ArrowRightLeft, Building,
  Check, CheckCircle2, ChevronDown, PackagePlus, PackageSearch,
  Search, Settings, Trash2, X, Factory, DollarSign, Activity
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// --- Mock Data Initialization ---

const initialSettings = {
  wasteTolerancePercent: 5,
  writeOffApprovalThreshold: 5000,
  lowStockThreshold: 20,
};

const initialSkus = [
  {
    id: "STL-001",
    name: "Structural Steel H-Beam",
    category: "Raw Materials",
    unit: "Tons",
    stock: 250,
    minThreshold: 50,
    costPerUnit: 1200,
    wastePercent: 2.0,
    siteAllocated: 100
  },
  {
    id: "CMT-102",
    name: "Portland Cement",
    category: "Raw Materials",
    unit: "Bags",
    stock: 15,
    minThreshold: 100,
    costPerUnit: 8,
    wastePercent: 6.5,
    siteAllocated: 400
  },
  {
    id: "BRK-050",
    name: "Red Clay Bricks",
    category: "Materials",
    unit: "Pallets",
    stock: 0,
    minThreshold: 20,
    costPerUnit: 150,
    wastePercent: 1.2,
    siteAllocated: 50
  }
];

const initialWasteLogs = [
  {
    id: "W-1001",
    skuId: "STL-001",
    quantity: 2,
    reason: "Damaged during transport",
    reportedBy: "siteEngineer",
    status: "Pending", // "Pending", "Pending Finance", "Approved", "Rejected"
    date: new Date().toISOString()
  },
  {
    id: "W-1002",
    skuId: "CMT-102",
    quantity: 700,
    reason: "Water damage at warehouse",
    reportedBy: "warehouseManager",
    status: "Pending Finance",
    date: new Date().toISOString()
  }
];

const initialMovements = [
  {
    id: "M-2001",
    timestamp: new Date().toISOString(),
    type: "Increase",
    skuId: "STL-001",
    quantity: 100,
    user: "warehouseManager",
    notes: "Restock"
  }
];

const SITES = ["Site A", "Site B", "Site C", "HQ Warehouse"];

// --- Roles & Permissions ---

const ROLES = [
  { id: "superAdmin", name: "Super Admin" },
  { id: "warehouseManager", name: "Warehouse Manager" },
  { id: "siteEngineer", name: "Site Engineer" },
  { id: "financeController", name: "Finance Controller" },
];

const PERMISSIONS = {
  superAdmin: {
    canEditSku: true, canOverride: true, canChangeSettings: true,
    canAdjustStock: true, canRegisterSku: true, canAllocate: true,
    canReportWaste: true, canApproveWaste: true, canApproveFinance: true
  },
  warehouseManager: {
    canEditSku: false, canOverride: false, canChangeSettings: false,
    canAdjustStock: true, canRegisterSku: true, canAllocate: true,
    canReportWaste: true, canApproveWaste: true, canApproveFinance: false
  },
  siteEngineer: {
    canEditSku: false, canOverride: false, canChangeSettings: false,
    canAdjustStock: false, canRegisterSku: false, canAllocate: true, // Instructions: "can request materials" / we use allocate modal for this
    canReportWaste: true, canApproveWaste: false, canApproveFinance: false
  },
  financeController: {
    canEditSku: false, canOverride: false, canChangeSettings: false,
    canAdjustStock: false, canRegisterSku: false, canAllocate: false,
    canReportWaste: false, canApproveWaste: false, canApproveFinance: true
  }
};

export default function InventoryControlPage() {
  const [currentRole, setCurrentRole] = useState("warehouseManager");
  const role = PERMISSIONS[currentRole as keyof typeof PERMISSIONS];

  // State
  const [settings, setSettings] = useState(initialSettings);
  const [skus, setSkus] = useState(initialSkus);
  const [wasteLogs, setWasteLogs] = useState(initialWasteLogs);
  const [movements, setMovements] = useState(initialMovements);
  const [allocations, setAllocations] = useState<{ id: string, site: string, skuId: string, quantity: number, date: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  // Modals Default State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isWasteOpen, setIsWasteOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form States
  const [skuForm, setSkuForm] = useState({ id: "", name: "", category: "Raw Materials", unit: "Units", minThreshold: 10, costPerUnit: 0 });
  const [adjustForm, setAdjustForm] = useState({ skuId: "", type: "Increase", quantity: 0, reason: "" });
  const [wasteForm, setWasteForm] = useState({ skuId: "", quantity: 0, reason: "" });
  const [allocateForm, setAllocateForm] = useState({ skuId: "", site: SITES[0], quantity: 0 });
  const [settingsForm, setSettingsForm] = useState(initialSettings);

  // --- Computed Metrics ---
  const totalSkus = skus.length;
  const lowStockCount = skus.filter(s => s.stock > 0 && s.stock < s.minThreshold).length;
  const criticalStockouts = skus.filter(s => s.stock === 0).length;
  const totalHoldingValue = skus.reduce((acc, s) => acc + (s.stock * s.costPerUnit), 0);
  const allocatedToSites = skus.reduce((acc, s) => acc + s.siteAllocated, 0);

  const currentMonthWasteValue = wasteLogs
    .filter(w => w.status === "Approved")
    .reduce((acc, w) => {
      const sku = skus.find(s => s.id === w.skuId);
      return acc + (w.quantity * (sku?.costPerUnit || 0));
    }, 0);

  const avgWastePercent = skus.length ? skus.reduce((acc, s) => acc + s.wastePercent, 0) / skus.length : 0;
  const isWasteOverTolerance = avgWastePercent > settings.wasteTolerancePercent;

  // --- Actions ---
  const handleRegisterSku = () => {
    if (!skuForm.id || !skuForm.name) {
      toast.error("Please fill in SKU ID and Name.");
      return;
    }
    if (skus.find(s => s.id === skuForm.id)) {
      toast.error("SKU ID already exists.");
      return;
    }

    setSkus([...skus, {
      ...skuForm,
      stock: 0,
      wastePercent: 0,
      siteAllocated: 0,
    }]);

    toast.success(`SKU ${skuForm.id} registered successfully.`);
    setIsRegisterOpen(false);
    setSkuForm({ id: "", name: "", category: "Raw Materials", unit: "Units", minThreshold: 10, costPerUnit: 0 });
  };

  const handleAdjustStock = () => {
    if (!adjustForm.skuId || !adjustForm.quantity || adjustForm.quantity <= 0) {
      toast.error("Invalid adjustment data.");
      return;
    }

    const skuIndex = skus.findIndex(s => s.id === adjustForm.skuId);
    if (skuIndex === -1) return;

    const sku = skus[skuIndex];
    if (adjustForm.type === "Deduct" && sku.stock < adjustForm.quantity) {
      toast.error(`Cannot deduct ${adjustForm.quantity}. Only ${sku.stock} in stock.`);
      return;
    }

    const newStock = adjustForm.type === "Increase"
      ? sku.stock + adjustForm.quantity
      : sku.stock - adjustForm.quantity;

    const updatedSkus = [...skus];
    updatedSkus[skuIndex] = { ...sku, stock: newStock };
    setSkus(updatedSkus);

    setMovements([{
      id: `M-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      type: adjustForm.type,
      skuId: sku.id,
      quantity: adjustForm.quantity,
      user: currentRole,
      notes: adjustForm.reason
    }, ...movements]);

    toast.success(`Stock adjusted for ${sku.id}.`);
    setIsAdjustOpen(false);
    setAdjustForm({ skuId: "", type: "Increase", quantity: 0, reason: "" });
  };

  const handleReportWaste = () => {
    if (!wasteForm.skuId || !wasteForm.quantity || wasteForm.quantity <= 0) {
      toast.error("Invalid waste report.");
      return;
    }

    const sku = skus.find(s => s.id === wasteForm.skuId);
    if (!sku) return;

    if (sku.stock < wasteForm.quantity) {
      toast.error("Waste quantity cannot exceed current stock.");
      return;
    }

    const costImpact = wasteForm.quantity * sku.costPerUnit;
    const isApprovalNeeded = costImpact > settings.writeOffApprovalThreshold;
    const initialStatus = isApprovalNeeded ? "Pending Finance" : "Pending";

    const newWaste = {
      id: `W-${Math.floor(Math.random() * 10000)}`,
      skuId: sku.id,
      quantity: wasteForm.quantity,
      reason: wasteForm.reason,
      reportedBy: currentRole,
      status: initialStatus,
      date: new Date().toISOString()
    };

    setWasteLogs([newWaste, ...wasteLogs]);
    toast.success(`Waste reported. Status: ${initialStatus}.`);
    setIsWasteOpen(false);
    setWasteForm({ skuId: "", quantity: 0, reason: "" });
  };

  const handleAllocate = () => {
    if (!allocateForm.skuId || !allocateForm.quantity || allocateForm.quantity <= 0) {
      toast.error("Invalid allocation data.");
      return;
    }

    const skuIndex = skus.findIndex(s => s.id === allocateForm.skuId);
    if (skuIndex === -1) return;

    const sku = skus[skuIndex];
    if (sku.stock < allocateForm.quantity) {
      toast.error(`Insufficient central stock for allocation. Required: ${allocateForm.quantity}, Available: ${sku.stock}`);
      return;
    }

    // Deduct stock and add to siteAllocated
    const updatedSkus = [...skus];
    updatedSkus[skuIndex] = {
      ...sku,
      stock: sku.stock - allocateForm.quantity,
      siteAllocated: sku.siteAllocated + allocateForm.quantity
    };
    setSkus(updatedSkus);

    // Add Allocation Record
    setAllocations([{
      id: `A-${Math.floor(Math.random() * 10000)}`,
      site: allocateForm.site,
      skuId: sku.id,
      quantity: allocateForm.quantity,
      date: new Date().toISOString()
    }, ...allocations]);

    // Add Movement Log
    setMovements([{
      id: `M-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      type: "Allocation",
      skuId: sku.id,
      quantity: allocateForm.quantity,
      user: currentRole,
      notes: `Allocated to ${allocateForm.site}`
    }, ...movements]);

    toast.success(`Successfully allocated ${allocateForm.quantity} to ${allocateForm.site}.`);
    setIsAllocateOpen(false);
    setAllocateForm({ skuId: "", site: SITES[0], quantity: 0 });
  };

  const handleSaveSettings = () => {
    setSettings(settingsForm);
    toast.success("Settings updated successfully.");
    setIsSettingsOpen(false);
  };

  const handleApproveWaste = (logId: string, approve: boolean) => {
    const logIndex = wasteLogs.findIndex(w => w.id === logId);
    if (logIndex === -1) return;

    const log = wasteLogs[logIndex];
    if (log.status === "Approved" || log.status === "Rejected") {
      toast.error("Already processed.");
      return;
    }

    // Role check logic
    if (log.status === "Pending Finance" && !role.canApproveFinance && !role.canOverride) {
      toast.error("You lack permission to approve finance write-offs.");
      return;
    }
    if (log.status === "Pending" && !role.canApproveWaste && !role.canOverride) {
      toast.error("You lack permission to approve general waste logs.");
      return;
    }

    const updatedLogs = [...wasteLogs];
    updatedLogs[logIndex] = { ...log, status: approve ? "Approved" : "Rejected" };
    setWasteLogs(updatedLogs);

    if (approve) {
      // Deduct stock
      const skuIndex = skus.findIndex(s => s.id === log.skuId);
      if (skuIndex !== -1) {
        const updatedSkus = [...skus];
        const newStock = Math.max(0, updatedSkus[skuIndex].stock - log.quantity);
        updatedSkus[skuIndex] = { ...updatedSkus[skuIndex], stock: newStock };

        // Let's recalculate waste percentage dynamically for mock demo (simple approach)
        updatedSkus[skuIndex].wastePercent = Number(((updatedSkus[skuIndex].wastePercent + 0.5)).toFixed(2));
        setSkus(updatedSkus);
      }

      setMovements([{
        id: `M-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        type: "Waste",
        skuId: log.skuId,
        quantity: log.quantity,
        user: currentRole,
        notes: "Approved Waste Write-off"
      }, ...movements]);

      toast.success("Waste log approved and stock deducted.");
    } else {
      toast.info("Waste log rejected.");
    }
  };


  const filteredSkus = skus.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Factory className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Inventory Control</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">Manage centralized and site-allocated stock levels.</p>
                <Badge variant="secondary" className="hidden sm:inline-flex bg-muted text-foreground/80 font-medium">
                  Local Simulation
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium select-none">Acting As:</span>
              <Select value={currentRole} onValueChange={setCurrentRole}>
                <SelectTrigger className="h-10 w-[180px] bg-primary/5 border-border text-primary font-bold shadow-sm">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shadow-sm"
              onClick={() => {
                setSettingsForm(settings);
                setIsSettingsOpen(true);
              }}
              disabled={!role.canChangeSettings}
            >
              <Settings className="h-4 w-4 text-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">

          {/* Global Alerts */}
          {isWasteOverTolerance && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 border-red-200 bg-red-50 text-red-900">
              <AlertTriangle className="h-4 w-4" color="#b91c1c" />
              <AlertTitle className="font-semibold text-red-800">Critical Waste Exceeded</AlertTitle>
              <AlertDescription className="text-red-700">
                Company-wide waste threshold ({settings.wasteTolerancePercent}%) has been exceeded. Current average: {avgWastePercent.toFixed(1)}%. Immediate review advised.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search by SKU or Name..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button disabled={!role.canRegisterSku} onClick={() => setIsRegisterOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                <PackagePlus className="h-4 w-4 mr-2" /> Register Material
              </Button>
              <Button disabled={!role.canAdjustStock} onClick={() => setIsAdjustOpen(true)} variant="outline" className="bg-white">
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Stock Adjustment
              </Button>
              <Button disabled={!role.canAllocate} onClick={() => setIsAllocateOpen(true)} variant="outline" className="bg-white">
                <Building className="h-4 w-4 mr-2" /> Allocate to Site
              </Button>
              <Button disabled={!role.canReportWaste} onClick={() => setIsWasteOpen(true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-white">
                <Trash2 className="h-4 w-4 mr-2" /> Report Waste
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Card className="bg-white">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Total SKUs</CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground font-semibold">{totalSkus}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start space-y-0">
                <div>
                  <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Low Stock</CardDescription>
                  <CardTitle className="text-2xl font-bold text-orange-600">{lowStockCount}</CardTitle>
                </div>
                <div className="p-2 bg-orange-100/50 rounded-full">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white border-red-200">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start space-y-0">
                <div>
                  <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Critical (Zero)</CardDescription>
                  <CardTitle className="text-2xl font-bold text-red-600">{criticalStockouts}</CardTitle>
                </div>
                <div className="p-2 bg-red-100/50 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white col-span-1 md:col-span-2 lg:col-span-1 border-border">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start space-y-0">
                <div>
                  <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Holding Value</CardDescription>
                  <CardTitle className="text-2xl font-bold text-primary">${totalHoldingValue.toLocaleString()}</CardTitle>
                </div>
                <div className="p-2 bg-primary/15 rounded-full">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Allocated</CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground font-semibold">{allocatedToSites}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Waste Value (MTD)</CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground font-semibold">${currentMonthWasteValue.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Dynamic Tabs */}
          <Tabs defaultValue="master-catalog" className="w-full flex-grow flex flex-col">
            <TabsList className="bg-muted p-1 w-full flex justify-start pl-2 rounded-lg gap-1 border-b mb-6 overflow-x-auto">
              <TabsTrigger value="master-catalog" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Master Catalog</TabsTrigger>
              <TabsTrigger value="stock-movement" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Stock Movement Log</TabsTrigger>
              <TabsTrigger value="waste-management" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                Waste Approvals
                {wasteLogs.filter(w => w.status.includes('Pending')).length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {wasteLogs.filter(w => w.status.includes('Pending')).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="site-allocation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Site Allocations</TabsTrigger>
            </TabsList>

            <TabsContent value="master-catalog" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden">
              <Card className="rounded-xl border-border overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[100px] font-semibold text-muted-foreground">SKU</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Stock</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground hidden md:table-cell">Cost</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground hidden lg:table-cell">Value</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Waste %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSkus.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No SKUs found.</TableCell>
                        </TableRow>
                      )}
                      {filteredSkus.map((sku) => {
                        const isZero = sku.stock === 0;
                        const isLow = sku.stock > 0 && sku.stock < sku.minThreshold;
                        const value = sku.stock * sku.costPerUnit;

                        return (
                          <TableRow key={sku.id} className="hover:bg-background transition-colors">
                            <TableCell className="font-medium text-foreground">{sku.id}</TableCell>
                            <TableCell>
                              <div>{sku.name}</div>
                              <div className="text-xs text-muted-foreground">{sku.category}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{sku.stock} <span className="text-xs text-muted-foreground font-normal">{sku.unit}</span></div>
                              <Progress
                                value={Math.min(100, (sku.stock / (sku.minThreshold * 3)) * 100)}
                                className={`h-1.5 mt-2 ${isZero ? '[&>div]:bg-red-500 bg-red-100' : isLow ? '[&>div]:bg-orange-500 bg-orange-100' : '[&>div]:bg-emerald-500 bg-emerald-100'}`}
                              />
                            </TableCell>
                            <TableCell>
                              {isZero ? (
                                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Critical</Badge>
                              ) : isLow ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Low Stock</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Healthy</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground hidden md:table-cell">${sku.costPerUnit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium hidden lg:table-cell">${value.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <span className={sku.wastePercent > settings.wasteTolerancePercent ? "text-red-600 font-medium" : "text-muted-foreground"}>
                                {sku.wastePercent.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="stock-movement" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden">
              <Card className="rounded-xl border-border overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>User Role</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-muted-foreground">{format(new Date(mov.timestamp), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            mov.type === "Increase" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                              mov.type === "Deduct" ? "border-orange-200 text-orange-700 bg-orange-50" :
                                mov.type === "Waste" ? "border-red-200 text-red-700 bg-red-50" :
                                  "border-border text-primary bg-primary/10"
                          }>
                            {mov.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground font-semibold">{mov.skuId}</TableCell>
                        <TableCell className="text-right">{mov.type === "Increase" ? "+" : "-"}{mov.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{ROLES.find(r => r.id === mov.user)?.name || mov.user}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[200px]">{mov.notes}</TableCell>
                      </TableRow>
                    ))}
                    {movements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No stock movements recorded.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="waste-management" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wasteLogs.map(log => {
                  const sku = skus.find(s => s.id === log.skuId);
                  const value = sku ? sku.costPerUnit * log.quantity : 0;
                  const isOverThreshold = value > settings.writeOffApprovalThreshold;

                  return (
                    <Card key={log.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="font-mono bg-muted/40 text-muted-foreground">{log.id}</Badge>
                          <Badge variant={
                            log.status === "Approved" ? "default" :
                              log.status === "Rejected" ? "destructive" :
                                "secondary"
                          } className={
                            log.status === "Approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" :
                              log.status === "Pending Finance" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : ""
                          }>
                            {log.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground font-semibold flex justify-between">
                          <span>{log.skuId}</span>
                          <span className="text-red-600">- {log.quantity} unit(s)</span>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {sku?.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-2 border-b border-border">
                        <div>
                          <span className="font-medium text-muted-foreground">Reason:</span>
                          <p className="mt-1 line-clamp-2">{log.reason}</p>
                        </div>
                        <div className="flex justify-between items-center bg-muted/40 p-2 rounded-md">
                          <span className="font-medium text-muted-foreground">Loss Value:</span>
                          <span className="font-bold text-foreground font-semibold">${value.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground/60">
                          Reported by: {ROLES.find(r => r.id === log.reportedBy)?.name || log.reportedBy} on {format(new Date(log.date), "MMM dd")}
                        </div>
                      </CardContent>

                      {log.status.includes("Pending") && (
                        <CardFooter className="p-3 bg-muted/40 flex gap-2 justify-end rounded-b-xl">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleApproveWaste(log.id, false)}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={
                              (log.status === "Pending Finance" && !role.canApproveFinance && !role.canOverride) ||
                              (log.status === "Pending" && !role.canApproveWaste && !role.canOverride)
                            }
                            onClick={() => handleApproveWaste(log.id, true)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve Write-off
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
                {wasteLogs.length === 0 && (
                  <div className="col-span-full py-12 text-center flex flex-col items-center border-2 border-dashed border-border rounded-xl">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="text-muted-foreground font-medium">No waste logs recorded.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="site-allocation" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden">
              <Card className="rounded-xl border-border bg-white shadow-sm p-0 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Destination Site</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell className="text-muted-foreground">{format(new Date(alloc.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-medium text-foreground font-semibold">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary/70" />
                            {alloc.site}
                          </div>
                        </TableCell>
                        <TableCell>{alloc.skuId} - <span className="text-muted-foreground text-sm hidden sm:inline">{skus.find(s => s.id === alloc.skuId)?.name}</span></TableCell>
                        <TableCell className="text-right font-medium">{alloc.quantity}</TableCell>
                      </TableRow>
                    ))}
                    {allocations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No site allocations recorded yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* MODALS */}

        {/* Register SKU Dialog */}
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Register Material</DialogTitle>
              <DialogDescription>
                Add a new SKU to the central inventory catalog.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="skuId">SKU ID</Label>
                <Input id="skuId" placeholder="e.g. WOOD-001" value={skuForm.id} onChange={e => setSkuForm({ ...skuForm, id: e.target.value.toUpperCase() })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="skuName">Material Name</Label>
                <Input id="skuName" placeholder="e.g. Treated Plywood" value={skuForm.name} onChange={e => setSkuForm({ ...skuForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={skuForm.category} onValueChange={v => setSkuForm({ ...skuForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="skuUnit">Unit</Label>
                  <Input id="skuUnit" placeholder="e.g. Sheets" value={skuForm.unit} onChange={e => setSkuForm({ ...skuForm, unit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minThresh">Min Threshold</Label>
                  <Input type="number" id="minThresh" min="0" value={skuForm.minThreshold} onChange={e => setSkuForm({ ...skuForm, minThreshold: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost Per Unit ($)</Label>
                  <Input type="number" id="cost" min="0" value={skuForm.costPerUnit} onChange={e => setSkuForm({ ...skuForm, costPerUnit: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
              <Button onClick={handleRegisterSku} className="bg-primary hover:bg-primary/90 text-white">Save SKU</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Stock Dialog */}
        <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-primary" /> Stock Adjustment</DialogTitle>
              <DialogDescription>
                Record a manual increase or deduction for a specific SKU.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Target SKU</Label>
                <Select value={adjustForm.skuId} onValueChange={v => setAdjustForm({ ...adjustForm, skuId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Material" /></SelectTrigger>
                  <SelectContent>
                    {skus.map(s => <SelectItem key={s.id} value={s.id}>{s.id} · {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Action Type</Label>
                  <Select value={adjustForm.type} onValueChange={v => setAdjustForm({ ...adjustForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Increase">Increase (+)</SelectItem>
                      <SelectItem value="Deduct">Deduct (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Reason / Notes</Label>
                <Input placeholder="e.g. Audit correction, Supplier delivery..." value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
              <Button onClick={handleAdjustStock} className="bg-primary hover:bg-primary/90 text-white">Confirm Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Waste Dialog */}
        <Dialog open={isWasteOpen} onOpenChange={setIsWasteOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Report Waste</DialogTitle>
              <DialogDescription>
                Log damaged or lost material. Write-offs over ${settings.writeOffApprovalThreshold} require Finance approval.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Target SKU</Label>
                <Select value={wasteForm.skuId} onValueChange={v => setWasteForm({ ...wasteForm, skuId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Material" /></SelectTrigger>
                  <SelectContent>
                    {skus.filter(s => s.stock > 0).map(s => <SelectItem key={s.id} value={s.id}>{s.id} (Avail: {s.stock})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Quantity to write-off</Label>
                <Input type="number" min="1" value={wasteForm.quantity || ''} onChange={e => setWasteForm({ ...wasteForm, quantity: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Input placeholder="e.g. Water damage, broken during shift" value={wasteForm.reason} onChange={e => setWasteForm({ ...wasteForm, reason: e.target.value })} />
              </div>

              {/* Show cost impact preview dynamically */}
              {wasteForm.skuId && wasteForm.quantity > 0 && (
                <div className="rounded-lg bg-red-50 p-3 mt-2 border border-red-100 flex justify-between items-center text-sm">
                  <span className="text-red-800 font-medium">Estimated Write-off Value:</span>
                  <span className="text-red-900 font-bold">
                    ${(wasteForm.quantity * (skus.find(s => s.id === wasteForm.skuId)?.costPerUnit || 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWasteOpen(false)}>Cancel</Button>
              <Button onClick={handleReportWaste} className="bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Allocate to Site Dialog */}
        <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Allocate Inventory</DialogTitle>
              <DialogDescription>
                Move stock from central inventory to a specific project site.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Material</Label>
                <Select value={allocateForm.skuId} onValueChange={v => setAllocateForm({ ...allocateForm, skuId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger>
                  <SelectContent>
                    {skus.filter(s => s.stock > 0).map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Avail: {s.stock})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Destination Site</Label>
                <Select value={allocateForm.site} onValueChange={v => setAllocateForm({ ...allocateForm, site: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Quantity requested</Label>
                <Input type="number" min="1" value={allocateForm.quantity || ''} onChange={e => setAllocateForm({ ...allocateForm, quantity: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAllocateOpen(false)}>Cancel</Button>
              <Button onClick={handleAllocate} className="bg-primary hover:bg-primary/90 text-white">Allocate Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Settings Dialog (Super Admin) */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-foreground font-semibold" /> System Settings</DialogTitle>
              <DialogDescription>
                Configure global inventory rules and thresholds.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Waste Tolerance Percentage (%)</Label>
                <Input type="number" step="0.1" value={settingsForm.wasteTolerancePercent} onChange={e => setSettingsForm({ ...settingsForm, wasteTolerancePercent: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">Triggers global alert if average waste exceeds this.</p>
              </div>
              <div className="grid gap-2">
                <Label>Write-off Finance Approval Threshold ($)</Label>
                <Input type="number" value={settingsForm.writeOffApprovalThreshold} onChange={e => setSettingsForm({ ...settingsForm, writeOffApprovalThreshold: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">Waste reports exceeding this value route to Finance.</p>
              </div>
              <div className="grid gap-2">
                <Label>Global Low Stock Alert Level</Label>
                <Input type="number" value={settingsForm.lowStockThreshold} onChange={e => setSettingsForm({ ...settingsForm, lowStockThreshold: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">Default fallback count for low stock warnings.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardShell>
  );
}
