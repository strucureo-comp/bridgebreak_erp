'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Hash, User } from 'lucide-react';
import type { User as UserType, Project, QuotationItem, QuotationStatus } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface QuotationFormProps {
  formData: {
    client_id: string;
    client_name: string;
    client_email: string;
    client_company: string;
    client_address: string;
    client_is_company: boolean;
    project_id: string;
    project_title: string;
    quotation_number: string;
    valid_until: string;
    status: QuotationStatus;
    currency: string;
    description: string;
    notes: string;
  };
  items: QuotationItem[];
  users: UserType[];
  projects: Project[];
  isManual: boolean;
  onFormDataChange: (data: any) => void;
  onItemsChange: (items: QuotationItem[]) => void;
  onIsManualChange: (isManual: boolean) => void;
  variant?: 'modern' | 'traditional';
}

export function QuotationForm({
  formData,
  items,
  users,
  projects,
  isManual,
  onFormDataChange,
  onItemsChange,
  onIsManualChange,
  variant = 'modern'
}: QuotationFormProps) {
  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    if (field === 'description') item.description = value;
    else if (field === 'quantity') {
      item.quantity = Number(value);
      item.total = item.quantity * item.unit_price;
    } else if (field === 'unit_price') {
      item.unit_price = Number(value);
      item.total = item.quantity * item.unit_price;
    }
    newItems[index] = item;
    onItemsChange(newItems);
  };

  const addItem = () => onItemsChange([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => items.length > 1 && onItemsChange(items.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const taxRate = 5;
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  if (variant === 'modern') {
    return (
      <div className="grid gap-6 md:grid-cols-3">
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
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Quotation Number</Label>
                <Input value={formData.quotation_number} onChange={e => onFormDataChange({ ...formData, quotation_number: e.target.value })} className="h-9 border-border font-mono font-bold uppercase text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Valid Until</Label>
                <Input type="date" value={formData.valid_until} onChange={e => onFormDataChange({ ...formData, valid_until: e.target.value })} className="h-9 border-border text-xs font-bold" />
              </div>
            </CardContent>
          </Card>

          {/* Target Entity */}
          <Card className="border border-border shadow-sm rounded-md bg-card">
            <CardHeader className="border-b bg-muted/50 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User size={14} className="text-primary" /> Target Entity
              </CardTitle>
              <button onClick={() => onIsManualChange(!isManual)} className="text-[8px] font-black text-primary uppercase border-b border-primary/20">
                {isManual ? 'Use Registry' : 'Enter Manual'}
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {isManual ? (
                <div className="space-y-3">
                  <Input placeholder="Company Name" value={formData.client_company} onChange={e => onFormDataChange({ ...formData, client_company: e.target.value })} className="h-9 border-border text-xs font-bold" />
                  <Input placeholder="Email Address" value={formData.client_email} onChange={e => onFormDataChange({ ...formData, client_email: e.target.value })} className="h-9 border-border text-xs" />
                  <Textarea placeholder="Physical Address" value={formData.client_address} onChange={e => onFormDataChange({ ...formData, client_address: e.target.value })} className="min-h-[60px] text-xs border-border" />
                </div>
              ) : (
                <Select value={formData.client_id} onValueChange={v => onFormDataChange({ ...formData, client_id: v })}>
                  <SelectTrigger className="h-9 border-border text-xs font-bold uppercase"><SelectValue placeholder="Select Client..." /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs uppercase font-bold">{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Items */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border shadow-sm rounded-md bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Proposal Specification</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Line item breakdown for client review</p>
              </div>
              <Button type="button" onClick={addItem} variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5">
                <Plus className="mr-1.5 h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-24">Quantity</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-32">Unit Price</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground w-28 text-right">Total</th>
                      <th className="px-6 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-zinc-50/50">
                        <td className="px-6 py-3"><Input value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="h-8 border-none bg-transparent font-bold text-xs uppercase" placeholder="Enter service..." /></td>
                        <td className="px-6 py-3"><Input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="h-8 border-border text-center text-xs font-bold" /></td>
                        <td className="px-6 py-3"><Input type="number" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} className="h-8 border-border text-xs font-bold" /></td>
                        <td className="px-6 py-3 text-right text-xs font-black text-foreground">{item.total.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removeItem(idx)} className="text-muted-foreground/60 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-8 bg-muted/30 border-t border-border grid md:grid-cols-2 gap-12">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
                  <Textarea value={formData.notes} onChange={e => onFormDataChange({ ...formData, notes: e.target.value })} className="min-h-[100px] border-border text-xs resize-none" placeholder="Administrative notes..." />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal Position</span>
                    <span className="text-sm font-black text-foreground">{formData.currency} {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-foreground text-card-foreground p-6 rounded-md">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Proposal Commitment</p>
                      <p className="text-2xl font-black tracking-tighter">{formData.currency} {totals.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Traditional variant
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client">Client *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => onIsManualChange(!isManual)}
                  >
                    {isManual ? 'Select Existing Client' : 'Enter Manually (Non-Client)'}
                  </Button>
                </div>

                {isManual ? (
                  <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-200/20">
                      <Switch
                        id="client_is_company"
                        checked={formData.client_is_company}
                        onCheckedChange={(checked) => onFormDataChange({ ...formData, client_is_company: checked })}
                      />
                      <Label htmlFor="client_is_company" className="cursor-pointer">This is a Company Client</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client_name" className="text-xs">
                          {formData.client_is_company ? 'Contact Person (Optional)' : 'Client Name *'}
                        </Label>
                        <Input
                          id="client_name"
                          placeholder="John Doe"
                          value={formData.client_name}
                          onChange={(e) => onFormDataChange({ ...formData, client_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_email" className="text-xs">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.client_email}
                          onChange={(e) => onFormDataChange({ ...formData, client_email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_company" className="text-xs">Company Name</Label>
                      <Input
                        id="client_company"
                        placeholder="Company Name"
                        value={formData.client_company}
                        onChange={(e) => onFormDataChange({ ...formData, client_company: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_address" className="text-xs">Address</Label>
                      <Textarea
                        id="client_address"
                        placeholder="Street Address"
                        value={formData.client_address}
                        onChange={(e) => onFormDataChange({ ...formData, client_address: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : (
                  <Select value={formData.client_id} onValueChange={v => onFormDataChange({ ...formData, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Client..." /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quotation_number" className="text-xs">Quotation Number *</Label>
                  <Input
                    id="quotation_number"
                    value={formData.quotation_number}
                    onChange={(e) => onFormDataChange({ ...formData, quotation_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until" className="text-xs">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => onFormDataChange({ ...formData, valid_until: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs">Currency</Label>
                  <Select value={formData.currency} onValueChange={v => onFormDataChange({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                placeholder="Quotation description..."
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Label className="text-xs font-semibold">Item {idx + 1}</Label>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Service description..."
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 flex items-center px-3 bg-muted rounded-md text-xs font-semibold">
                        {item.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formData.currency} {totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (5%):</span>
                  <span className="font-semibold">{formData.currency} {totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formData.currency} {totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes..."
                  value={formData.notes}
                  onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
                  className="min-h-[80px] text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
