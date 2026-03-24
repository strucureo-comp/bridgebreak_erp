"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    INITIAL_SETTINGS, PERMISSIONS, SITES, Sku, WasteLog, Allocation
} from "../_lib/data";
import {
    getInventoryItems, getWarehouses, getInventorySummary,
    recordStockMovement, createInventoryItem, deleteInventoryItem
} from "@/lib/api";
import { useCompanySettings } from "@/lib/hooks/use-company-settings";

export function useInventory() {
    const { toast } = useToast();
    
    // In a real system, roles are determined by the auth context mapping to global Role configs (e.g. from settings).
    // For this module frontend, we assume standard full access since module-level access is gated by ModuleGuard/Auth.
    const role = {
        canEditSku: true, canOverride: true, canChangeSettings: true,
        canAdjustStock: true, canRegisterSku: true, canAllocate: true,
        canReportWaste: true, canApproveWaste: true, canApproveFinance: true
    };
    
    const { baseCurrency, taxRate } = useCompanySettings();

    // State
    const [settings, setSettings] = useState(() => ({
        ...INITIAL_SETTINGS,
        writeOffApprovalThreshold: 1000 * (taxRate || 5) // Dynamic threshold example
    }));
    const [skus, setSkus] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [loading, setLoading] = useState(true);

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
    const [settingsForm, setSettingsForm] = useState(INITIAL_SETTINGS);

    const loadData = async () => {
        setLoading(true);
        try {
            const [items, whs, summary] = await Promise.all([
                getInventoryItems(),
                getWarehouses(),
                getInventorySummary()
            ]);

            const mappedSkus = items.map((i: any) => ({
                id: i.sku,
                _id: i._id,
                name: i.name,
                category: i.category,
                unit: i.uom_base,
                stock: 0,
                minThreshold: i.reorder_level || 10,
                costPerUnit: i.last_purchase_price || i.standard_cost,
                siteAllocated: 0,
                wastePercent: 0
            }));

            setSkus(mappedSkus);
            setWarehouses(whs);
            setMovements(summary.recent_transactions);
        } catch (err) {
            console.error("Failed to load inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Actions ---
    const handleRegisterSku = async () => {
        if (!skuForm.id || !skuForm.name) {
            toast({ title: "Error", description: "Please fill in SKU ID and Name.", variant: "destructive" });
            return;
        }

        const payload = {
            sku: skuForm.id,
            name: skuForm.name,
            category: skuForm.category,
            uom_base: skuForm.unit,
            reorder_level: skuForm.minThreshold,
            standard_cost: skuForm.costPerUnit
        };

        try {
            await createInventoryItem(payload);
            toast({ title: "Success", description: `SKU ${skuForm.id} registered successfully.` });
            setIsRegisterOpen(false);
            setSkuForm({ id: "", name: "", category: "Raw Materials", unit: "Units", minThreshold: 10, costPerUnit: 0 });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to register SKU.", variant: "destructive" });
        }
    };

    const handleAdjustStock = async () => {
        if (!adjustForm.skuId || !adjustForm.quantity || adjustForm.quantity <= 0) {
            toast({ title: "Error", description: "Invalid adjustment data.", variant: "destructive" });
            return;
        }

        const sku = skus.find(s => s.id === adjustForm.skuId);
        if (!sku) return;

        const payload = {
            type: 'adjustment',
            item_id: sku._id,
            dest_warehouse_id: warehouses[0]?._id, // Default to first warehouse for now
            quantity: adjustForm.quantity * (adjustForm.type === 'Deduct' ? -1 : 1),
            unit_cost: sku.costPerUnit,
            reason: adjustForm.reason,
            user: "system"
        };

        try {
            await recordStockMovement(payload);
            toast({ title: "Success", description: `Stock adjusted for ${sku.id}.` });
            setIsAdjustOpen(false);
            setAdjustForm({ skuId: "", type: "Increase", quantity: 0, reason: "" });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to adjust stock.", variant: "destructive" });
        }
    };

    const handleReportWaste = async () => {
        if (!wasteForm.skuId || !wasteForm.quantity || wasteForm.quantity <= 0) {
            toast({ title: "Error", description: "Invalid waste report.", variant: "destructive" });
            return;
        }

        const sku = skus.find(s => s.id === wasteForm.skuId);
        if (!sku) return;

        const payload = {
            type: 'waste',
            item_id: sku._id,
            source_warehouse_id: warehouses[0]?._id,
            quantity: -wasteForm.quantity,
            unit_cost: sku.costPerUnit,
            reason: wasteForm.reason,
            user: "system"
        };

        try {
            await recordStockMovement(payload);
            toast({ title: "Success", description: `Waste reported and stock deducted.` });
            setIsWasteOpen(false);
            setWasteForm({ skuId: "", quantity: 0, reason: "" });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to report waste.", variant: "destructive" });
        }
    };

    const handleAllocate = async () => {
        if (!allocateForm.skuId || !allocateForm.quantity || allocateForm.quantity <= 0) {
            toast({ title: "Error", description: "Invalid allocation data.", variant: "destructive" });
            return;
        }

        const sku = skus.find(s => s.id === allocateForm.skuId);
        if (!sku) return;

        const payload = {
            type: 'issue_to_site',
            item_id: sku._id,
            source_warehouse_id: warehouses[0]?._id,
            dest_warehouse_id: warehouses.find(w => w.name.includes(allocateForm.site))?._id,
            quantity: -allocateForm.quantity,
            unit_cost: sku.costPerUnit,
            user: "system"
        };

        try {
            await recordStockMovement(payload);
            toast({ title: "Success", description: `Successfully allocated ${allocateForm.quantity} to ${allocateForm.site}.` });
            setIsAllocateOpen(false);
            setAllocateForm({ skuId: "", site: SITES[0], quantity: 0 });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to allocate stock.", variant: "destructive" });
        }
    };

    const handleSaveSettings = () => {
        setSettings(settingsForm);
        toast({ title: "Success", description: "Settings updated successfully." });
        setIsSettingsOpen(false);
    };

    const handleApproveWaste = (logId: string, approve: boolean) => {
        // Logic for approving waste logs (workflow)
        toast({ title: "Info", description: "Waste approval logic to be integrated with workflow engine." });
    };

    const handleDeleteSku = async (id: string): Promise<boolean> => {
        const sku = skus.find(s => s.id === id);
        if (!sku) return false;
        try {
            const success = await deleteInventoryItem(sku._id);
            if (success) {
                toast({ title: "Success", description: `SKU ${id} deleted successfully.` });
                loadData();
                return true;
            } else {
                toast({ title: "Error", description: "Failed to delete SKU.", variant: "destructive" });
                return false;
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete SKU.", variant: "destructive" });
            return false;
        }
    };

    return {
        settings, setSettings,
        skus, setSkus,
        warehouses, setWarehouses,
        wasteLogs, setWasteLogs,
        movements, setMovements,
        allocations, setAllocations,
        searchQuery, setSearchQuery,
        isRegisterOpen, setIsRegisterOpen,
        isAdjustOpen, setIsAdjustOpen,
        isWasteOpen, setIsWasteOpen,
        isAllocateOpen, setIsAllocateOpen,
        isSettingsOpen, setIsSettingsOpen,
        skuForm, setSkuForm,
        adjustForm, setAdjustForm,
        wasteForm, setWasteForm,
        allocateForm, setAllocateForm,
        settingsForm, setSettingsForm,
        handleRegisterSku,
        handleAdjustStock,
        handleReportWaste,
        handleAllocate,
        handleSaveSettings,
        handleApproveWaste,
        handleDeleteSku,
        role,
        loading
    };
}
