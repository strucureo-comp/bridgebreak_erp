'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, ClipboardCheck, ArrowRight, Clock, FileText, User, Receipt, Truck, FileInvoice, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isApprovalRequired, getApproverRole, getStatusInfo, DocumentStatus, SalesDocumentType } from '@/lib/sales-approval';

const SALES_DOC_TYPES: Record<string, { label: string; icon: any }> = {
    quotation: { label: 'Quotation', icon: FileText },
    proformaInvoice: { label: 'Proforma Invoice', icon: Receipt },
    salesInvoice: { label: 'Sales Invoice', icon: FileInvoice },
    deliveryNote: { label: 'Delivery Note', icon: Truck },
};

export function ApprovalsInbox() {
    const router = useRouter();
    const { user } = useAuth();
    const [approvals, setApprovals] = useState<any[]>([]);
    const [salesApprovals, setSalesApprovals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getCurrentUserRole = (): string => {
        const role = localStorage.getItem('user_role');
        if (role) return role;
        return user?.role || 'Employee';
    };

    useEffect(() => {
        const userRole = getCurrentUserRole();
        const salesPending: any[] = [];
        const docTypes: SalesDocumentType[] = ['quotation', 'proformaInvoice', 'salesInvoice', 'deliveryNote'];

        docTypes.forEach(docType => {
            const configSaved = localStorage.getItem('sales_approval_config');
            if (!configSaved) return;

            const config = JSON.parse(configSaved);
            const docConfig = config[docType];

            if (!docConfig?.enabled || docConfig.approverRole !== userRole) return;

            const storageKey = `sales_${docType}s`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const documents = JSON.parse(saved);
                documents.forEach((doc: any) => {
                    if (doc.status === 'pending_approval') {
                        salesPending.push({
                            id: doc.id,
                            type: 'sales',
                            docType: docType,
                            number: doc.number || doc.id,
                            title: `${SALES_DOC_TYPES[docType]?.label || docType} - ${doc.customerName || 'Unknown'}`,
                            amount: doc.total || 0,
                            date: doc.date || doc.createdAt,
                            status: 'pending',
                            customerName: doc.customerName,
                        });
                    }
                });
            }
        });

        setSalesApprovals(salesPending);
    }, [user]);

    useEffect(() => {
        const fetchApprovals = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token || !user?.role) return;

                const response = await fetch(`http://localhost:4000/api/approval-engine/requests/pending?role=${user.role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setApprovals(data.map((item: any) => ({ ...item, id: item.reqId })));
                }
            } catch (error) {
                console.error("Failed to fetch pending approvals", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApprovals();

        const interval = setInterval(fetchApprovals, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [notes, setNotes] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleActionClick = (req: any, type: 'approve' | 'reject') => {
        setSelectedRequest(req);
        setActionType(type);
        setNotes('');
        setIsDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedRequest) return;

        if (selectedRequest.type === 'sales') {
            await handleSalesApprovalAction(selectedRequest, actionType!);
            setIsDialogOpen(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/approval-engine/requests/${selectedRequest.id}/action`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: actionType, notes: notes })
            });

            if (response.ok) {
                setApprovals(approvals.filter(a => a.id !== selectedRequest.id));
                if (actionType === 'approve') {
                    toast.success(`Request Approved Successfully`);
                } else {
                    toast.error(`Request Rejected`);
                }
            }
        } catch (error) {
            console.error("Failed to process approval", error);
            toast.error("Failed to process approval");
        }

        setIsDialogOpen(false);
    };

    const handleSalesApprovalAction = async (doc: any, action: 'approve' | 'reject') => {
        const storageKey = `sales_${doc.docType}s`;
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;

        let documents = JSON.parse(saved);
        const docIndex = documents.findIndex((d: any) => d.id === doc.id);
        if (docIndex < 0) return;

        const userRole = getCurrentUserRole();

        if (action === 'approve') {
            documents[docIndex].status = 'approved';
            documents[docIndex].approvedBy = userRole;
            documents[docIndex].approvedAt = new Date().toISOString();
            toast.success(`${SALES_DOC_TYPES[doc.docType]?.label} Approved`);
        } else {
            documents[docIndex].status = 'rejected';
            documents[docIndex].rejectedBy = userRole;
            documents[docIndex].rejectedAt = new Date().toISOString();
            documents[docIndex].rejectedReason = notes;
            toast.error(`${SALES_DOC_TYPES[doc.docType]?.label} Rejected`);
        }

        localStorage.setItem(storageKey, JSON.stringify(documents));
        setSalesApprovals(salesApprovals.filter(a => a.id !== doc.id));
    };

    const pendingCount = approvals.length + salesApprovals.length;

    const navigateToDocument = (req: any) => {
        if (req.type === 'sales') {
            const pathMap: Record<string, string> = {
                quotation: '/admin/sales/quotations',
                proformaInvoice: '/admin/sales/proforma',
                salesInvoice: '/admin/sales/invoices',
                deliveryNote: '/admin/sales/delivery-notes',
            };
            router.push(pathMap[req.docType] || '/admin/sales');
        } else {
            router.push(`/admin/inbox/${req.id}`);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-lg hover:bg-accent">
                        <Bell className="h-5 w-5" />
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                {pendingCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Approvals</span>
                        {pendingCount > 0 && (
                            <Badge variant="destructive" className="text-xs">{pendingCount} Pending</Badge>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <ScrollArea className="h-[400px]">
                        {salesApprovals.length > 0 && (
                            <>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Sales & CRM</div>
                                {salesApprovals.map((req) => {
                                    const DocIcon = SALES_DOC_TYPES[req.docType]?.icon || FileText;
                                    return (
                                        <DropdownMenuItem key={req.id} onClick={() => navigateToDocument(req)} className="flex items-start gap-3 p-3 cursor-pointer">
                                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                                                <DocIcon className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{req.title}</p>
                                                <p className="text-xs text-muted-foreground">{req.number} • AED {req.amount?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleActionClick(req, 'approve'); }}>
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleActionClick(req, 'reject'); }}>
                                                    <X className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}
                                <DropdownMenuSeparator />
                            </>
                        )}

                        {approvals.length === 0 && salesApprovals.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                No pending approvals
                            </div>
                        ) : approvals.map((req) => (
                            <DropdownMenuItem key={req.id} onClick={() => navigateToDocument(req)} className="flex items-start gap-3 p-3 cursor-pointer">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <ClipboardCheck className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{req.title || req.type}</p>
                                    <p className="text-xs text-muted-foreground">{req.requestedBy} • {new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleActionClick(req, 'approve'); }}>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleActionClick(req, 'reject'); }}>
                                        <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </ScrollArea>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin/inbox')} className="justify-center text-primary">
                        View All Approvals
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Approve' : 'Reject'} {selectedRequest?.type === 'sales' ? SALES_DOC_TYPES[selectedRequest?.docType]?.label : 'Request'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRequest?.title || selectedRequest?.type}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={actionType === 'reject' ? 'Reason for rejection...' : 'Add notes...'}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant={actionType === 'approve' ? 'default' : 'destructive'}
                            onClick={handleConfirmAction}
                        >
                            {actionType === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
