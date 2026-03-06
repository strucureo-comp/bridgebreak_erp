"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    INITIAL_SETTINGS, PERMISSIONS, SITES, Sku, WasteLog, Allocation
} from "../_lib/data";
import {
    getInventoryItems, getWarehouses, getInventorySummary,
    recordStockMovement, createInventoryItem
} from "@/lib/api";

export function useInventory(currentRole: string) {
    const role = PERMISSIONS[currentRole as keyof typeof PERMISSIONS];

    // State
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
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
            toast.error("Please fill in SKU ID and Name.");
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
            toast.success(`SKU ${skuForm.id} registered successfully.`);
            setIsRegisterOpen(false);
            setSkuForm({ id: "", name: "", category: "Raw Materials", unit: "Units", minThreshold: 10, costPerUnit: 0 });
            loadData();
        } catch (err) {
            toast.error("Failed to register SKU.");
        }
    };

    const handleAdjustStock = async () => {
        if (!adjustForm.skuId || !adjustForm.quantity || adjustForm.quantity <= 0) {
            toast.error("Invalid adjustment data.");
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
            user: currentRole
        };

        try {
            await recordStockMovement(payload);
            toast.success(`Stock adjusted for ${sku.id}.`);
            setIsAdjustOpen(false);
            setAdjustForm({ skuId: "", type: "Increase", quantity: 0, reason: "" });
            loadData();
        } catch (err) {
            toast.error("Failed to adjust stock.");
        }
    };

    const handleReportWaste = async () => {
        if (!wasteForm.skuId || !wasteForm.quantity || wasteForm.quantity <= 0) {
            toast.error("Invalid waste report.");
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
            user: currentRole
        };

        try {
            await recordStockMovement(payload);
            toast.success(`Waste reported and stock deducted.`);
            setIsWasteOpen(false);
            setWasteForm({ skuId: "", quantity: 0, reason: "" });
            loadData();
        } catch (err) {
            toast.error("Failed to report waste.");
        }
    };

    const handleAllocate = async () => {
        if (!allocateForm.skuId || !allocateForm.quantity || allocateForm.quantity <= 0) {
            toast.error("Invalid allocation data.");
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
            user: currentRole
        };

        try {
            await recordStockMovement(payload);
            toast.success(`Successfully allocated ${allocateForm.quantity} to ${allocateForm.site}.`);
            setIsAllocateOpen(false);
            setAllocateForm({ skuId: "", site: SITES[0], quantity: 0 });
            loadData();
        } catch (err) {
            toast.error("Failed to allocate stock.");
        }
    };

    const handleSaveSettings = () => {
        setSettings(settingsForm);
        toast.success("Settings updated successfully.");
        setIsSettingsOpen(false);
    };

    const handleApproveWaste = (logId: string, approve: boolean) => {
        // Logic for approving waste logs (workflow)
        toast.info("Waste approval logic to be integrated with workflow engine.");
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
        role,
        loading
    };
}
