"use client";

import React, { useState } from "react";
import {
  AlertTriangle, Factory, DollarSign, Search, Settings,
  PackagePlus, ArrowRightLeft, Building, Trash2, AlertCircle, CheckCircle2
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardShell } from "@/components/shared/layout/dashboard-shell";

import { ROLES } from "./_lib/data";
import { useInventory } from "./_hooks/inventory";
import { SkuMasterCatalog } from "./_components/sku-master-catalog";
import { StockMovementLog } from "./_components/stock-movement-log";
import { WasteManagement } from "./_components/waste-management";
import { SiteAllocation } from "./_components/site-allocation";
import { InventoryDialogs } from "./_components/inventory-dialogs";

export default function InventoryControlPage() {
  const [currentRole, setCurrentRole] = useState("warehouseManager");
  const {
    settings, skus, wasteLogs, movements, allocations, searchQuery, setSearchQuery,
    isRegisterOpen, setIsRegisterOpen, isAdjustOpen, setIsAdjustOpen,
    isWasteOpen, setIsWasteOpen, isAllocateOpen, setIsAllocateOpen,
    isSettingsOpen, setIsSettingsOpen, skuForm, setSkuForm, adjustForm, setAdjustForm,
    wasteForm, setWasteForm, allocateForm, setAllocateForm, settingsForm, setSettingsForm,
    handleRegisterSku, handleAdjustStock, handleReportWaste, handleAllocate,
    handleSaveSettings, handleApproveWaste, role
  } = useInventory(currentRole);

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
              <SkuMasterCatalog skus={filteredSkus} wasteTolerancePercent={settings.wasteTolerancePercent} />
            </TabsContent>

            <TabsContent value="stock-movement" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden">
              <StockMovementLog movements={movements} />
            </TabsContent>

            <TabsContent value="waste-management" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden flex flex-col gap-6">
              <WasteManagement
                wasteLogs={wasteLogs}
                skus={skus}
                writeOffApprovalThreshold={settings.writeOffApprovalThreshold}
                role={role}
                onApprove={handleApproveWaste}
              />
            </TabsContent>

            <TabsContent value="site-allocation" className="flex-grow focus-visible:outline-none data-[state=inactive]:hidden">
              <SiteAllocation allocations={allocations} skus={skus} />
            </TabsContent>
          </Tabs>
        </div>

        <InventoryDialogs
          isRegisterOpen={isRegisterOpen} setIsRegisterOpen={setIsRegisterOpen} skuForm={skuForm} setSkuForm={setSkuForm} handleRegisterSku={handleRegisterSku}
          isAdjustOpen={isAdjustOpen} setIsAdjustOpen={setIsAdjustOpen} adjustForm={adjustForm} setAdjustForm={setAdjustForm} handleAdjustStock={handleAdjustStock} skus={skus}
          isWasteOpen={isWasteOpen} setIsWasteOpen={setIsWasteOpen} wasteForm={wasteForm} setWasteForm={setWasteForm} handleReportWaste={handleReportWaste}
          isAllocateOpen={isAllocateOpen} setIsAllocateOpen={setIsAllocateOpen} allocateForm={allocateForm} setAllocateForm={setAllocateForm} handleAllocate={handleAllocate}
          isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsForm={settingsForm} setSettingsForm={setSettingsForm} handleSaveSettings={handleSaveSettings}
        />
      </div>
    </DashboardShell>
  );
}
