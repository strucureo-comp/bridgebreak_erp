"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    INITIAL_SETTINGS, INITIAL_SKUS, INITIAL_WASTE_LOGS, INITIAL_MOVEMENTS,
    PERMISSIONS, SITES, Sku, Movement, WasteLog, Allocation
} from "../_lib/data";

export function useInventory(currentRole: string) {
    const role = PERMISSIONS[currentRole as keyof typeof PERMISSIONS];

    // State
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [skus, setSkus] = useState<Sku[]>(INITIAL_SKUS);
    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(INITIAL_WASTE_LOGS);
    const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
    const [allocations, setAllocations] = useState<Allocation[]>([]);

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

        const updatedSkus = [...skus];
        updatedSkus[skuIndex] = {
            ...sku,
            stock: sku.stock - allocateForm.quantity,
            siteAllocated: sku.siteAllocated + allocateForm.quantity
        };
        setSkus(updatedSkus);

        setAllocations([{
            id: `A-${Math.floor(Math.random() * 10000)}`,
            site: allocateForm.site,
            skuId: sku.id,
            quantity: allocateForm.quantity,
            date: new Date().toISOString()
        }, ...allocations]);

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
            const skuIndex = skus.findIndex(s => s.id === log.skuId);
            if (skuIndex !== -1) {
                const updatedSkus = [...skus];
                const newStock = Math.max(0, updatedSkus[skuIndex].stock - log.quantity);
                updatedSkus[skuIndex] = { ...updatedSkus[skuIndex], stock: newStock };
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

    return {
        settings, setSettings,
        skus, setSkus,
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
        role
    };
}
