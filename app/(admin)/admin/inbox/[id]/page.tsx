'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Check, X, ChevronLeft, Clock, FileText, User,
    Building2, Calculator, AlertTriangle, FileCheck,
    History, MessageSquare, Download, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ApprovalDetailedView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const reqId = params.id;

    // Replace MOCK_DATA with dynamic fetch state
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionNotes, setActionNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchRequestDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`http://localhost:4000/api/approval-engine/requests/${reqId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    toast.error("Could not find authorization request.");
                    router.push('/admin/dashboard');
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load request details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequestDetails();
    }, [reqId, router]);

    const handleAction = async (type: 'approve' | 'reject') => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/approval-engine/requests/${reqId}/action`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: type, notes: actionNotes })
            });

            if (response.ok) {
                if (type === 'approve') {
                    toast.success(`Authorization Granted for ${reqId}`);
                } else {
                    toast.error(`Request ${reqId} Rejected`);
                }
                router.push('/admin/dashboard');
            } else {
                toast.error("Failed to post action to ledger.");
            }
        } catch (error) {
            toast.error("API connection failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardShell>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-slate-200 border-t-red-600"></div>
                </div>
            </DashboardShell>
        );
    }

    if (!data) return null;

    return (
        <DashboardShell>
            <div className="space-y-6 pb-12 animate-in fade-in duration-500">

                {/* Clean Page Header */}
                <div className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted/50 hover:bg-muted rounded-xl border border-border" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold tracking-tight">{reqId}</h1>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] px-2 h-5 font-black uppercase tracking-[0.2em]">Pending Review</Badge>
                                {data.priority === 'high' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[9px] px-2 h-5 font-black uppercase tracking-[0.2em] flex gap-1 items-center"><AlertTriangle className="h-3 w-3" /> High Priority</Badge>}
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{data.type} Workflow Phase</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-10 px-6 font-black uppercase tracking-widest text-[10px] text-red-600 border-red-200 hover:bg-red-50 transition-colors shadow-sm rounded-lg"
                            onClick={() => handleAction('reject')}
                            disabled={isProcessing}
                        >
                            <X className="h-4 w-4 mr-2" /> Reject
                        </Button>
                        <Button
                            className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all rounded-lg"
                            onClick={() => handleAction('approve')}
                            disabled={isProcessing}
                        >
                            <Check className="h-4 w-4 mr-2" /> Authorize & Post
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">

                    {/* LEFT COLUMN: Main Details */}
                    <div className="xl:col-span-2 space-y-6">

                        <Card className="border-border shadow-sm overflow-hidden bg-white rounded-xl">
                            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border border-b border-border bg-slate-50/50">
                                <div className="p-5 space-y-1">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Requested By</p>
                                    <p className="text-sm font-bold text-slate-900">{data.requester}</p>
                                    <p className="text-[10px] text-muted-foreground">{data.requesterRole}</p>
                                </div>
                                <div className="p-5 space-y-1">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Department</p>
                                    <p className="text-sm font-bold text-slate-900">{data.department}</p>
                                </div>
                                <div className="p-5 space-y-1">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Submit Date</p>
                                    <p className="text-sm font-bold text-slate-900">{data.date}</p>
                                </div>
                                <div className="p-5 space-y-1 bg-red-50/30">
                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Total Value</p>
                                    <p className="text-xl font-black text-slate-900 leading-none mt-1">{data.amount}</p>
                                </div>
                            </div>

                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-2">Business Justification</h4>
                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/50 text-sm text-slate-700 leading-relaxed font-medium">
                                        {data.description}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-2">Extracted Metadata</h4>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 pt-2">
                                        {data.metadata.map((meta: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{meta.label}</span>
                                                <span className="text-xs font-black text-slate-800">{meta.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Document Evidence */}
                        <Card className="border-border shadow-sm bg-white rounded-xl">
                            <CardHeader className="bg-muted/10 border-b py-4">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center">
                                        <FileCheck className="h-3 w-3" />
                                    </div>
                                    Supporting Documentation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {data.documents.map((doc: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 group hover:border-red-200 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-md bg-white border shadow-sm flex items-center justify-center text-red-600">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{doc}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 group-hover:text-red-600 bg-white shadow-sm border border-slate-100">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN: Action & History */}
                    <div className="space-y-6">

                        {/* Final Decision Box */}
                        <Card className="border-border shadow-md bg-slate-900 text-white overflow-hidden relative border-none rounded-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <CheckCircle2 className="h-32 w-32" />
                            </div>
                            <CardContent className="p-6 relative z-10 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center text-white">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Exec Sign-off Module</h3>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Action Commentary
                                    </label>
                                    <Textarea
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none min-h-[120px] focus:ring-red-500 focus:border-red-500 text-xs rounded-xl"
                                        placeholder="Add mandatory notes for rejection, or optional insights for approval..."
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                    />
                                </div>

                                <div className="pt-2">
                                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic border-t border-white/10 pt-4">
                                        By authorizing this matrix, you confirm compliance with corporate treasury guidelines. Action will trigger immediate ledger updates.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Workflow History */}
                        <Card className="border-border shadow-sm bg-white rounded-xl">
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-900">
                                    <div className="h-6 w-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <History className="h-3 w-3" />
                                    </div>
                                    Audit Trail Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                                    {data.history.map((h: any, i: number) => (
                                        <div key={i} className="relative pl-6">
                                            <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-white" />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-800">{h.action}</span>
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{h.time}</span>
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-500">{h.user}</p>
                                                {h.notes && (
                                                    <div className="mt-2 p-3 bg-slate-50 rounded-lg text-[10px] font-medium text-slate-600 border border-slate-100 italic">
                                                        "{h.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pending Current State */}
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-4 ring-white animate-pulse" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-amber-700">Pending Authorization</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500">Executive Approval Level</p>
                                        </div>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>

                    </div>

                </div>
            </div>
        </DashboardShell>
    );
}
