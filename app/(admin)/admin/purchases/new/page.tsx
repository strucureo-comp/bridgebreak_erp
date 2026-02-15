'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getVendors, getPurchaseRequests, createPurchaseOrder } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    ChevronLeft, 
    Plus, 
    Trash2, 
    Save, 
    ShoppingCart,
    Store,
    ClipboardList,
    Calculator,
    Hash,
    RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Vendor, PurchaseRequest } from '@/lib/db/types';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedRequest, setSelectedRequest] = useState('none');
  const [lines, setLines] = useState([{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [v, r] = await Promise.all([getVendors(), getPurchaseRequests()]);
      setVendors(v || []);
      setRequests(r.filter(req => req.status === 'pending') || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load initial data');
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
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    const tax = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price * (line.tax_rate / 100)), 0);
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return toast.error('Please select a vendor');
    if (lines.some(l => !l.description || l.quantity <= 0)) return toast.error('Please fill all line items');

    try {
      setSaving(true);
      const payload = {
        po_number: poNumber,
        vendor_id: selectedVendor,
        purchase_request_id: selectedRequest,
        total_amount: totals.total,
        status: 'approved',
        lines: lines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          amount: l.quantity * l.unit_price,
          tax_amount: l.quantity * l.unit_price * (l.tax_rate / 100),
          total_amount: (l.quantity * l.unit_price) * (1 + l.tax_rate / 100)
        }))
      };

      await createPurchaseOrder(payload);
      toast.success('Purchase Order created successfully');
      router.push('/admin/purchases');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create Purchase Order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold">Loading Form...</div>;

  return (
    <DashboardShell requireAdmin>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                className="rounded-xl font-bold text-slate-500 hover:text-slate-900"
                onClick={() => router.back()}
            >
                <ChevronLeft className="mr-2 h-5 w-5" /> Cancel
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Purchase Order</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Hash size={20} className="text-primary" /> Basic Info
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 ml-1">PO Number</Label>
                            <Input 
                                value={poNumber} 
                                onChange={(e) => setPoNumber(e.target.value)}
                                className="h-12 rounded-2xl border-2 border-slate-100 font-bold focus:border-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 ml-1">Related Purchase Request</Label>
                            <select 
                                className="w-full h-12 rounded-2xl border-2 border-slate-100 font-bold focus:border-primary outline-none px-4 bg-white"
                                value={selectedRequest}
                                onChange={(e) => setSelectedRequest(e.target.value)}
                            >
                                <option value="none">None / Direct Order</option>
                                {requests.map(r => (
                                    <option key={r.id} value={r.id}>{r.item_name} ({r.quantity} {r.unit})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Store size={20} className="text-primary" /> Vendor Selection
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 ml-1">Supplier / Vendor</Label>
                            <select 
                                className="w-full h-12 rounded-2xl border-2 border-slate-100 font-bold focus:border-primary outline-none px-4 bg-white"
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                required
                            >
                                <option value="">Select a vendor...</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs font-bold text-slate-400 px-1 italic">
                            Cannot find vendor? Create one in the Master Data module.
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Line Items</CardTitle>
                        <CardDescription className="font-bold">Add materials or services to this order</CardDescription>
                    </div>
                    <Button type="button" onClick={addLine} variant="outline" className="rounded-xl font-black border-2 border-primary text-primary hover:bg-primary/5">
                        <Plus className="mr-2 h-5 w-5" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <div className="space-y-4">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 group">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                                    <Input 
                                        placeholder="Item description..."
                                        value={line.description}
                                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                        className="rounded-xl border-none shadow-sm font-bold h-11"
                                    />
                                </div>
                                <div className="w-full md:w-24 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</Label>
                                    <Input 
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                                        className="rounded-xl border-none shadow-sm font-bold h-11"
                                    />
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price</Label>
                                    <Input 
                                        type="number"
                                        value={line.unit_price}
                                        onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value))}
                                        className="rounded-xl border-none shadow-sm font-bold h-11"
                                    />
                                </div>
                                <div className="w-full md:w-24 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax%</Label>
                                    <Input 
                                        type="number"
                                        value={line.tax_rate}
                                        onChange={(e) => updateLine(idx, 'tax_rate', parseFloat(e.target.value))}
                                        className="rounded-xl border-none shadow-sm font-bold h-11"
                                    />
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</Label>
                                    <div className="h-11 flex items-center font-black text-slate-900 px-2">
                                        ${(line.quantity * line.unit_price).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-end pb-1">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => removeLine(idx)}
                                        className="rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 size={20} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1 p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 w-full">
                            <p className="font-black text-slate-900 mb-2">Order Notes</p>
                            <textarea 
                                className="w-full rounded-2xl p-4 bg-white border-none shadow-sm min-h-[100px] outline-none font-medium"
                                placeholder="Special instructions for vendor..."
                            />
                        </div>
                        <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                                <span>Subtotal</span>
                                <span>${totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                                <span>Tax Amount</span>
                                <span>${totals.tax.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                <span className="text-xl font-black text-slate-900 tracking-tight">Grand Total</span>
                                <span className="text-2xl font-black text-primary tracking-tighter">${totals.total.toLocaleString()}</span>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={saving}
                                className="w-full h-14 rounded-2xl bg-primary text-lg font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-4"
                            >
                                {saving ? <RefreshCcw className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Save Purchase Order
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
