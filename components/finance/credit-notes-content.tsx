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
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
    getCreditNotes,
    createCreditNote,
    postCreditNote,
    applyCreditNote,
    getCustomers,
    getInvoices
} from '@/lib/api';
import type { CreditNote, CustomerAccount, Invoice, CreditNoteLine } from '@/lib/db/types';

interface CreditNoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    total: number;
}

export function CreditNotesContent() {
    const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        customerId: '',
        invoiceId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        notes: '',
        currency: 'USD',
    });

    const [lineItems, setLineItems] = useState<CreditNoteLineItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, taxAmount: 0, total: 0 }
    ]);

    // Apply form state
    const [applyForm, setApplyForm] = useState({
        invoiceId: '',
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
            const [notesRes, custsRes, invsRes] = await Promise.allSettled([
                getCreditNotes(),
                getCustomers(),
                getInvoices()
            ]);

            if (notesRes.status === 'fulfilled') {
                setCreditNotes(notesRes.value);
            } else {
                console.error('Failed to load credit notes:', notesRes.reason);
                setCreditNotes([]);
            }

            if (custsRes.status === 'fulfilled') {
                setCustomers(custsRes.value);
            } else {
                setCustomers([]);
            }

            if (invsRes.status === 'fulfilled') {
                setInvoices(invsRes.value.filter(i => i.status !== 'paid' && i.status !== 'cancelled'));
            } else {
                setInvoices([]);
            }
        } catch (error) {
            toast.error('Failed to load credit notes');
            setCreditNotes([]);
            setCustomers([]);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }

    // Filter credit notes
    const filteredNotes = useMemo(() => {
        if (activeTab === 'all') return creditNotes;
        return creditNotes.filter(note => note.status === activeTab);
    }, [creditNotes, activeTab]);

    // Stats
    const stats = useMemo(() => {
        const total = creditNotes.reduce((sum, note) => sum + Number(note.total_amount), 0);
        const posted = creditNotes.filter(n => n.posting_status === 'posted').length;
        const draft = creditNotes.filter(n => n.posting_status === 'draft').length;
        const applied = creditNotes.filter(n => n.status === 'applied').length;
        return { total, posted, draft, applied };
    }, [creditNotes]);

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
    const updateLineItem = (id: string, field: keyof CreditNoteLineItem, value: any) => {
        setLineItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updated.total = updated.quantity * updated.unitPrice + updated.taxAmount;
            }
            return updated;
        }));
    };

    // Create credit note
    const handleCreate = async () => {
        if (!formData.customerId) {
            toast.error('Please select a customer');
            return;
        }
        if (lineItems.some(item => !item.description || item.quantity <= 0)) {
            toast.error('Please fill in all line items');
            return;
        }

        try {
            const data = {
                customer_id: formData.customerId,
                invoice_id: formData.invoiceId || null,
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

            await createCreditNote(data);
            toast.success('Credit note created successfully');
            setIsCreateOpen(false);
            loadData();

            // Reset form
            setFormData({
                customerId: '',
                invoiceId: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                reason: '',
                notes: '',
                currency: 'USD',
            });
            setLineItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, taxAmount: 0, total: 0 }]);
        } catch (error) {
            toast.error('Failed to create credit note');
        }
    };

    // Post credit note
    const handlePost = async (id: string) => {
        try {
            await postCreditNote(id);
            toast.success('Credit note posted to GL');
            loadData();
        } catch (error) {
            toast.error('Failed to post credit note');
        }
    };

    // Open apply dialog
    const openApplyDialog = (note: CreditNote) => {
        setSelectedCreditNote(note);
        setApplyForm({ invoiceId: '', amount: note.remaining_amount || 0 });
        setIsApplyOpen(true);
    };

    // Apply credit note
    const handleApply = async () => {
        if (!selectedCreditNote || !applyForm.invoiceId) {
            toast.error('Please select an invoice');
            return;
        }
        if (applyForm.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        try {
            await applyCreditNote(selectedCreditNote.id, applyForm.invoiceId, applyForm.amount);
            toast.success('Credit note applied successfully');
            setIsApplyOpen(false);
            loadData();
        } catch (error) {
            toast.error('Failed to apply credit note');
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
                                <p className="text-sm text-slate-500 font-medium">Total Credit Notes</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Posted</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.posted}</p>
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
                                <p className="text-sm text-slate-500 font-medium">Draft</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.draft}</p>
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
                                <p className="text-sm text-slate-500 font-medium">Applied</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.applied}</p>
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
                            <CardTitle className="text-2xl font-bold text-slate-900">Credit Notes</CardTitle>
                            <p className="text-slate-500 mt-1">Manage customer returns and credits</p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Credit Note
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Credit Note</DialogTitle>
                                    <DialogDescription>
                                        Issue a credit note to a customer for returns or adjustments.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Customer *</Label>
                                            <Select
                                                value={formData.customerId}
                                                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Original Invoice (Optional)</Label>
                                            <Select
                                                value={formData.invoiceId}
                                                onValueChange={(value) => setFormData({ ...formData, invoiceId: value })}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select invoice" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {invoices.map(i => (
                                                        <SelectItem key={i.id} value={i.id}>
                                                            {i.invoice_number} - ${Number(i.total_amount).toFixed(2)}
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
                                            placeholder="e.g., Product return, Discount adjustment"
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
                                            <span className="text-slate-500">Subtotal:</span>
                                            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tax:</span>
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
                                    <Button onClick={handleCreate} className="rounded-xl bg-slate-900 hover:bg-slate-800">Create Credit Note</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="rounded-xl bg-slate-100 p-1">
                            <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                            <TabsTrigger value="draft" className="rounded-lg">Draft</TabsTrigger>
                            <TabsTrigger value="posted" className="rounded-lg">Posted</TabsTrigger>
                            <TabsTrigger value="applied" className="rounded-lg">Applied</TabsTrigger>
                        </TabsList>

                        <div className="border rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold">Credit Note #</TableHead>
                                        <TableHead className="font-semibold">Customer</TableHead>
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
                                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredNotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">No credit notes found</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredNotes.map((note) => (
                                            <TableRow key={note.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">{note.number}</TableCell>
                                                <TableCell>{note.customer?.name || 'Unknown'}</TableCell>
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
                        <DialogTitle>Apply Credit Note</DialogTitle>
                        <DialogDescription>
                            Apply {selectedCreditNote?.number} to an invoice.
                            Available: ${(selectedCreditNote?.remaining_amount || 0).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Invoice *</Label>
                            <Select
                                value={applyForm.invoiceId}
                                onValueChange={(value) => setApplyForm({ ...applyForm, invoiceId: value })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select an invoice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoices
                                        .filter(i => i.customer_id === selectedCreditNote?.customer_id)
                                        .map(i => (
                                            <SelectItem key={i.id} value={i.id}>
                                                {i.invoice_number} - Balance: ${(Number(i.total_amount) - (i.paid_at ? Number(i.total_amount) : 0)).toFixed(2)}
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
                                max={selectedCreditNote?.remaining_amount}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApplyOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleApply} className="rounded-xl bg-slate-900 hover:bg-slate-800">Apply Credit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
