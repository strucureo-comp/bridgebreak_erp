'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getSupportRequest } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SupportRequest } from '@/lib/db/types';

export default function SupportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequest();
    }
  }, [user, params.id]);

  const fetchRequest = async () => {
    const data = await getSupportRequest(params.id);

    if (data) {
      if (data.client_id === user?.id) {
        setRequest(data);
      } else {
        router.push('/support');
      }
    } else {
      router.push('/support');
    }

    setLoading(false);
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
      <DashboardShell>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!request) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Support request not found</p>
          <Button className="mt-4" onClick={() => router.push('/support')}>
            Back to Support
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/support">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{request.subject}</h1>
            <p className="text-muted-foreground">Support request details</p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {new Date(request.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">
                {new Date(request.updated_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {request.status === 'open' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Request Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700">
                Our support team will respond to your request shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {request.status === 'resolved' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Request Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700">This support request has been resolved.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}