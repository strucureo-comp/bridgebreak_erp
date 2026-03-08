'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Send, Check, X, FileText, Download, Eye, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    SalesDocument,
    SalesDocumentType,
    DocumentStatus,
    isApprovalRequired,
    getApproverRole,
    canApproveDocument,
    getStatusInfo,
    submitForApproval,
    approveDocument,
    rejectDocument,
    resubmitDocument,
    completeDocument,
    getDocuments,
    saveDocument,
    deleteDocument,
    getCurrentUserRole,
} from '@/lib/sales-approval';

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface SalesInvoice {
    id: string;
    number: string;
    customerId: string;
    customerName: string;
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string;
    status: DocumentStatus;
    createdBy: string;
    createdAt: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectedReason?: string;
}

const DEFAULT_INVOICE: Partial<SalesInvoice> = {
    items: [],
    subtotal: 0,
    taxRate: 5,
    taxAmount: 0,
    total: 0,
    status: 'draft',
};

export default function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Partial<SalesInvoice>>(DEFAULT_INVOICE);
    const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const documentType: SalesDocumentType = 'salesInvoice';
    const approvalRequired = isApprovalRequired(documentType);
    const approverRole = getApproverRole(documentType);
    const currentUserRole = getCurrentUserRole();
    const canApprove = canApproveDocument(documentType);

    useEffect(() => {
        loadInvoices();
        loadCustomers();
    }, []);

    const loadInvoices = () => {
        const saved = localStorage.getItem('sales_invoices');
        if (saved) {
            setInvoices(JSON.parse(saved));
        }
        setLoading(false);
    };

    const loadCustomers = () => {
        const saved = localStorage.getItem('sales_customers');
        if (saved) {
            setCustomers(JSON.parse(saved));
        } else {
            // Default customers
            setCustomers([
                { id: '1', name: 'ABC Corporation' },
                { id: '2', name: 'XYZ Industries' },
                { id: '3', name: 'Global Trading LLC' },
            ]);
        }
    };

    const generateInvoiceNumber = () => {
        const year = new Date().getFullYear();
        const count = invoices.length + 1;
        return `INV-${year}-${count.toString().padStart(4, '0')}`;
    };

    const calculateTotals = (invoice: Partial<SalesInvoice>) => {
        const subtotal = invoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
        const taxAmount = subtotal * (invoice.taxRate || 0) / 100;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    };

    const handleAddItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
        };
        setEditingInvoice(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem],
        }));
    };

    const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        const updatedItems = editingInvoice.items?.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                updated.total = updated.quantity * updated.unitPrice;
                return updated;
            }
            return item;
        });
        setEditingInvoice(prev => ({
            ...prev,
            items: updatedItems,
            ...calculateTotals({ ...prev, items: updatedItems }),
        }));
    };

    const handleRemoveItem = (id: string) => {
        const updatedItems = editingInvoice.items?.filter(item => item.id !== id);
        setEditingInvoice(prev => ({
            ...prev,
            items: updatedItems,
            ...calculateTotals({ ...prev, items: updatedItems }),
        }));
    };

    const handleSave = () => {
        if (!editingInvoice.customerName) {
            toast.error('Please select a customer');
            return;
        }
        if (!editingInvoice.items?.length) {
            toast.error('Please add at least one item');
            return;
        }

        const totals = calculateTotals(editingInvoice);
        const invoice: SalesInvoice = {
            id: editingInvoice.id || Date.now().toString(),
            number: editingInvoice.number || generateInvoiceNumber(),
            customerId: editingInvoice.customerId || '',
            customerName: editingInvoice.customerName || '',
            date: editingInvoice.date || new Date().toISOString().split('T')[0],
            dueDate: editingInvoice.dueDate || '',
            items: editingInvoice.items || [],
            subtotal: totals.subtotal,
            taxRate: editingInvoice.taxRate || 5,
            taxAmount: totals.taxAmount,
            total: totals.total,
            notes: editingInvoice.notes || '',
            status: (editingInvoice.status as DocumentStatus) || 'draft',
            createdBy: editingInvoice.createdBy || 'Current User',
            createdAt: editingInvoice.createdAt || new Date().toISOString(),
        };

        const existingIndex = invoices.findIndex(i => i.id === invoice.id);
        if (existingIndex >= 0) {
            invoices[existingIndex] = invoice;
            setInvoices([...invoices]);
        } else {
            setInvoices([...invoices, invoice]);
        }

        localStorage.setItem('sales_invoices', JSON.stringify(invoices));
        toast.success('Invoice saved');
        setDialogOpen(false);
        setEditingInvoice(DEFAULT_INVOICE);
    };

    const handleSubmitForApproval = (invoice: SalesInvoice) => {
        const updated = { ...invoice, status: 'pending_approval' as DocumentStatus };
        const updatedList = invoices.map(i => i.id === invoice.id ? updated : i);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice submitted for approval');
    };

    const handleApprove = (invoice: SalesInvoice) => {
        const updated = { ...invoice, status: 'approved' as DocumentStatus, approvedBy: currentUserRole, approvedAt: new Date().toISOString() };
        const updatedList = invoices.map(i => i.id === invoice.id ? updated : i);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice approved');
    };

    const handleReject = (invoice: SalesInvoice) => {
        const updated = { ...invoice, status: 'rejected' as DocumentStatus, rejectedBy: currentUserRole, rejectedAt: new Date().toISOString(), rejectedReason: rejectReason };
        const updatedList = invoices.map(i => i.id === invoice.id ? updated : i);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice rejected');
        setRejectDialogOpen(false);
        setRejectReason('');
    };

    const handleResubmit = (invoice: SalesInvoice) => {
        const updated = { ...invoice, status: 'pending_approval' as DocumentStatus };
        const updatedList = invoices.map(i => i.id === invoice.id ? updated : i);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice resubmitted for approval');
    };

    const handleComplete = (invoice: SalesInvoice) => {
        const updated = { ...invoice, status: 'completed' as DocumentStatus };
        const updatedList = invoices.map(i => i.id === invoice.id ? updated : i);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice marked as completed');
    };

    const handleDelete = (invoice: SalesInvoice) => {
        const updatedList = invoices.filter(i => i.id !== invoice.id);
        setInvoices(updatedList);
        localStorage.setItem('sales_invoices', JSON.stringify(updatedList));
        toast.success('Invoice deleted');
    };

    const openEditDialog = (invoice?: SalesInvoice) => {
        if (invoice) {
            setEditingInvoice(invoice);
        } else {
            setEditingInvoice({ ...DEFAULT_INVOICE, number: generateInvoiceNumber(), date: new Date().toISOString().split('T')[0] });
        }
        setDialogOpen(true);
    };

    const openViewDialog = (invoice: SalesInvoice) => {
        setViewingInvoice(invoice);
        setViewDialogOpen(true);
    };

    const getStatusBadge = (status: DocumentStatus) => {
        const info = getStatusInfo(status);
        return <Badge className={cn(info.color)}>{info.label}</Badge>;
    };

    const canEdit = (invoice: SalesInvoice) => invoice.status === 'draft' || invoice.status === 'rejected';
    const canSubmit = (invoice: SalesInvoice) => invoice.status === 'draft';
    const canApproveAction = (invoice: SalesInvoice) => approvalRequired && invoice.status === 'pending_approval' && canApprove;
    const canResubmit = (invoice: SalesInvoice) => invoice.status === 'rejected';
    const canComplete = (invoice: SalesInvoice) => invoice.status === 'approved';

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Sales Invoices</h1>
                    <p className="text-muted-foreground">Manage sales invoices with approval workflow</p>
                </div>
                <Button onClick={() => openEditDialog()} className="gap-1">
                    <Plus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {approvalRequired && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Approval Required:</strong> Approver Role = {approverRole || 'Not configured'}
                            {canApprove && <Badge className="ml-2 bg-blue-600">You can approve</Badge>}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">No invoices yet. Create your first invoice.</TableCell>
                            </TableRow>
                        ) : invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.number}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell>{invoice.date}</TableCell>
                                <TableCell className="font-semibold">AED {invoice.total.toFixed(2)}</TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(invoice)}><Eye className="h-4 w-4" /></Button>
                                        {canEdit(invoice) && <Button variant="ghost" size="icon" onClick={() => openEditDialog(invoice)}><Edit className="h-4 w-4" /></Button>}
                                        {canSubmit(invoice) && <Button variant="ghost" size="icon" onClick={() => handleSubmitForApproval(invoice)}><Send className="h-4 w-4 text-blue-600" />Submit</Button>}
                                        {canApproveAction(invoice) && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleApprove(invoice)}><Check className="h-4 w-4 text-green-600" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setViewingInvoice(invoice); setRejectDialogOpen(true); }}><X className="h-4 w-4 text-red-600" /></Button>
                                            </>
                                        )}
                                        {canResubmit(invoice) && <Button variant="ghost" size="sm" onClick={() => handleResubmit(invoice)}>Resubmit</Button>}
                                        {canComplete(invoice) && <Button variant="ghost" size="sm" onClick={() => handleComplete(invoice)}>Complete</Button>}
                                        {canEdit(invoice) && <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingInvoice.id ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Invoice Number</Label>
                                <Input value={editingInvoice.number || ''} onChange={e => setEditingInvoice({ ...editingInvoice, number: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Select value={editingInvoice.customerId} onValueChange={v => { const c = customers.find(c => c.id === v); setEditingInvoice({ ...editingInvoice, customerId: v, customerName: c?.name || '' }); }}>
                                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={editingInvoice.date || ''} onChange={e => setEditingInvoice({ ...editingInvoice, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={editingInvoice.dueDate || ''} onChange={e => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Items</Label>
                            {editingInvoice.items?.map(item => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <Input className="flex-1" placeholder="Description" value={item.description} onChange={e => handleUpdateItem(item.id, 'description', e.target.value)} />
                                    <Input className="w-20" type="number" placeholder="Qty" value={item.quantity} onChange={e => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                    <Input className="w-24" type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                    <Input className="w-24" value={item.total.toFixed(2)} disabled />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tax Rate (%)</Label>
                                <Input type="number" value={editingInvoice.taxRate || 5} onChange={e => { const rate = parseFloat(e.target.value) || 0; setEditingInvoice(prev => ({ ...prev, taxRate: rate, ...calculateTotals({ ...prev, taxRate: rate }) })); }} />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input value={editingInvoice.notes || ''} onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })} />
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between"><span>Subtotal:</span><span>AED {(editingInvoice.subtotal || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax:</span><span>AED {(editingInvoice.taxAmount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>AED {(editingInvoice.total || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Invoice {viewingInvoice?.number}</DialogTitle>
                    </DialogHeader>
                    {viewingInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Customer:</Label><p>{viewingInvoice.customerName}</p></div>
                                <div><Label>Date:</Label><p>{viewingInvoice.date}</p></div>
                                <div><Label>Status:</Label>{getStatusBadge(viewingInvoice.status)}</div>
                                <div><Label>Total:</Label><p className="font-bold">AED {viewingInvoice.total.toFixed(2)}</p></div>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {viewingInvoice.items?.map(item => (
                                        <TableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.unitPrice}</TableCell><TableCell>{item.total.toFixed(2)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Reason for rejection</Label>
                        <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter rejection reason" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => viewingInvoice && handleReject(viewingInvoice)}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
