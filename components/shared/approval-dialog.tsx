'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalRecord } from '@/lib/db/types';

interface ApprovalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentType: 'quotation' | 'invoice';
    documentNumber: string;
    currentStatus: string;
    approvalRecords: ApprovalRecord[];
    canApprove: boolean;
    onApprove: (comment: string) => Promise<void>;
    onReject: (reason: string) => Promise<void>;
}

export function ApprovalDialog({
    open,
    onOpenChange,
    documentType,
    documentNumber,
    currentStatus,
    approvalRecords,
    canApprove,
    onApprove,
    onReject
}: ApprovalDialogProps) {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!action) return;
        
        try {
            setLoading(true);
            if (action === 'approve') {
                await onApprove(comment);
            } else {
                await onReject(comment);
            }
            setComment('');
            setAction(null);
            onOpenChange(false);
        } catch (error) {
            console.error('Approval action failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = currentStatus === 'pending_approval' 
        ? 'bg-yellow-100 text-yellow-800' 
        : currentStatus === 'approved'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-black uppercase tracking-tight">
                            {documentType === 'quotation' ? 'Quotation' : 'Invoice'} Approval
                        </DialogTitle>
                        <Badge className={cn("text-[10px] font-black uppercase", statusColor)}>
                            {currentStatus.replace('_', ' ')}
                        </Badge>
                    </div>
                    <DialogDescription className="text-xs">
                        Document #{documentNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Approval History */}
                    {approvalRecords && approvalRecords.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Approval History
                            </Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {approvalRecords.map((record, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                            record.action === 'approved' 
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        )}>
                                            {record.action === 'approved' ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold">{record.user_name}</p>
                                                    <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                                                        {record.user_role}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {new Date(record.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {record.comment && (
                                                <p className="text-[11px] text-slate-600 italic">
                                                    "{record.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Selection */}
                    {canApprove && currentStatus === 'pending_approval' && (
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Take Action
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={action === 'approve' ? 'default' : 'outline'}
                                    className={cn(
                                        "h-14 flex flex-col gap-1",
                                        action === 'approve' && "bg-green-600 hover:bg-green-700"
                                    )}
                                    onClick={() => setAction('approve')}
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase">Approve</span>
                                </Button>
                                <Button
                                    variant={action === 'reject' ? 'destructive' : 'outline'}
                                    className="h-14 flex flex-col gap-1"
                                    onClick={() => setAction('reject')}
                                >
                                    <XCircle className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase">Reject</span>
                                </Button>
                            </div>

                            {action && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        {action === 'approve' ? 'Comment (Optional)' : 'Rejection Reason (Required)'}
                                    </Label>
                                    <Textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={action === 'approve' 
                                            ? 'Add a comment about your approval...'
                                            : 'Explain why this document is being rejected...'
                                        }
                                        className="min-h-[100px] text-xs"
                                        required={action === 'reject'}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info when user cannot approve */}
                    {!canApprove && currentStatus === 'pending_approval' && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-yellow-900">Awaiting Approval</p>
                                <p className="text-[11px] text-yellow-700">
                                    This document is pending approval from an authorized approver.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info when document already processed */}
                    {currentStatus !== 'pending_approval' && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <MessageSquare className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900">
                                    Document {currentStatus === 'approved' ? 'Approved' : 'Rejected'}
                                </p>
                                <p className="text-[11px] text-slate-700">
                                    This document has already been {currentStatus === 'approved' ? 'approved' : 'rejected'}.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAction(null);
                            setComment('');
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        Close
                    </Button>
                    {canApprove && currentStatus === 'pending_approval' && action && (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || (action === 'reject' && !comment.trim())}
                            className={cn(
                                action === 'approve' 
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {loading ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
