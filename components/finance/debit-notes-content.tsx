'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    DollarSign,
    Plus,
    Trash2,
    CheckCircle2,
    Receipt,
    Calendar,
    FileText,
    ArrowLeftRight,
    RotateCcw,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
    getDebitNotes,
    createDebitNote,
    postDebitNote,
    applyDebitNote,
    getVendors,
    getPayables
} from '@/lib/api';
import type { DebitNote, Vendor, VendorBill, DebitNoteLine } from '@/lib/db/types';

interface DebitNoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    total: number;
}

export function DebitNotesContent() {
    const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [selectedDebitNote, setSelectedDebitNote] = useState<DebitNote | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        vendorId: '',
        vendorBillId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        notes: '',
        currency: 'USD',
    });

    const [lineItems, setLineItems] = useState<DebitNoteLineItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, taxAmount: 0, total: 0 }
    ]);

    // Apply form state
    const [applyForm, setApplyForm] = useState({
        vendorBillId: '',
        amount: 0,
    });

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    }, [lineItems]);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [notesRes, vendsRes, payablesRes] = await Promise.allSettled([
                getDebitNotes(),
                getVendors(),
                getPayables()
            ]);

            if (notesRes.status === 'fulfilled') {
                setDebitNotes(notesRes.value);
            } else {
                console.error('Failed to load debit notes:', notesRes.reason);
                setDebitNotes([]);
            }

            if (vendsRes.status === 'fulfilled') {
                setVendors(vendsRes.value);
            } else {
                setVendors([]);
            }

            if (payablesRes.status === 'fulfilled') {
                const billsData = payablesRes.value;
                setBills(billsData?.filter((b: VendorBill) => b.status !== 'paid') || []);
            } else {
                setBills([]);
            }
        } catch (error) {
            toast.error('Failed to load debit notes');
            setDebitNotes([]);
            setVendors([]);
            setBills([]);
        } finally {
            setLoading(false);
        }
    }

    // Filter debit notes
    const filteredNotes = useMemo(() => {
        if (activeTab === 'all') return debitNotes;
        return debitNotes.filter(note => note.status === activeTab);
    }, [debitNotes, activeTab]);

    // Stats
    const stats = useMemo(() => {
        const total = debitNotes.reduce((sum, note) => sum + Number(note.total_amount), 0);
        const posted = debitNotes.filter(n => n.posting_status === 'posted').length;
        const draft = debitNotes.filter(n => n.posting_status === 'draft').length;
        const applied = debitNotes.filter(n => n.status === 'applied').length;
        return { total, posted, draft, applied };
    }, [debitNotes]);

    // Add line item
    const addLineItem = () => {
        setLineItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxAmount: 0,
            total: 0
        }]);
    };

    // Remove line item
    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter(item => item.id !== id));
        }
    };

    // Update line item
    const updateLineItem = (id: string, field: keyof DebitNoteLineItem, value: any) => {
        setLineItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updated.total = updated.quantity * updated.unitPrice + updated.taxAmount;
            }
            return updated;
        }));
    };

    // Create debit note
    const handleCreate = async () => {
        if (!formData.vendorId) {
            toast.error('Please select a vendor');
            return;
        }
        if (lineItems.some(item => !item.description || item.quantity <= 0)) {
            toast.error('Please fill in all line items');
            return;
        }

        try {
            const data = {
                vendor_id: formData.vendorId,
                vendor_bill_id: formData.vendorBillId || null,
                date: formData.date,
                reason: formData.reason,
                notes: formData.notes,
                currency: formData.currency,
                lines: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    tax_amount: item.taxAmount,
                    total_amount: item.total
                }))
            };

            await createDebitNote(data);
            toast.success('Debit note created successfully');
            setIsCreateOpen(false);
            loadData();

            // Reset form
            setFormData({
                vendorId: '',
                vendorBillId: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                reason: '',
                notes: '',
                currency: 'USD',
            });
            setLineItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, taxAmount: 0, total: 0 }]);
        } catch (error) {
            toast.error('Failed to create debit note');
        }
    };

    // Post debit note
    const handlePost = async (id: string) => {
        try {
            await postDebitNote(id);
            toast.success('Debit note posted to GL');
            loadData();
        } catch (error) {
            toast.error('Failed to post debit note');
        }
    };

    // Open apply dialog
    const openApplyDialog = (note: DebitNote) => {
        setSelectedDebitNote(note);
        setApplyForm({ vendorBillId: '', amount: note.remaining_amount || 0 });
        setIsApplyOpen(true);
    };

    // Apply debit note
    const handleApply = async () => {
        if (!selectedDebitNote || !applyForm.vendorBillId) {
            toast.error('Please select a vendor bill');
            return;
        }
        if (applyForm.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        try {
            await applyDebitNote(selectedDebitNote.id, applyForm.vendorBillId, applyForm.amount);
            toast.success('Debit note applied successfully');
            setIsApplyOpen(false);
            loadData();
        } catch (error) {
            toast.error('Failed to apply debit note');
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
            draft: { variant: 'secondary', label: 'Draft' },
            posted: { variant: 'default', label: 'Posted' },
            applied: { variant: 'outline', label: 'Applied' },
            refunded: { variant: 'default', label: 'Refunded' },
            voided: { variant: 'destructive', label: 'Voided' }
        };
        const config = variants[status] || { variant: 'secondary', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Debit Notes</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <DollarSign className="w-6 h-6 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Posted</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stats.posted}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Draft</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stats.draft}</p>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <FileText className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Applied</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stats.applied}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <ArrowLeftRight className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="rounded-[2.5rem] shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-foreground">Debit Notes</CardTitle>
                            <p className="text-muted-foreground mt-1">Manage vendor returns and chargebacks</p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Debit Note
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Debit Note</DialogTitle>
                                    <DialogDescription>
                                        Issue a debit note to a vendor for returns or adjustments.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Vendor *</Label>
                                            <Select
                                                value={formData.vendorId}
                                                onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select vendor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vendors.map(v => (
                                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Original Bill (Optional)</Label>
                                            <Select
                                                value={formData.vendorBillId}
                                                onValueChange={(value) => setFormData({ ...formData, vendorBillId: value })}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select bill" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {bills.map(b => (
                                                        <SelectItem key={b.id} value={b.id}>
                                                            {b.bill_number} - ${Number(b.total_amount).toFixed(2)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date *</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Select
                                                value={formData.currency}
                                                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="EUR">EUR</SelectItem>
                                                    <SelectItem value="GBP">GBP</SelectItem>
                                                    <SelectItem value="AED">AED</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Input
                                            placeholder="e.g., Damaged goods, Overcharge correction"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Line Items */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Line Items</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="rounded-lg">
                                                <Plus className="w-4 h-4 mr-1" /> Add Line
                                            </Button>
                                        </div>
                                        {lineItems.map((item, index) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-5">
                                                    <Input
                                                        placeholder="Description"
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="Unit Price"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <p className="text-sm font-medium text-slate-700">${item.total.toFixed(2)}</p>
                                                </div>
                                                <div className="col-span-1">
                                                    {lineItems.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeLineItem(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Totals */}
                                    <div className="space-y-2 text-right">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax:</span>
                                            <span className="font-medium">${totals.totalTax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total:</span>
                                            <span>${totals.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Input
                                            placeholder="Internal notes..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button onClick={handleCreate} className="rounded-xl bg-slate-900 hover:bg-slate-800">Create Debit Note</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="rounded-xl bg-muted p-1">
                            <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                            <TabsTrigger value="draft" className="rounded-lg">Draft</TabsTrigger>
                            <TabsTrigger value="posted" className="rounded-lg">Posted</TabsTrigger>
                            <TabsTrigger value="applied" className="rounded-lg">Applied</TabsTrigger>
                        </TabsList>

                        <div className="border rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead className="font-semibold">Debit Note #</TableHead>
                                        <TableHead className="font-semibold">Vendor</TableHead>
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Amount</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Remaining</TableHead>
                                        <TableHead className="font-semibold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredNotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No debit notes found</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredNotes.map((note) => (
                                            <TableRow key={note.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">{note.number}</TableCell>
                                                <TableCell>{note.vendor?.name || 'Unknown'}</TableCell>
                                                <TableCell>{format(new Date(note.date), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="font-medium">
                                                    ${Number(note.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(note.status)}</TableCell>
                                                <TableCell className="text-emerald-600 font-medium">
                                                    ${(note.remaining_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {note.posting_status === 'draft' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePost(note.id)}
                                                                className="rounded-lg"
                                                            >
                                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                                Post
                                                            </Button>
                                                        )}
                                                        {note.posting_status === 'posted' && (note.remaining_amount || 0) > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openApplyDialog(note)}
                                                                className="rounded-lg"
                                                            >
                                                                <ArrowLeftRight className="w-4 h-4 mr-1" />
                                                                Apply
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Apply Dialog */}
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Apply Debit Note</DialogTitle>
                        <DialogDescription>
                            Apply {selectedDebitNote?.number} to a vendor bill.
                            Available: ${(selectedDebitNote?.remaining_amount || 0).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Vendor Bill *</Label>
                            <Select
                                value={applyForm.vendorBillId}
                                onValueChange={(value) => setApplyForm({ ...applyForm, vendorBillId: value })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select a bill" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bills
                                        .filter(b => b.vendor_id === selectedDebitNote?.vendor_id)
                                        .map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.bill_number} - Balance: ${Number(b.total_amount).toFixed(2)}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount to Apply *</Label>
                            <Input
                                type="number"
                                value={applyForm.amount}
                                onChange={(e) => setApplyForm({ ...applyForm, amount: parseFloat(e.target.value) || 0 })}
                                max={selectedDebitNote?.remaining_amount}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApplyOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleApply} className="rounded-xl bg-slate-900 hover:bg-slate-800">Apply Debit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
