'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getInvoice, getProject } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import type { Invoice, Project } from '@/lib/db/types';
import { generateInvoicePDF } from '@/lib/pdf-generator';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoice();
    }
  }, [user, params.id]);

  const fetchInvoice = async () => {
    const data = await getInvoice(params.id);

    if (data) {
      if (data.client_id === user?.id) {
        setInvoice(data);
        // Fetch project info
        if (data.project_id) {
          const projectData = await getProject(data.project_id);
          if (projectData) {
            setProject(projectData);
          }
        }
      } else {
        router.push('/invoices');
      }
    } else {
      router.push('/invoices');
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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

  if (!invoice) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button className="mt-4" onClick={() => router.push('/invoices')}>
            Back to Invoices
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
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">Invoice details and payment information</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => generateInvoicePDF(invoice, user || null, project)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoice Number:</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Issue Date:</span>
              <span className="font-medium">
                {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>
            {invoice.description && (
              <>
                <Separator />
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="whitespace-pre-wrap">{invoice.description}</p>
                </div>
              </>
            )}
            {invoice.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm">Important Notes:</span>
                  <p className="whitespace-pre-wrap text-sm italic">{invoice.notes}</p>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold">${invoice.amount.toFixed(2)}</span>
            </div>
            {invoice.paid_at && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Paid On:</span>
                  <span className="font-medium">
                    {new Date(invoice.paid_at).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {invoice.status === 'pending' && (
          <>
            {invoice.payment_qr_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment QR Code</CardTitle>
                  <CardDescription>Scan to make payment</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <img
                    src={invoice.payment_qr_url}
                    alt="Payment QR Code"
                    className="w-64 h-64 border rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {invoice.bank_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                  <CardDescription>Transfer payment to the following account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(invoice.bank_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {invoice.status === 'paid' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Payment Received</CardTitle>
              <CardDescription className="text-green-700">
                Thank you for your payment!
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}