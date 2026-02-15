'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    DollarSign,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Calculator,
    Building2,
    Receipt,
    Calendar,
    FileText,
    Globe,
    Percent,
    RefreshCcw,
    Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { getPayables, createPayable, getVendors } from '@/lib/api';
import type { VendorBill, Vendor } from '@/lib/db/types';
import type { TaxRateDefinition } from '@/lib/finance/tax-engine';

// Line item interface
interface BillLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRateId: string;
    taxAmount: number;
    total: number;
}

export function PayablesContent() {
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // Enhanced form state
    const [formData, setFormData] = useState({
        bill_number: '',
        vendorId: '',
        due_date: '',
        currency: 'USD',
        countryCode: 'US',
        notes: '',
        isTaxExempt: false,
    });

    const [lineItems, setLineItems] = useState<BillLineItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, taxRateId: '', taxAmount: 0, total: 0 }
    ]);

    const [taxRates, setTaxRates] = useState<TaxRateDefinition[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    }, [lineItems]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [billsRes, vendorsRes] = await Promise.allSettled([
                getPayables(),
                getVendors()
            ]);

            if (billsRes.status === 'fulfilled') {
                setBills(billsRes.value);
            } else {
                console.error('Failed to load payables:', billsRes.reason);
                setBills([]);
            }

            if (vendorsRes.status === 'fulfilled') {
                setVendors(vendorsRes.value);
            } else {
                setVendors([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payables');
        } finally {
            setLoading(false);
        }
    };

    // Fetch tax rates when country changes
    const fetchTaxRates = useCallback(async (countryCode: string) => {
        try {
            const response = await fetch(`/api/finance/tax/calculate?countryCode=${countryCode}`);
            if (response.ok) {
                const data = await response.json();
                setTaxRates(data.rates || []);
            }
        } catch (error) {
            console.error('Failed to fetch tax rates:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (formData.countryCode) {
            fetchTaxRates(formData.countryCode);
        }
    }, [formData.countryCode, fetchTaxRates]);

    // Auto-generate bill number
    useEffect(() => {
        if (!formData.bill_number) {
            const year = new Date().getFullYear();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setFormData(prev => ({ ...prev, bill_number: `BILL-${year}-${random}` }));
        }
    }, [formData.bill_number]);

    // Set default due date (30 days from now)
    useEffect(() => {
        if (!formData.due_date) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            setFormData(prev => ({ ...prev, due_date: thirtyDaysFromNow.toISOString().split('T')[0] }));
        }
    }, [formData.due_date]);

    const stats = useMemo(() => {
        const totalAP = bills
            .filter(b => b.posting_status === 'posted' && b.status !== 'paid')
            .reduce((sum, b) => sum + Number(b.total_amount || b.amount), 0);
        const overdue = bills
            .filter(b => b.posting_status === 'posted' && b.status !== 'paid' && new Date(b.due_date) < new Date())
            .reduce((sum, b) => sum + Number(b.total_amount || b.amount), 0);
        const postedCount = bills.filter(b => b.posting_status === 'posted').length;
        return { totalAP, overdue, postedCount };
    }, [bills]);

    // Update line item and recalculate tax
    const updateLineItem = async (id: string, updates: Partial<BillLineItem>) => {
        setLineItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updated = { ...item, ...updates };
            const amount = updated.quantity * updated.unitPrice;

            let taxAmount = 0;
            if (!formData.isTaxExempt && updated.taxRateId) {
                const taxRate = taxRates.find(r => r.id === updated.taxRateId);
                if (taxRate) {
                    taxAmount = (amount * taxRate.rate) / 100;
                }
            }

            return {
                ...updated,
                taxAmount,
                total: amount + taxAmount
            };
        }));
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRateId: taxRates.find(r => r.category === 'standard')?.id || '',
            taxAmount: 0,
            total: 0
        }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter(item => item.id !== id));
        }
    };

    // Recalculate taxes when exemption changes
    useEffect(() => {
        if (formData.isTaxExempt) {
            setLineItems(prev => prev.map(item => ({
                ...item,
                taxAmount: 0,
                total: item.quantity * item.unitPrice
            })));
        } else {
            setLineItems(prev => prev.map(item => {
                const amount = item.quantity * item.unitPrice;
                let taxAmount = 0;
                if (item.taxRateId) {
                    const taxRate = taxRates.find(r => r.id === item.taxRateId);
                    if (taxRate) {
                        taxAmount = (amount * taxRate.rate) / 100;
                    }
                }
                return { ...item, taxAmount, total: amount + taxAmount };
            }));
        }
    }, [formData.isTaxExempt, taxRates]);

    const handleCreate = async () => {
        try {
            setIsCalculating(true);

            if (!formData.vendorId) {
                toast.error('Please select a vendor');
                return;
            }
            if (lineItems.some(item => !item.description)) {
                toast.error('Please fill in all line item descriptions');
                return;
            }

            const taxBreakdown: Record<string, number> = {};
            lineItems.forEach(item => {
                if (item.taxRateId && item.taxAmount > 0) {
                    const taxRate = taxRates.find(r => r.id === item.taxRateId);
                    if (taxRate) {
                        const key = `${taxRate.type}_${taxRate.rate}%`;
                        taxBreakdown[key] = (taxBreakdown[key] || 0) + item.taxAmount;
                    }
                }
            });

            const billData = {
                bill_number: formData.bill_number,
                vendor_id: formData.vendorId,
                amount: totals.subtotal,
                tax_amount: totals.totalTax,
                total_amount: totals.total,
                currency: formData.currency,
                due_date: formData.due_date,
                notes: formData.notes,
                tax_breakdown: taxBreakdown,
                lines: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    amount: item.quantity * item.unitPrice,
                    tax_rate_id: item.taxRateId,
                    tax_amount: item.taxAmount,
                    total_amount: item.total
                })),
                posting_status: 'posted'
            };

            await createPayable(billData);

            toast.success('Vendor bill created and posted successfully');
            setIsCreateOpen(false);

            // Reset form
            setFormData({
                bill_number: '',
                vendorId: '',
                due_date: '',
                currency: 'USD',
                countryCode: 'US',
                notes: '',
                isTaxExempt: false,
            });
            setLineItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, taxRateId: '', taxAmount: 0, total: 0 }]);

            fetchData();
        } catch (error) {
            console.error('Create bill error:', error);
            toast.error('Failed to create vendor bill');
        } finally {
            setIsCalculating(false);
        }
    };

    const filteredBills = useMemo(() => {
        if (activeTab === 'all') return bills;
        if (activeTab === 'overdue') {
            return bills.filter(b => b.status !== 'paid' && new Date(b.due_date) < new Date());
        }
        return bills.filter(b => b.status === activeTab);
    }, [bills, activeTab]);

    const currencies = [
        { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
        { code: 'EUR', name: 'Euro (€)', symbol: '€' },
        { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
        { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
        { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
        { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
        { code: 'AED', name: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
        { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
        { code: 'CNY', name: 'Chinese Yuan (¥)', symbol: '¥' },
    ];

    const countries = [
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'IN', name: 'India' },
        { code: 'AU', name: 'Australia' },
        { code: 'CA', name: 'Canada' },
        { code: 'SG', name: 'Singapore' },
        { code: 'AE', name: 'UAE' },
        { code: 'SA', name: 'Saudi Arabia' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'JP', name: 'Japan' },
        { code: 'BR', name: 'Brazil' },
        { code: 'MX', name: 'Mexico' },
        { code: 'ZA', name: 'South Africa' },
        { code: 'NG', name: 'Nigeria' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Total Payables</CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${stats.totalAP.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 mt-1">Outstanding bills</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">${stats.overdue.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 mt-1">Past due date</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Posted Bills</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{stats.postedCount}</div>
                        <p className="text-xs text-slate-400 mt-1">In ledger</p>
                    </CardContent>
                </Card>
            </div>

            {/* Bills Table */}
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900">Vendor Bills</CardTitle>
                        <p className="text-slate-500 font-medium text-sm">Manage payables with automated tax calculations</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200 hover:bg-slate-800">
                                <Plus className="h-4 w-4 mr-2" />
                                New Bill
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                    <Truck className="h-6 w-6" />
                                    Create Vendor Bill
                                </DialogTitle>
                                <DialogDescription>
                                    Create a detailed vendor bill with line items and automatic tax calculation.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                {/* Bill Header */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Bill Number
                                        </Label>
                                        <Input
                                            value={formData.bill_number}
                                            onChange={e => setFormData({ ...formData, bill_number: e.target.value })}
                                            className="rounded-xl font-mono"
                                            placeholder="BILL-2026-0001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Due Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Vendor Selection */}
                                <div className="space-y-2">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Vendor
                                    </Label>
                                    <Select value={formData.vendorId} onValueChange={value => setFormData({ ...formData, vendorId: value })}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Select a vendor..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {vendors.map(vendor => (
                                                <SelectItem key={vendor.id} value={vendor.id}>
                                                    {vendor.name} {vendor.tax_id && `(Tax ID: ${vendor.tax_id})`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Currency & Country */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Currency
                                        </Label>
                                        <Select value={formData.currency} onValueChange={value => setFormData({ ...formData, currency: value })}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {currencies.map(curr => (
                                                    <SelectItem key={curr.code} value={curr.code}>
                                                        {curr.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            Tax Country
                                        </Label>
                                        <Select value={formData.countryCode} onValueChange={value => setFormData({ ...formData, countryCode: value })}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl max-h-[300px]">
                                                {countries.map(country => (
                                                    <SelectItem key={country.code} value={country.code}>
                                                        {country.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Tax Exemption Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Percent className="h-5 w-5 text-slate-500" />
                                        <div>
                                            <Label className="font-bold cursor-pointer" htmlFor="tax-exempt">Tax Exempt Bill</Label>
                                            <p className="text-xs text-slate-500">Enable for non-taxable purchases</p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="tax-exempt"
                                        checked={formData.isTaxExempt}
                                        onCheckedChange={checked => setFormData({ ...formData, isTaxExempt: checked })}
                                    />
                                </div>

                                <Separator />

                                {/* Line Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-lg">Line Items</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addLineItem}
                                            className="rounded-xl"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {lineItems.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl">
                                                <div className="col-span-4">
                                                    <Label className="text-xs font-bold text-slate-500 mb-1">Description</Label>
                                                    <Input
                                                        value={item.description}
                                                        onChange={e => updateLineItem(item.id, { description: e.target.value })}
                                                        placeholder="Item description..."
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label className="text-xs font-bold text-slate-500 mb-1">Qty</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => updateLineItem(item.id, { quantity: Number(e.target.value) })}
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label className="text-xs font-bold text-slate-500 mb-1">Unit Price</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={e => updateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Label className="text-xs font-bold text-slate-500 mb-1">
                                                        Tax Rate {!formData.isTaxExempt && taxRates.length === 0 && '(Loading...)'}
                                                    </Label>
                                                    <Select
                                                        value={item.taxRateId}
                                                        onValueChange={value => updateLineItem(item.id, { taxRateId: value })}
                                                        disabled={formData.isTaxExempt}
                                                    >
                                                        <SelectTrigger className="rounded-lg">
                                                            <SelectValue placeholder={formData.isTaxExempt ? 'N/A' : 'Select...'} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg">
                                                            {taxRates.map(rate => (
                                                                <SelectItem key={rate.id} value={rate.id}>
                                                                    {rate.name} ({rate.rate}%)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1 flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeLineItem(item.id)}
                                                        disabled={lineItems.length === 1}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="col-span-12 flex justify-end gap-4 text-sm">
                                                    <span className="text-slate-500">
                                                        Amount: <strong>${(item.quantity * item.unitPrice).toFixed(2)}</strong>
                                                    </span>
                                                    {!formData.isTaxExempt && item.taxAmount > 0 && (
                                                        <span className="text-slate-500">
                                                            Tax: <strong className="text-amber-600">${item.taxAmount.toFixed(2)}</strong>
                                                        </span>
                                                    )}
                                                    <span className="text-slate-900">
                                                        Total: <strong className="text-lg">${item.total.toFixed(2)}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-full max-w-md space-y-3 p-6 bg-slate-50 rounded-2xl">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        {!formData.isTaxExempt && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Tax</span>
                                                <span className="font-bold text-amber-600">${totals.totalTax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold">Total Due</span>
                                            <span className="text-2xl font-black text-slate-900">
                                                {currencies.find(c => c.code === formData.currency)?.symbol}
                                                {totals.total.toFixed(2)}
                                                <span className="text-sm font-normal text-slate-500 ml-2">{formData.currency}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label className="font-bold">Notes</Label>
                                    <Input
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isCalculating}
                                    className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                >
                                    {isCalculating ? (
                                        <>
                                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="h-4 w-4 mr-2" />
                                            Create & Post Bill
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="rounded-xl bg-slate-100 p-1">
                            <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
                            <TabsTrigger value="paid" className="rounded-lg">Paid</TabsTrigger>
                            <TabsTrigger value="overdue" className="rounded-lg text-red-600">Overdue</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-bold">Bill #</TableHead>
                                    <TableHead className="font-bold">Vendor</TableHead>
                                    <TableHead className="font-bold">Due Date</TableHead>
                                    <TableHead className="font-bold text-right">Subtotal</TableHead>
                                    <TableHead className="font-bold text-right">Tax</TableHead>
                                    <TableHead className="font-bold text-right">Total</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBills.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                            <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                                            <p className="font-medium">No bills found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBills.map((bill) => {
                                        const isOverdue = bill.status !== 'paid' && new Date(bill.due_date) < new Date();
                                        return (
                                            <TableRow key={bill.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">{bill.bill_number}</TableCell>
                                                <TableCell>{bill.vendor?.name || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    <span className={cn(isOverdue && 'text-red-600 font-bold')}>
                                                        {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                                                    </span>
                                                    {isOverdue && <span className="text-xs text-red-500 ml-2">(Overdue)</span>}
                                                </TableCell>
                                                <TableCell className="text-right">${Number(bill.amount).toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-amber-600">
                                                    ${Number(bill.tax_amount || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    ${Number(bill.total_amount || bill.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={bill.status === 'paid' ? 'default' : 'secondary'}
                                                        className={cn(
                                                            'rounded-full',
                                                            bill.status === 'paid' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                                                            isOverdue && 'bg-red-100 text-red-700 hover:bg-red-100'
                                                        )}
                                                    >
                                                        {isOverdue ? 'Overdue' : bill.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
