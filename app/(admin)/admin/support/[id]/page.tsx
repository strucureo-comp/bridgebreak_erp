'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getSupportRequest, updateSupportRequest, getUser } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, User, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { SupportRequest, User as UserType, SupportStatus } from '@/lib/db/types';

export default function AdminSupportDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const [request, setRequest] = useState<SupportRequest | null>(null);
    const [client, setClient] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (adminUser?.role === 'admin') {
            fetchData();
        }
    }, [adminUser, params.id]);

    const fetchData = async () => {
        setLoading(true);
        const requestData = await getSupportRequest(params.id);
        if (requestData) {
            setRequest(requestData);
            const clientData = await getUser(requestData.client_id);
            if (clientData) {
                setClient(clientData);
            }
        }
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: SupportStatus) => {
        if (!request) return;
        setUpdating(true);
        const success = await updateSupportRequest(request.id, { status: newStatus });
        if (success) {
            setRequest({ ...request, status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        } else {
            toast.error('Failed to update status');
        }
        setUpdating(false);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            open: 'default',
            in_progress: 'secondary',
            resolved: 'outline',
            closed: 'outline',
        };

        return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            low: 'secondary',
            medium: 'default',
            high: 'destructive',
        };

        return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
    };

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
                            <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="h-48 animate-pulse bg-muted" />
                        </div>
                        <Card className="h-64 animate-pulse bg-muted" />
                    </div>
                </div>
            </DashboardShell>
        );
    }

    if (!request) {
        return (
            <DashboardShell requireAdmin>
                <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold">Support request not found</h2>
                    <Button className="mt-4" onClick={() => router.push('/admin/support')}>
                        Back to Support Requests
                    </Button>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/support">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight">{request.subject}</h1>
                            {getPriorityBadge(request.priority)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            ID: <span className="font-mono">{request.id}</span>
                            <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full" />
                            {getStatusBadge(request.status)}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select
                            value={request.status}
                            onValueChange={(val) => handleStatusChange(val as SupportStatus)}
                            disabled={updating}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{request.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {request.attachment_url && (
                            <Card>
                                <CardHeader className="border-b pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-primary" />
                                        Attachments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <a
                                        href={request.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline font-medium"
                                    >
                                        View Attachment
                                    </a>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Client Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {client ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                                            <p className="font-medium">{client.full_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                                            <p className="font-medium">{client.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
                                            <p className="font-medium capitalize">{client.role}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Client information unavailable</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</label>
                                    <p className="text-sm font-medium">{new Date(request.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</label>
                                    <p className="text-sm font-medium">{new Date(request.updated_at).toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
