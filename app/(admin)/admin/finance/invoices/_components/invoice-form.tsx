'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, User, ShieldCheck, Plus, Trash2, Building2, CreditCard, Calendar } from 'lucide-react';
import type { User as UserType, Project, InvoiceStatus } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

interface InvoiceFormData {
  // Basic Info
  client_id: string;
  project_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  
  // Line Items
  line_items: InvoiceLineItem[];
  
  // Financial
  currency: string;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  tax_rate: number;
  additional_charges: number;
  additional_charges_description: string;
  
  // Payment
  payment_terms: string;
  payment_method: string;
  
  // Client Details (Manual Entry Option)
  use_manual_client: boolean;
  manual_client_name: string;
  manual_client_email: string;
  manual_client_address: string;
  manual_client_tax_id: string;
  
  // Company Details (Manual Override)
  use_manual_company: boolean;
  manual_company_name: string;
  manual_company_address: string;
  manual_company_tax_id: string;
  manual_company_phone: string;
  manual_company_email: string;
  
  // Notes
  description: string;
  notes: string;
  terms_conditions: string;
}

interface InvoiceFormProps {
  formData: InvoiceFormData;
  users: UserType[];
  projects: Project[];
  onFormDataChange: (data: InvoiceFormData) => void;
  variant?: 'modern' | 'traditional';
  saving?: boolean;
  companyProfile?: any;
}

export function InvoiceForm({
  formData,
  users,
  projects,
  onFormDataChange,
  variant = 'modern',
  saving = false,
  companyProfile,
}: InvoiceFormProps) {
  const filteredProjects = projects.filter(p => p.client_id === formData.client_id);

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...formData.line_items];
    const item = { ...newItems[index] };
    
    if (field === 'description') item.description = value;
    else if (field === 'quantity') {
      item.quantity = Number(value);
      item.total = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
    } else if (field === 'unit_price') {
      item.unit_price = Number(value);
      item.total = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
    } else if (field === 'tax_rate') {
      item.tax_rate = Number(value);
      item.total = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
    }
    
    newItems[index] = item;
    onFormDataChange({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    onFormDataChange({
      ...formData,
      line_items: [...formData.line_items, { description: '', quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length > 1) {
      onFormDataChange({
        ...formData,
        line_items: formData.line_items.filter((_, i) => i !== index)
      });
    }
  };

  const totals = useMemo(() => {
    const subtotal = formData.line_items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const discount = formData.discount_type === 'percentage' 
      ? subtotal * (formData.discount_value / 100)
      : formData.discount_value;
    const afterDiscount = subtotal - discount;
    const tax = formData.line_items.reduce((acc, item) => acc + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
    const total = afterDiscount + tax + (formData.additional_charges || 0);
    
    return { subtotal, discount, afterDiscount, tax, total };
  }, [formData.line_items, formData.discount_type, formData.discount_value, formData.additional_charges]);

  if (variant === 'modern') {
    return (
      <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-300">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          {/* Identification */}
          <Card className="border border-border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Hash size={14} className="text-primary" /> Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Number</Label>
                <Input 
                  value={formData.invoice_number} 
                  onChange={e => onFormDataChange({...formData, invoice_number: e.target.value})} 
                  className="h-9 border-border font-mono font-bold uppercase text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Issue Date</Label>
                <Input 
                  type="date" 
                  value={formData.issue_date} 
                  onChange={e => onFormDataChange({...formData, issue_date: e.target.value})} 
                  className="h-9 border-border text-xs font-bold" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Due Date</Label>
                <Input 
                  type="date" 
                  value={formData.due_date} 
                  onChange={e => onFormDataChange({...formData, due_date: e.target.value})} 
                  className="h-9 border-border text-xs font-bold" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Currency</Label>
                <Select value={formData.currency} onValueChange={v => onFormDataChange({...formData, currency: v})}>
                  <SelectTrigger className="h-9 border-border text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card className="border border-border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User size={14} className="text-primary" /> Client Details
              </CardTitle>
              <button 
                onClick={() => onFormDataChange({...formData, use_manual_client: !formData.use_manual_client})}
                className="text-[8px] font-black text-primary uppercase border-b border-primary/20"
              >
                {formData.use_manual_client ? 'Use Registry' : 'Manual Entry'}
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {formData.use_manual_client ? (
                <>
                  <Input 
                    placeholder="Client Name" 
                    value={formData.manual_client_name} 
                    onChange={e => onFormDataChange({...formData, manual_client_name: e.target.value})} 
                    className="h-9 border-border text-xs font-bold" 
                  />
                  <Input 
                    placeholder="Email" 
                    value={formData.manual_client_email} 
                    onChange={e => onFormDataChange({...formData, manual_client_email: e.target.value})} 
                    className="h-9 border-border text-xs" 
                  />
                  <Textarea 
                    placeholder="Billing Address" 
                    value={formData.manual_client_address} 
                    onChange={e => onFormDataChange({...formData, manual_client_address: e.target.value})} 
                    className="min-h-[60px] text-xs border-border" 
                  />
                  <Input 
                    placeholder="Tax ID / VAT Number" 
                    value={formData.manual_client_tax_id} 
                    onChange={e => onFormDataChange({...formData, manual_client_tax_id: e.target.value})} 
                    className="h-9 border-border text-xs" 
                  />
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Target Client</Label>
                    <Select value={formData.client_id} onValueChange={v => onFormDataChange({...formData, client_id: v, project_id: ''})}>
                      <SelectTrigger className="h-9 border-border text-xs font-bold uppercase">
                        <SelectValue placeholder="Select Client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs uppercase font-bold">{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Related Project</Label>
                    <Select value={formData.project_id} onValueChange={v => onFormDataChange({...formData, project_id: v})} disabled={!formData.client_id}>
                      <SelectTrigger className="h-9 border-border text-xs font-bold uppercase">
                        <SelectValue placeholder="Select Job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs uppercase font-bold">{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company Details Override */}
          <Card className="border border-border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 size={14} className="text-primary" /> Company Details
              </CardTitle>
              <Switch 
                checked={formData.use_manual_company}
                onCheckedChange={v => onFormDataChange({...formData, use_manual_company: v})}
              />
            </CardHeader>
            {formData.use_manual_company && (
              <CardContent className="p-5 space-y-3">
                <Input 
                  placeholder="Company Name" 
                  value={formData.manual_company_name} 
                  onChange={e => onFormDataChange({...formData, manual_company_name: e.target.value})} 
                  className="h-9 border-border text-xs font-bold" 
                />
                <Textarea 
                  placeholder="Company Address" 
                  value={formData.manual_company_address} 
                  onChange={e => onFormDataChange({...formData, manual_company_address: e.target.value})} 
                  className="min-h-[60px] text-xs border-border" 
                />
                <Input 
                  placeholder="Tax ID" 
                  value={formData.manual_company_tax_id} 
                  onChange={e => onFormDataChange({...formData, manual_company_tax_id: e.target.value})} 
                  className="h-9 border-border text-xs" 
                />
                <Input 
                  placeholder="Phone" 
                  value={formData.manual_company_phone} 
                  onChange={e => onFormDataChange({...formData, manual_company_phone: e.target.value})} 
                  className="h-9 border-border text-xs" 
                />
                <Input 
                  placeholder="Email" 
                  value={formData.manual_company_email} 
                  onChange={e => onFormDataChange({...formData, manual_company_email: e.target.value})} 
                  className="h-9 border-border text-xs" 
                />
              </CardContent>
            )}
          </Card>

          {/* Payment Details */}
          <Card className="border border-border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CreditCard size={14} className="text-primary" /> Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Payment Terms</Label>
                <Select value={formData.payment_terms} onValueChange={v => onFormDataChange({...formData, payment_terms: v})}>
                  <SelectTrigger className="h-9 border-border text-xs font-bold">
                    <SelectValue placeholder="Select terms..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Due on Receipt</SelectItem>
                    <SelectItem value="net_7">Net 7 Days</SelectItem>
                    <SelectItem value="net_15">Net 15 Days</SelectItem>
                    <SelectItem value="net_30">Net 30 Days</SelectItem>
                    <SelectItem value="net_60">Net 60 Days</SelectItem>
                    <SelectItem value="net_90">Net 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={v => onFormDataChange({...formData, payment_method: v})}>
                  <SelectTrigger className="h-9 border-border text-xs font-bold">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Line Items */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border shadow-sm rounded-md bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Line Items</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Itemized billing breakdown</p>
              </div>
              <Button 
                type="button" 
                onClick={addLineItem} 
                variant="outline" 
                className="h-8 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
              >
                <Plus className="mr-1.5 h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-24">Qty</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-32">Unit Price</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-24">Tax %</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-28 text-right">Total</th>
                      <th className="px-6 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {formData.line_items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-zinc-50/50">
                        <td className="px-6 py-3">
                          <Input 
                            value={item.description} 
                            onChange={e => handleLineItemChange(idx, 'description', e.target.value)} 
                            className="h-8 border-none bg-transparent font-bold text-xs uppercase" 
                            placeholder="Enter item..." 
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)} 
                            className="h-8 border-border text-center text-xs font-bold" 
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.unit_price} 
                            onChange={e => handleLineItemChange(idx, 'unit_price', e.target.value)} 
                            className="h-8 border-border text-xs font-bold" 
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.tax_rate} 
                            onChange={e => handleLineItemChange(idx, 'tax_rate', e.target.value)} 
                            className="h-8 border-border text-center text-xs font-bold" 
                          />
                        </td>
                        <td className="px-6 py-3 text-right text-xs font-black text-foreground">
                          {formData.currency} {item.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => removeLineItem(idx)} 
                            className="text-muted-foreground/60 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="p-8 bg-muted/30 border-t border-border grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount</Label>
                    <div className="flex gap-2">
                      <Select value={formData.discount_type} onValueChange={(v: any) => onFormDataChange({...formData, discount_type: v})}>
                        <SelectTrigger className="w-32 h-9 border-border text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.discount_value} 
                        onChange={e => onFormDataChange({...formData, discount_value: Number(e.target.value)})} 
                        className="h-9 border-border text-xs font-bold" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Additional Charges</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.additional_charges} 
                      onChange={e => onFormDataChange({...formData, additional_charges: Number(e.target.value)})} 
                      className="h-9 border-border text-xs font-bold" 
                      placeholder="Shipping, handling, etc."
                    />
                    <Input 
                      value={formData.additional_charges_description} 
                      onChange={e => onFormDataChange({...formData, additional_charges_description: e.target.value})} 
                      className="h-9 border-border text-xs" 
                      placeholder="Description (optional)"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terms & Conditions</Label>
                    <Textarea 
                      value={formData.terms_conditions} 
                      onChange={e => onFormDataChange({...formData, terms_conditions: e.target.value})} 
                      className="min-h-[80px] border-border text-xs resize-none" 
                      placeholder="Payment terms, warranties, etc..." 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between py-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black text-foreground">{formData.currency} {totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between py-2 text-rose-600">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Discount</span>
                      <span className="text-sm font-black">-{formData.currency} {totals.discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tax (VAT)</span>
                    <span className="text-sm font-black text-foreground">{formData.currency} {totals.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  {formData.additional_charges > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Additional</span>
                      <span className="text-sm font-black text-foreground">{formData.currency} {formData.additional_charges.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-foreground text-card-foreground p-6 rounded-md mt-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Amount Due</p>
                      <p className="text-2xl font-black tracking-tighter">{formData.currency} {totals.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Traditional variant would go here (simplified for now)
  return <div>Traditional variant - to be implemented</div>;
}
