'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Send, Check, X, FileText, Download, Eye, Edit, Loader2, Search, Truck, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateDeliveryNotePDF } from '@/lib/pdf-generator';
import { LiveDocumentPreview } from '@/components/shared/layout/live-document-preview';
import { SalesDocumentType, DocumentStatus, isApprovalRequired, getApproverRole, canApproveDocument, getStatusInfo } from '@/lib/sales-approval';

interface DeliveryItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
}

interface DeliveryNote {
    id: string;
    number: string;
    customerId: string;
    customerName: string;
    invoiceRef: string;
    date: string;
    deliveryDate: string;
    driverName: string;
    vehicleNumber: string;
    items: DeliveryItem[];
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

const DEFAULT_NOTE: Partial<DeliveryNote> = {
    items: [],
    status: 'draft',
};

export default function DeliveryNotesPage() {
    const [notes, setNotes] = useState<DeliveryNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<DeliveryNote>>(DEFAULT_NOTE);
    const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingNote, setViewingNote] = useState<DeliveryNote | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const documentType: SalesDocumentType = 'deliveryNote';
    const approvalRequired = isApprovalRequired(documentType);
    const approverRole = getApproverRole(documentType);
    const currentUserRole = localStorage.getItem('user_role') || 'Employee';
    const canApprove = canApproveDocument(documentType);

    useEffect(() => {
        loadNotes();
        loadCustomers();
    }, []);

    const filteredNotes = useMemo(() => {
        return notes.filter(n =>
            n.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [notes, searchQuery]);

    const loadNotes = () => {
        const saved = localStorage.getItem('sales_deliveryNotes');
        if (saved) setNotes(JSON.parse(saved));
        setLoading(false);
    };

    const loadCustomers = () => {
        const saved = localStorage.getItem('sales_customers');
        if (saved) setCustomers(JSON.parse(saved));
        else setCustomers([{ id: '1', name: 'ABC Corporation' }, { id: '2', name: 'XYZ Industries' }, { id: '3', name: 'Global Trading LLC' }]);
    };

    const generateNoteNumber = () => {
        const year = new Date().getFullYear();
        const count = notes.length + 1;
        return `DN-${year}-${count.toString().padStart(4, '0')}`;
    };

    const handleAddItem = () => {
        const newItem: DeliveryItem = { id: Date.now().toString(), description: '', quantity: 1, unit: 'pcs' };
        setEditingNote(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const handleUpdateItem = (id: string, field: keyof DeliveryItem, value: any) => {
        const updatedItems = editingNote.items?.map(item => item.id === id ? { ...item, [field]: value } : item);
        setEditingNote(prev => ({ ...prev, items: updatedItems }));
    };

    const handleRemoveItem = (id: string) => {
        const updatedItems = editingNote.items?.filter(item => item.id !== id);
        setEditingNote(prev => ({ ...prev, items: updatedItems }));
    };

    const handleSave = () => {
        if (!editingNote.customerName) { toast.error('Please select a customer'); return; }
        if (!editingNote.items?.length) { toast.error('Please add at least one item'); return; }

        const note: DeliveryNote = {
            id: editingNote.id || Date.now().toString(),
            number: editingNote.number || generateNoteNumber(),
            customerId: editingNote.customerId || '',
            customerName: editingNote.customerName || '',
            invoiceRef: editingNote.invoiceRef || '',
            date: editingNote.date || new Date().toISOString().split('T')[0],
            deliveryDate: editingNote.deliveryDate || '',
            driverName: editingNote.driverName || '',
            vehicleNumber: editingNote.vehicleNumber || '',
            items: editingNote.items || [],
            notes: editingNote.notes || '',
            status: (editingNote.status as DocumentStatus) || 'draft',
            createdBy: editingNote.createdBy || 'Current User',
            createdAt: editingNote.createdAt || new Date().toISOString(),
        };

        const existingIndex = notes.findIndex(n => n.id === note.id);
        const updatedList = existingIndex >= 0 ? notes.map((n, idx) => idx === existingIndex ? note : n) : [...notes, note];
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Delivery Note saved');
        setDialogOpen(false);
        setEditingNote(DEFAULT_NOTE);
    };

    const handleSubmitForApproval = (note: DeliveryNote) => {
        const updated = { ...note, status: 'pending_approval' as DocumentStatus };
        const updatedList = notes.map(n => n.id === note.id ? updated : n);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Submitted for approval');
    };

    const handleApprove = (note: DeliveryNote) => {
        const updated = { ...note, status: 'approved' as DocumentStatus, approvedBy: currentUserRole, approvedAt: new Date().toISOString() };
        const updatedList = notes.map(n => n.id === note.id ? updated : n);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Approved');
    };

    const handleReject = (note: DeliveryNote) => {
        const updated = { ...note, status: 'rejected' as DocumentStatus, rejectedBy: currentUserRole, rejectedAt: new Date().toISOString(), rejectedReason: rejectReason };
        const updatedList = notes.map(n => n.id === note.id ? updated : n);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Rejected');
        setRejectDialogOpen(false);
        setRejectReason('');
    };

    const handleResubmit = (note: DeliveryNote) => {
        const updated = { ...note, status: 'pending_approval' as DocumentStatus };
        const updatedList = notes.map(n => n.id === note.id ? updated : n);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Resubmitted for approval');
    };

    const handleComplete = (note: DeliveryNote) => {
        const updated = { ...note, status: 'completed' as DocumentStatus };
        const updatedList = notes.map(n => n.id === note.id ? updated : n);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Marked as completed');
    };

    const handleDelete = (note: DeliveryNote) => {
        const updatedList = notes.filter(n => n.id !== note.id);
        setNotes(updatedList);
        localStorage.setItem('sales_deliveryNotes', JSON.stringify(updatedList));
        toast.success('Deleted');
    };

    const openEditDialog = (note?: DeliveryNote) => {
        setEditingNote(note ? note : { ...DEFAULT_NOTE, number: generateNoteNumber(), date: new Date().toISOString().split('T')[0] });
        setDialogOpen(true);
    };

    const getStatusBadge = (status: DocumentStatus) => {
        const info = getStatusInfo(status);
        return (
            <Badge variant="outline" className={cn(
                "text-[10px]",
                status === 'draft' ? "bg-gray-50 text-gray-600 border-none" :
                status === 'pending_approval' ? "bg-blue-50 text-blue-600 border-none" :
                status === 'approved' ? "bg-emerald-50 text-emerald-600 border-none" :
                status === 'rejected' ? "bg-rose-50 text-rose-600 border-none" :
                    "bg-amber-50 text-amber-600 border-none"
            )}>
                {info.label}
            </Badge>
        );
    };

    const canEdit = (note: DeliveryNote) => note.status === 'draft' || note.status === 'rejected';
    const canSubmit = (note: DeliveryNote) => note.status === 'draft';
    const canApproveAction = (note: DeliveryNote) => approvalRequired && note.status === 'pending_approval' && canApprove;
    const canResubmit = (note: DeliveryNote) => note.status === 'rejected';
    const canComplete = (note: DeliveryNote) => note.status === 'approved';

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Delivery Notes</h1>
                    <p className="text-muted-foreground mt-1">Manage delivery notes with approval workflow</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search delivery notes..."
                            className="pl-9 h-10 w-64 border-border bg-background"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button onClick={() => openEditDialog()} size="sm" className="h-10 gap-2 font-bold shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Delivery Note
                    </Button>
                </div>
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

            {/* Delivery Notes List */}
            <div className="bg-card border border-border rounded-lg shadow-sm divide-y divide-border">
                {filteredNotes.length === 0 ? (
                    <div className="py-16 text-center">
                        <Truck size={32} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-bold text-foreground">No delivery notes found</p>
                        <p className="text-xs text-muted-foreground mt-1">Create a new delivery note to get started.</p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <div key={note.id} className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-bold text-foreground">{note.number}</h3>
                                        {getStatusBadge(note.status)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {note.customerName || 'Customer'} • {note.invoiceRef ? `Ref: ${note.invoiceRef}` : 'No invoice ref'} • {note.date}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">{note.items?.length || 0} items</p>
                                    <p className="text-[10px] text-muted-foreground">{note.driverName || 'No driver'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setViewingNote(note); setViewDialogOpen(true); }}>
                                        <Eye size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => generateDeliveryNotePDF(note)} title="Download PDF">
                                        <Download size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => generateDeliveryNotePDF(note)} title="Download PDF">
                                        <Download size={16} />
                                    </Button>
                                    {canEdit(note) && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(note)}>
                                            <Edit size={16} />
                                        </Button>
                                    )}
                                    {canSubmit(note) && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => handleSubmitForApproval(note)}>
                                            <Send size={16} />
                                        </Button>
                                    )}
                                    {canApproveAction(note) && (
                                        <>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600" onClick={() => handleApprove(note)}>
                                                <Check size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => { setViewingNote(note); setRejectDialogOpen(true); }}>
                                                <X size={16} />
                                            </Button>
                                        </>
                                    )}
                                    {canResubmit(note) && (
                                        <Button variant="ghost" size="sm" onClick={() => handleResubmit(note)}>Resubmit</Button>
                                    )}
                                    {canComplete(note) && (
                                        <Button variant="ghost" size="sm" onClick={() => handleComplete(note)}>Complete</Button>
                                    )}
                                    {canEdit(note) && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(note)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Dialog with Live Preview */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingNote.id ? 'Edit' : 'Create'} Delivery Note</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Form */}
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>DN Number</Label><Input value={editingNote.number || ''} onChange={e => setEditingNote({ ...editingNote, number: e.target.value })} /></div>
                                <div className="space-y-2">
                                    <Label>Customer</Label>
                                    <Select value={editingNote.customerId} onValueChange={v => { const c = customers.find(c => c.id === v); setEditingNote({ ...editingNote, customerId: v, customerName: c?.name || '' }); }}>
                                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Date</Label><Input type="date" value={editingNote.date || ''} onChange={e => setEditingNote({ ...editingNote, date: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Delivery Date</Label><Input type="date" value={editingNote.deliveryDate || ''} onChange={e => setEditingNote({ ...editingNote, deliveryDate: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Invoice Reference</Label><Input value={editingNote.invoiceRef || ''} onChange={e => setEditingNote({ ...editingNote, invoiceRef: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Driver Name</Label><Input value={editingNote.driverName || ''} onChange={e => setEditingNote({ ...editingNote, driverName: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Vehicle Number</Label><Input value={editingNote.vehicleNumber || ''} onChange={e => setEditingNote({ ...editingNote, vehicleNumber: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Items</Label>
                                {editingNote.items?.map(item => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <Input className="flex-1" placeholder="Description" value={item.description} onChange={e => handleUpdateItem(item.id, 'description', e.target.value)} />
                                        <Input className="w-20" type="number" placeholder="Qty" value={item.quantity} onChange={e => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                        <Input className="w-20" placeholder="Unit" value={item.unit} onChange={e => handleUpdateItem(item.id, 'unit', e.target.value)} />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input value={editingNote.notes || ''} onChange={e => setEditingNote({ ...editingNote, notes: e.target.value })} />
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="border rounded-lg overflow-hidden">
                            <LiveDocumentPreview data={editingNote as any} type="delivery" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog - Print-friendly Delivery Note Preview */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>Delivery Note {viewingNote?.number}</DialogTitle>
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </DialogHeader>
                    {viewingNote && (
                        <div className="space-y-6 p-4 border rounded-lg bg-white print:border-0 print:p-0" id="delivery-note-print">
                            {/* Delivery Note Header */}
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">DELIVERY NOTE</h2>
                                    <p className="text-lg font-semibold">{viewingNote.number}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{viewingNote.date}</p>
                                    {viewingNote.deliveryDate && (
                                        <>
                                            <p className="text-sm text-muted-foreground mt-2">Delivery Date</p>
                                            <p className="font-medium">{viewingNote.deliveryDate}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Customer & Delivery Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                    <p className="font-semibold text-lg">{viewingNote.customerName}</p>
                                    {viewingNote.invoiceRef && (
                                        <p className="text-sm text-muted-foreground mt-1">Invoice Ref: {viewingNote.invoiceRef}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <div className="mt-1">{getStatusBadge(viewingNote.status)}</div>
                                </div>
                            </div>

                            {/* Driver & Vehicle Info */}
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Driver</p>
                                    <p className="font-medium">{viewingNote.driverName || 'Not assigned'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Vehicle</p>
                                    <p className="font-medium">{viewingNote.vehicleNumber || 'Not assigned'}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Unit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewingNote.items?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Notes */}
                            {viewingNote.notes && (
                                <div className="border-t pt-4">
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="text-sm">{viewingNote.notes}</p>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="grid grid-cols-2 gap-8 border-t pt-6 mt-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-8">Received By</p>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-8">Driver Signature</p>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Delivery Note</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Reason for rejection</Label>
                        <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter rejection reason" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => viewingNote && handleReject(viewingNote)}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
