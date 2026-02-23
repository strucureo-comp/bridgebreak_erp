"use client";

import React from "react";
import { PackagePlus, ArrowRightLeft, Building, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sku, SITES } from "../_lib/data";

interface InventoryDialogsProps {
    isRegisterOpen: boolean;
    setIsRegisterOpen: (open: boolean) => void;
    skuForm: any;
    setSkuForm: (form: any) => void;
    handleRegisterSku: () => void;

    isAdjustOpen: boolean;
    setIsAdjustOpen: (open: boolean) => void;
    adjustForm: any;
    setAdjustForm: (form: any) => void;
    handleAdjustStock: () => void;
    skus: Sku[];

    isWasteOpen: boolean;
    setIsWasteOpen: (open: boolean) => void;
    wasteForm: any;
    setWasteForm: (form: any) => void;
    handleReportWaste: () => void;

    isAllocateOpen: boolean;
    setIsAllocateOpen: (open: boolean) => void;
    allocateForm: any;
    setAllocateForm: (form: any) => void;
    handleAllocate: () => void;

    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    settingsForm: any;
    setSettingsForm: (form: any) => void;
    handleSaveSettings: () => void;
}

export function InventoryDialogs({
    isRegisterOpen, setIsRegisterOpen, skuForm, setSkuForm, handleRegisterSku,
    isAdjustOpen, setIsAdjustOpen, adjustForm, setAdjustForm, handleAdjustStock, skus,
    isWasteOpen, setIsWasteOpen, wasteForm, setWasteForm, handleReportWaste,
    isAllocateOpen, setIsAllocateOpen, allocateForm, setAllocateForm, handleAllocate,
    isSettingsOpen, setIsSettingsOpen, settingsForm, setSettingsForm, handleSaveSettings
}: InventoryDialogsProps) {
    return (
        <>
            {/* Register SKU Dialog */}
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Register Material</DialogTitle>
                        <DialogDescription>Add a new SKU to the central inventory catalog.</DialogDescription>
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
                                <Label htmlFor="category">Category</Label>
                                <Select value={skuForm.category} onValueChange={v => setSkuForm({ ...skuForm, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                                        <SelectItem value="Materials">Materials</SelectItem>
                                        <SelectItem value="Tools">Tools</SelectItem>
                                        <SelectItem value="Safety">Safety</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input id="unit" placeholder="e.g. Tons" value={skuForm.unit} onChange={e => setSkuForm({ ...skuForm, unit: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="minThreshold">Min. Threshold</Label>
                                <Input id="minThreshold" type="number" value={skuForm.minThreshold} onChange={e => setSkuForm({ ...skuForm, minThreshold: Number(e.target.value) })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                                <Input id="costPerUnit" type="number" value={skuForm.costPerUnit} onChange={e => setSkuForm({ ...skuForm, costPerUnit: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                        <Button onClick={handleRegisterSku}>Register SKU</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Dialog */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-primary" /> Stock Adjustment</DialogTitle>
                        <DialogDescription>Manually increase or deduct stock from central inventory.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Select SKU</Label>
                            <Select value={adjustForm.skuId} onValueChange={v => setAdjustForm({ ...adjustForm, skuId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select SKU..." /></SelectTrigger>
                                <SelectContent>
                                    {skus.map(s => <SelectItem key={s.id} value={s.id}>{s.id} - {s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Type</Label>
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
                                <Input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason / Notes</Label>
                            <Input placeholder="e.g. Damage during move, Restock..." value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdjustStock}>Update Stock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Waste Dialog */}
            <Dialog open={isWasteOpen} onOpenChange={setIsWasteOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Report Waste / Damage</DialogTitle>
                        <DialogDescription>Report material that is no longer usable. Requires approval.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Select SKU</Label>
                            <Select value={wasteForm.skuId} onValueChange={v => setWasteForm({ ...wasteForm, skuId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select SKU..." /></SelectTrigger>
                                <SelectContent>
                                    {skus.map(s => <SelectItem key={s.id} value={s.id}>{s.id} - {s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity Wasted</Label>
                            <Input type="number" value={wasteForm.quantity} onChange={e => setWasteForm({ ...wasteForm, quantity: Number(e.target.value) })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason for Waste</Label>
                            <Input placeholder="e.g. Expired, Broken, Water damage..." value={wasteForm.reason} onChange={e => setWasteForm({ ...wasteForm, reason: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWasteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReportWaste}>Submit Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Allocate to Site Dialog */}
            <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Allocate to Site</DialogTitle>
                        <DialogDescription>Move material from central warehouse to a specific site.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                            <Label>Select SKU</Label>
                            <Select value={allocateForm.skuId} onValueChange={v => setAllocateForm({ ...allocateForm, skuId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select SKU..." /></SelectTrigger>
                                <SelectContent>
                                    {skus.map(s => <SelectItem key={s.id} value={s.id}>{s.id} - {s.name} ({s.stock} avail)</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity to Allocate</Label>
                            <Input type="number" value={allocateForm.quantity} onChange={e => setAllocateForm({ ...allocateForm, quantity: Number(e.target.value) })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAllocateOpen(false)}>Cancel</Button>
                        <Button onClick={handleAllocate}>Process Allocation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Inventory Settings</DialogTitle>
                        <DialogDescription>Configure thresholds and global policies.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Waste Tolerance (%)</Label>
                            <Input type="number" value={settingsForm.wasteTolerancePercent} onChange={e => setSettingsForm({ ...settingsForm, wasteTolerancePercent: Number(e.target.value) })} />
                            <p className="text-[10px] text-muted-foreground">Alerts will trigger when average waste exceeds this %.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Write-off Approval Threshold ($)</Label>
                            <Input type="number" value={settingsForm.writeOffApprovalThreshold} onChange={e => setSettingsForm({ ...settingsForm, writeOffApprovalThreshold: Number(e.target.value) })} />
                            <p className="text-[10px] text-muted-foreground">Waste reports above this value require Finance Controller approval.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings}>Save Settings</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
