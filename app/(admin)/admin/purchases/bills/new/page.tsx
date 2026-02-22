'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPurchaseOrders, getVendors, createVendorBill, getPurchaseOrder } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Save, RefreshCcw, Receipt, Calculator, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { PurchaseOrder, Vendor } from '@/lib/db/types';

export default function NewVendorBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams.get('po_id');

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [billNumber, setBillNumber] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedPo, setSelectedPo] = useState(poId || 'none');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<any[]>([{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);

  useEffect(() => {
    fetchData();
  }, []);

  // Effect to load PO details when selected
  useEffect(() => {
    if (selectedPo && selectedPo !== 'none') {
        loadPoDetails(selectedPo);
    }
  }, [selectedPo]);

  const fetchData = async () => {
    try {
      const [v, o] = await Promise.all([getVendors(), getPurchaseOrders()]);
      setVendors(v || []);
      // Only show orders that aren't fully billed/paid
      setOrders(o?.filter(order => ['approved', 'ordered', 'received'].includes(order.status)) || []);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPoDetails = async (id: string) => {
      try {
          setLoading(true);
          const po = await getPurchaseOrder(id);
          if (po) {
              setSelectedVendor(po.vendor_id);
              if (po.lines && po.lines.length > 0) {
                  setLines(po.lines.map((l: any) => ({
                      description: l.description,
                      quantity: l.quantity,
                      unit_price: l.unit_price,
                      tax_rate: 0 // Default, or calculate from tax_amount
                  })));
              }
          }
      } catch (e) {
          toast.error('Failed to load PO details');
      } finally {
          setLoading(false);
      }
  };

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    const tax = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price * (line.tax_rate / 100)), 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber) return toast.error('Bill Number is required');
    if (!selectedVendor) return toast.error('Vendor is required');
    if (!dueDate) return toast.error('Due Date is required');

    try {
      setSubmitting(true);
      await createVendorBill({
        bill_number: billNumber,
        purchase_order_id: selectedPo,
        vendor_id: selectedVendor,
        due_date: dueDate,
        amount: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        status: 'pending',
        lines: lines.map(l => ({
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            amount: l.quantity * l.unit_price,
            tax_amount: l.quantity * l.unit_price * (l.tax_rate / 100),
            total_amount: (l.quantity * l.unit_price) * (1 + l.tax_rate / 100)
        }))
      });
      toast.success('Bill created successfully');
      router.push('/admin/purchases');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !vendors.length) return <div className="p-12 text-center font-bold">Loading...</div>;

  return (
    <DashboardShell requireAdmin>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                className="rounded-xl font-bold text-muted-foreground hover:text-slate-900"
                onClick={() => router.back()}
            >
                <ChevronLeft className="mr-2 h-5 w-5" /> Cancel
            </Button>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Record Vendor Bill</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-8">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Receipt size={20} className="text-primary" /> Bill Details
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-muted-foreground ml-1">Vendor Bill No.</Label>
                            <Input 
                                value={billNumber}
                                onChange={(e) => setBillNumber(e.target.value)}
                                placeholder="e.g. INV-2024-001"
                                className="h-12 rounded-2xl border-2 border-border font-bold focus:border-primary outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-muted-foreground ml-1">Link Purchase Order (Optional)</Label>
                            <select 
                                className="w-full h-12 rounded-2xl border-2 border-border font-bold focus:border-primary outline-none px-4 bg-card"
                                value={selectedPo}
                                onChange={(e) => setSelectedPo(e.target.value)}
                            >
                                <option value="none">None / Direct Bill</option>
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>{o.po_number} - {o.vendor?.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-muted-foreground ml-1">Due Date</Label>
                            <Input 
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-12 rounded-2xl border-2 border-border font-bold focus:border-primary outline-none"
                                required
                            />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-8">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <FileText size={20} className="text-primary" /> Vendor Info
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-muted-foreground ml-1">Supplier / Vendor</Label>
                            <select 
                                className="w-full h-12 rounded-2xl border-2 border-border font-bold focus:border-primary outline-none px-4 bg-card"
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                required
                                disabled={selectedPo !== 'none'} // Lock vendor if PO selected
                            >
                                <option value="">Select a vendor...</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black">Bill Items</CardTitle>
                    <Button type="button" onClick={addLine} variant="outline" className="rounded-xl font-bold">
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <div className="space-y-4">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-muted border border-border">
                                <div className="flex-1">
                                    <Input 
                                        placeholder="Description"
                                        value={line.description}
                                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                        className="h-11 rounded-xl border-border"
                                    />
                                </div>
                                <div className="w-24">
                                    <Input 
                                        type="number"
                                        placeholder="Qty"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                                        className="h-11 rounded-xl border-border"
                                    />
                                </div>
                                <div className="w-32">
                                    <Input 
                                        type="number"
                                        placeholder="Price"
                                        value={line.unit_price}
                                        onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value))}
                                        className="h-11 rounded-xl border-border"
                                    />
                                </div>
                                <div className="w-24">
                                    <Input 
                                        type="number"
                                        placeholder="Tax %"
                                        value={line.tax_rate}
                                        onChange={(e) => updateLine(idx, 'tax_rate', parseFloat(e.target.value))}
                                        className="h-11 rounded-xl border-border"
                                    />
                                </div>
                                <div className="w-32 flex items-center font-bold text-slate-700">
                                    ${((line.quantity * line.unit_price) * (1 + line.tax_rate/100)).toLocaleString()}
                                </div>
                                <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="text-red-500">
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t-2 border-border flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between font-bold text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-muted-foreground">
                                <span>Tax</span>
                                <span>${totals.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-primary pt-2 border-t border-border">
                                <span>Total</span>
                                <span>${totals.total.toLocaleString()}</span>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full h-12 rounded-xl bg-primary font-black mt-4 shadow-lg shadow-primary/20"
                            >
                                {submitting ? <RefreshCcw className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Save Bill
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form>
      </div>
    </DashboardShell>
  );
}
