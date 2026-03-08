'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, Send, Check, X, Clock, Eye } from 'lucide-react';
import { QuotationCreator } from './_components/quotation-creator';
import { QuotationViewer } from './_components/quotation-viewer';
import { QuotationPDF } from './_components/quotation-pdf';
import { authHeaders } from '@/lib/api';
import { toast } from 'sonner';

interface Quotation {
  id: string;
  _id: string;
  quotation_number: string;
  customer_company_name?: string;
  customer_contact_person?: string;
  total_amount: number;
  status: string;
  quotation_date: string;
  created_by_name?: string;
  current_approval_level?: number;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/crm/quotations', {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Ensure id field exists (alias for _id)
        const quotationsWithId = data.map((q: any) => ({ ...q, id: q._id || q.id }));
        setQuotations(quotationsWithId);
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleCreateSuccess = () => {
    setCreatorOpen(false);
    fetchQuotations();
    toast.success('Quotation created successfully');
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewerOpen(true);
  };

  const handlePDFPreview = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setPdfPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: 'secondary', label: 'Draft', icon: FileText },
      submitted: { variant: 'default', label: 'Submitted', icon: Send },
      pending_approval: { variant: 'default', label: 'Pending Approval', icon: Clock },
      approved: { variant: 'default', label: 'Approved', icon: Check },
      rejected: { variant: 'destructive', label: 'Rejected', icon: X },
      sent: { variant: 'default', label: 'Sent to Client', icon: Send },
      accepted: { variant: 'default', label: 'Accepted', icon: Check },
      declined: { variant: 'secondary', label: 'Declined', icon: X }
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sales proposals and quotation management
          </p>
        </div>
        <Button onClick={() => setCreatorOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Quotation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Quotations</div>
            <div className="text-2xl font-bold mt-1">{quotations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Pending Approval</div>
            <div className="text-2xl font-bold mt-1 text-amber-600">
              {quotations.filter(q => q.status === 'pending_approval').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {quotations.filter(q => q.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold mt-1">
              AED {quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No quotations yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setCreatorOpen(true)}
              >
                Create Your First Quotation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-semibold py-3 px-3">Quotation #</th>
                    <th className="text-left font-semibold py-3 px-3">Customer</th>
                    <th className="text-left font-semibold py-3 px-3">Date</th>
                    <th className="text-left font-semibold py-3 px-3">Subtotal</th>
                    <th className="text-left font-semibold py-3 px-3">Tax</th>
                    <th className="text-right font-semibold py-3 px-3">Total Amount</th>
                    <th className="text-center font-semibold py-3 px-3">Status</th>
                    <th className="text-center font-semibold py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3 font-medium">{quotation.quotation_number}</td>
                      <td className="py-3 px-3 text-sm">
                        <div>{quotation.customer_company_name || 'Customer'}</div>
                        {quotation.customer_contact_person && (
                          <div className="text-xs text-muted-foreground">{quotation.customer_contact_person}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {new Date(quotation.quotation_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium">
                        AED {((quotation.total_amount || 0) * 0.95).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium">
                        AED {((quotation.total_amount || 0) * 0.05).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-primary text-lg">
                        AED {(quotation.total_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(quotation.status)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => handleView(quotation)}
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => handlePDFPreview(quotation)}
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {creatorOpen && (
        <QuotationCreator
          open={creatorOpen}
          onClose={() => setCreatorOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {viewerOpen && selectedQuotation && (
        <QuotationViewer
          quotation={selectedQuotation}
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedQuotation(null);
          }}
          onRefresh={fetchQuotations}
        />
      )}

      {pdfPreviewOpen && selectedQuotation && (
        <QuotationPDF
          quotationId={selectedQuotation.id}
          open={pdfPreviewOpen}
          onClose={() => {
            setPdfPreviewOpen(false);
            setSelectedQuotation(null);
          }}
        />
      )}
    </div>
  );
}
