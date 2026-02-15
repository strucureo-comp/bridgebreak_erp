"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Plus,
    RefreshCw,
    Trash2,
    MoreHorizontal,
    Building2,
    TrendingDown,
    DollarSign,
    Calendar,
    Archive
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    getFixedAssets,
    createFixedAsset,
    runDepreciation,
    getAccounts,
    getJournalEntries
} from "@/lib/api";
import { FixedAsset, AssetStatus } from "@/lib/db/types";

export function AssetsContent() {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInternalLoading, setIsInternalLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New Asset Form State
    const [newItem, setNewItem] = useState({
        name: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        purchase_cost: '',
        salvage_value: '0',
        useful_life_years: '5',
        location: '',
        serial_number: '',
        vendor: '',
        warranty_expiry: '',
        assigned_to: '',
        asset_account_id: '',
        depreciation_account_id: '',
        expense_account_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [assetsData, accountsData] = await Promise.all([
                getFixedAssets(),
                getAccounts()
            ]);
            setAssets(assetsData || []);
            setAccounts((accountsData as any[]) || []);
        } catch (error) {
            toast.error("Failed to load assets data");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateAsset() {
        if (!newItem.name || !newItem.purchase_cost || !newItem.asset_account_id) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsInternalLoading(true);
        try {
            await createFixedAsset(newItem);
            toast.success("Asset registered successfully");
            setIsDialogOpen(false);
            setNewItem({
                name: '',
                purchase_date: format(new Date(), 'yyyy-MM-dd'),
                purchase_cost: '',
                salvage_value: '0',
                useful_life_years: '5',
                location: '',
                serial_number: '',
                vendor: '',
                warranty_expiry: '',
                assigned_to: '',
                asset_account_id: '',
                depreciation_account_id: '',
                expense_account_id: ''
            });
            loadData();
        } catch (error) {
            toast.error("Failed to create asset");
        } finally {
            setIsInternalLoading(false);
        }
    }

    async function handleRunDepreciation() {
        const promise = runDepreciation(new Date().toISOString());

        toast.promise(promise, {
            loading: 'Running depreciation engine...',
            success: (data) => {
                loadData();
                return `Depreciation run complete. ${data.count} entries posted.`;
            },
            error: 'Failed to run depreciation'
        });
    }

    // Filter accounts for dropdowns
    const assetAccounts = accounts.filter((a: any) => a.type === 'asset');
    const expenseAccounts = accounts.filter((a: any) => a.type === 'expense');

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 border-none shadow-sm bg-indigo-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Assets</p>
                            <h3 className="text-2xl font-black text-slate-900">{assets.length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-sm bg-emerald-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Book Value</p>
                            <h3 className="text-2xl font-black text-slate-900">
                                ${assets.reduce((sum, a) => sum + Number(a.current_book_value), 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-sm bg-amber-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Monthly Depreciation</p>
                            {/* Estimate based on active assets first month calculation */}
                            <h3 className="text-2xl font-black text-slate-900">
                                ${assets
                                    .filter(a => a.status === 'active' && Number(a.current_book_value) > Number(a.salvage_value))
                                    .reduce((sum, a) => {
                                        const monthly = (Number(a.purchase_cost) - Number(a.salvage_value)) / (Number(a.useful_life_years) * 12);
                                        return sum + monthly;
                                    }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Input
                            placeholder="Search assets..."
                            className="w-64 pl-10 bg-white border-none shadow-sm rounded-xl"
                        />
                        <Archive className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    <Button variant="outline" className="rounded-xl border-none shadow-sm bg-white text-slate-600">
                        Filter
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRunDepreciation}
                        className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Run Depreciation
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Register Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Register New Fixed Asset</DialogTitle>
                                <DialogDescription>Enter asset details. Depreciation schedule will be generated automatically.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Asset Name / Model</Label>
                                    <Input
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g. MacBook Pro M3 Max"
                                        className="font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Serial Number</Label>
                                    <Input
                                        value={newItem.serial_number}
                                        onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                                        placeholder="S/N: XXXXXX"
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vendor / Supplier</Label>
                                    <Input
                                        value={newItem.vendor}
                                        onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                                        placeholder="e.g. Apple Store"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Purchase Date</Label>
                                    <Input
                                        type="date"
                                        value={newItem.purchase_date}
                                        onChange={(e) => setNewItem({ ...newItem, purchase_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Warranty Expiry</Label>
                                    <Input
                                        type="date"
                                        value={newItem.warranty_expiry}
                                        onChange={(e) => setNewItem({ ...newItem, warranty_expiry: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cost ($)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.purchase_cost}
                                        onChange={(e) => setNewItem({ ...newItem, purchase_cost: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Salvage Value ($)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.salvage_value}
                                        onChange={(e) => setNewItem({ ...newItem, salvage_value: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Useful Life (Years)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.useful_life_years}
                                        onChange={(e) => setNewItem({ ...newItem, useful_life_years: e.target.value })}
                                        placeholder="5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Physical Location</Label>
                                    <Input
                                        value={newItem.location}
                                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                        placeholder="Office / Warehouse A"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Assigned To (Person/Dept)</Label>
                                    <Input
                                        value={newItem.assigned_to}
                                        onChange={(e) => setNewItem({ ...newItem, assigned_to: e.target.value })}
                                        placeholder="e.g. Engineering Team"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Asset Account (Fixed Asset)</Label>
                                    <Select
                                        value={newItem.asset_account_id}
                                        onValueChange={(val) => setNewItem({ ...newItem, asset_account_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Asset Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assetAccounts.map((acc: any) => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Accum. Depr. Account (Contra Asset)</Label>
                                    <Select
                                        value={newItem.depreciation_account_id}
                                        onValueChange={(val) => setNewItem({ ...newItem, depreciation_account_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Contra Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assetAccounts.map((acc: any) => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Depreciation Expense Account</Label>
                                    <Select
                                        value={newItem.expense_account_id}
                                        onValueChange={(val) => setNewItem({ ...newItem, expense_account_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Expense Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {expenseAccounts.map((acc: any) => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCreateAsset}
                                    disabled={isInternalLoading}
                                    className="bg-slate-900 text-white"
                                >
                                    {isInternalLoading ? 'Registering...' : 'Register Asset'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Assets List Table */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Asset #</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Purchase Date</th>
                                <th className="px-6 py-4 text-right">Cost</th>
                                <th className="px-6 py-4 text-right">Book Value</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-400">{asset.asset_number}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{asset.name}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(asset.purchase_date), 'MMM dd, yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                                        ${Number(asset.purchase_cost).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                        ${Number(asset.current_book_value).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize",
                                                asset.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    asset.status === 'disposed' ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                        "bg-red-50 text-red-600 border-red-100"
                                            )}
                                        >
                                            {asset.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-slate-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>View Depreciation Schedule</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Dispose Asset</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {assets.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No fixed assets registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
