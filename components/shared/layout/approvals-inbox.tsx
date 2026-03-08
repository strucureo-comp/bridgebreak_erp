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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, ClipboardCheck, ArrowRight, Clock, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ApprovalsInbox() {
    const router = useRouter();
    const { user } = useAuth();
    const [approvals, setApprovals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch real data on component mount
    useEffect(() => {
        const fetchApprovals = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token || !user?.role) return;

                // Fetch approvals for user's specific role
                const response = await fetch(`http://localhost:4000/api/approval-engine/requests/pending?role=${user.role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // map reqId to id for UI compatibility
                    setApprovals(data.map((item: any) => ({ ...item, id: item.reqId })));
                }
            } catch (error) {
                console.error("Failed to fetch pending approvals", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApprovals();
        
        // Poll for updates every 30 seconds
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
                // Remove from list
                setApprovals(approvals.filter(a => a.id !== selectedRequest.id));

                // Trigger toast
                if (actionType === 'approve') {
                    toast.success(`Request ${selectedRequest.id} Approved Successfully`);
                } else {
                    toast.error(`Request ${selectedRequest.id} Rejected`);
                }
            } else {
                toast.error("Failed to post action to ledger.");
            }
        } catch (error) {
            toast.error("API connection failed.");
        } finally {
            setIsDialogOpen(false);
            setSelectedRequest(null);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg relative transition-colors">
                        <ClipboardCheck size={18} />
                        {approvals.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ring-2 ring-background">
                                {approvals.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[380px] p-0 border-border shadow-xl rounded-xl">
                    <div className="flex items-center justify-between p-4 border-b bg-muted/10">
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Action Inbox</h4>
                            <p className="text-[10px] font-medium text-muted-foreground">Pending authorizations</p>
                        </div>
                        {approvals.length > 0 && (
                            <Badge variant="outline" className="text-[9px] font-black h-5 px-2 bg-red-50 text-red-600 border-red-200">
                                {approvals.length} PENDING
                            </Badge>
                        )}
                    </div>

                    <ScrollArea className="h-[320px]">
                        {approvals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <Check className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">All Caught Up</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">No pending requests in your queue</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {approvals.map((req) => (
                                    <DropdownMenuItem
                                        key={req.id}
                                        className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer flex flex-col items-stretch outline-none focus:bg-muted/30"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            router.push(`/admin/inbox/${req.id}`);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2 w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded bg-white border shadow-sm flex items-center justify-center text-slate-500">
                                                    {req.type.includes('Payroll') ? <User className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">{req.type}</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-80">{req.id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-700">{req.amount}</p>
                                                <p className="text-[9px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                                                    <Clock className="h-2.5 w-2.5" /> {req.date}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {req.department}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    onClick={(e) => { e.preventDefault(); handleActionClick(req, 'reject'); }}
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-2.5 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={(e) => { e.preventDefault(); handleActionClick(req, 'approve'); }}
                                                >
                                                    <Check className="h-3 w-3 mr-1" /> Approve
                                                </Button>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-2 border-t bg-muted/10">
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                            View All Queue <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ACTION MODAL with Notes */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                    <div className={cn(
                        "p-6 text-white relative",
                        actionType === 'approve' ? "bg-emerald-600" : "bg-red-600"
                    )}>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest">
                            {actionType === 'approve' ? 'Authorize Request' : 'Reject Request'}
                        </DialogTitle>
                        <DialogDescription className="text-[11px] font-medium text-white/80 mt-1">
                            {selectedRequest?.id} — {selectedRequest?.type}
                        </DialogDescription>
                    </div>

                    <div className="p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Amount</p>
                                <p className="text-sm font-black text-slate-800">{selectedRequest?.amount}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Requester</p>
                                <p className="text-xs font-bold text-slate-700">{selectedRequest?.requester}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Activity Notes / Justification
                            </label>
                            <Textarea
                                placeholder={actionType === 'reject'
                                    ? "Please provide a reason for rejection..."
                                    : "Optional comments for approval..."}
                                className="min-h-[100px] text-xs resize-none"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t bg-slate-50 flex gap-3">
                        <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className={cn(
                                "flex-1 text-xs text-white",
                                actionType === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                            )}
                            onClick={handleConfirmAction}
                        >
                            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
