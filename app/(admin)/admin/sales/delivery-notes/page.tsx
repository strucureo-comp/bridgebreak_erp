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
import { Plus, Trash2, Save, Send, Check, X, FileText, Eye, Edit, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

    const documentType: SalesDocumentType = 'deliveryNote';
    const approvalRequired = isApprovalRequired(documentType);
    const approverRole = getApproverRole(documentType);
    const currentUserRole = localStorage.getItem('user_role') || 'Employee';
    const canApprove = canApproveDocument(documentType);

    useEffect(() => {
        loadNotes();
        loadCustomers();
    }, []);

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
        return <Badge className={cn(info.color)}>{info.label}</Badge>;
    };

    const canEdit = (note: DeliveryNote) => note.status === 'draft' || note.status === 'rejected';
    const canSubmit = (note: DeliveryNote) => note.status === 'draft';
    const canApproveAction = (note: DeliveryNote) => approvalRequired && note.status === 'pending_approval' && canApprove;
    const canResubmit = (note: DeliveryNote) => note.status === 'rejected';
    const canComplete = (note: DeliveryNote) => note.status === 'approved';

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Delivery Notes</h1>
                    <p className="text-muted-foreground">Manage delivery notes with approval workflow</p>
                </div>
                <Button onClick={() => openEditDialog()} className="gap-1"><Plus className="h-4 w-4" /> Create Delivery Note</Button>
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
                            <TableHead>DN Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice Ref</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notes.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No delivery notes yet.</TableCell></TableRow>
                        ) : notes.map(note => (
                            <TableRow key={note.id}>
                                <TableCell className="font-medium">{note.number}</TableCell>
                                <TableCell>{note.customerName}</TableCell>
                                <TableCell>{note.date}</TableCell>
                                <TableCell>{note.invoiceRef || '-'}</TableCell>
                                <TableCell>{getStatusBadge(note.status)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => { setViewingNote(note); setViewDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                        {canEdit(note) && <Button variant="ghost" size="icon" onClick={() => openEditDialog(note)}><Edit className="h-4 w-4" /></Button>}
                                        {canSubmit(note) && <Button variant="ghost" size="icon" onClick={() => handleSubmitForApproval(note)}><Send className="h-4 w-4 text-blue-600" /></Button>}
                                        {canApproveAction(note) && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleApprove(note)}><Check className="h-4 w-4 text-green-600" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setViewingNote(note); setRejectDialogOpen(true); }}><X className="h-4 w-4 text-red-600" /></Button>
                                            </>
                                        )}
                                        {canResubmit(note) && <Button variant="ghost" size="sm" onClick={() => handleResubmit(note)}>Resubmit</Button>}
                                        {canComplete(note) && <Button variant="ghost" size="sm" onClick={() => handleComplete(note)}>Complete</Button>}
                                        {canEdit(note) && <Button variant="ghost" size="icon" onClick={() => handleDelete(note)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
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
                    <DialogHeader><DialogTitle>{editingNote.id ? 'Edit' : 'Create'} Delivery Note</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Delivery Note {viewingNote?.number}</DialogTitle></DialogHeader>
                    {viewingNote && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Customer:</Label><p>{viewingNote.customerName}</p></div>
                                <div><Label>Date:</Label><p>{viewingNote.date}</p></div>
                                <div><Label>Driver:</Label><p>{viewingNote.driverName || '-'}</p></div>
                                <div><Label>Vehicle:</Label><p>{viewingNote.vehicleNumber || '-'}</p></div>
                                <div><Label>Status:</Label>{getStatusBadge(viewingNote.status)}</div>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Quantity</TableHead><TableHead>Unit</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {viewingNote.items?.map(item => (
                                        <TableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.unit}</TableCell></TableRow>
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
