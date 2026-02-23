export interface Sku {
    id: string;
    name: string;
    category: string;
    unit: string;
    stock: number;
    minThreshold: number;
    costPerUnit: number;
    wastePercent: number;
    siteAllocated: number;
}

export interface WasteLog {
    id: string;
    skuId: string;
    quantity: number;
    reason: string;
    reportedBy: string;
    status: string;
    date: string;
}

export interface Movement {
    id: string;
    timestamp: string;
    type: string;
    skuId: string;
    quantity: number;
    user: string;
    notes: string;
}

export interface Allocation {
    id: string;
    site: string;
    skuId: string;
    quantity: number;
    date: string;
}

export const INITIAL_SETTINGS = {
    wasteTolerancePercent: 5,
    writeOffApprovalThreshold: 5000,
    lowStockThreshold: 20,
};

export const INITIAL_SKUS: Sku[] = [
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

export const INITIAL_WASTE_LOGS: WasteLog[] = [
    {
        id: "W-1001",
        skuId: "STL-001",
        quantity: 2,
        reason: "Damaged during transport",
        reportedBy: "siteEngineer",
        status: "Pending",
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

export const INITIAL_MOVEMENTS: Movement[] = [
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

export const SITES = ["Site A", "Site B", "Site C", "HQ Warehouse"];

export const ROLES = [
    { id: "superAdmin", name: "Super Admin" },
    { id: "warehouseManager", name: "Warehouse Manager" },
    { id: "siteEngineer", name: "Site Engineer" },
    { id: "financeController", name: "Finance Controller" },
];

export const PERMISSIONS = {
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
        canAdjustStock: false, canRegisterSku: false, canAllocate: true,
        canReportWaste: true, canApproveWaste: false, canApproveFinance: false
    },
    financeController: {
        canEditSku: false, canOverride: false, canChangeSettings: false,
        canAdjustStock: false, canRegisterSku: false, canAllocate: false,
        canReportWaste: false, canApproveWaste: false, canApproveFinance: true
    }
};
