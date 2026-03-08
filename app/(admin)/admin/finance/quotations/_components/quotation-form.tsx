'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Hash, User, Lock, Unlock, Building2, Phone, MapPin, Globe } from 'lucide-react';
import type { User as UserType, Project, QuotationItem, QuotationStatus } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { getSettings } from '@/lib/api';

interface QuotationFormProps {
  formData: {
    client_id: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_company: string;
    client_address: string;
    client_city?: string;
    client_country?: string;
    client_tax_id?: string;
    client_is_company: boolean;
    project_id: string;
    project_title: string;
    quotation_number: string;
    valid_until: string;
    status: QuotationStatus;
    currency: string;
    description: string;
    notes: string;
    terms_and_conditions?: string;
    tax_mode?: 'auto' | 'manual';
    manual_tax_adjustment?: number;
  };
  items: QuotationItem[];
  users: UserType[];
  projects: Project[];
  isManual: boolean;
  onFormDataChange: (data: any) => void;
  onItemsChange: (items: QuotationItem[]) => void;
  onIsManualChange: (isManual: boolean) => void;
  variant?: 'modern' | 'traditional';
  autoGenerateNumber?: boolean;
  onAutoGenerateNumberChange?: (auto: boolean) => void;
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
  variant = 'modern',
  autoGenerateNumber = true,
  onAutoGenerateNumberChange
}: QuotationFormProps) {
  const [taxRate, setTaxRate] = useState(5);
  const [defaultCurrency, setDefaultCurrency] = useState('AED');

  useEffect(() => {
    // Fetch tax and currency settings
    const loadSettings = async () => {
      try {
        const financeSettings = await getSettings<any>('finance');
        if (financeSettings) {
          setTaxRate(financeSettings.defaultTaxRate || 5);
          setDefaultCurrency(financeSettings.defaultCurrency || 'AED');
          // Update form data currency if not set
          if (!formData.currency || formData.currency === 'AED') {
            onFormDataChange({ ...formData, currency: financeSettings.defaultCurrency || 'AED' });
          }
        }
      } catch (error) {
        console.warn('Failed to load finance settings, using defaults');
      }
    };
    loadSettings();
  }, []);
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
    const autoTax = subtotal * (taxRate / 100);
    const tax = formData.tax_mode === 'manual' && formData.manual_tax_adjustment !== undefined 
      ? formData.manual_tax_adjustment 
      : autoTax;
    return { subtotal, tax, total: subtotal + tax, taxRate };
  }, [items, taxRate, formData.tax_mode, formData.manual_tax_adjustment]);

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
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Quotation Number</Label>
                  <button
                    type="button"
                    onClick={() => onAutoGenerateNumberChange?.(!autoGenerateNumber)}
                    className="flex items-center gap-1.5 text-[8px] font-black text-primary uppercase hover:underline"
                  >
                    {autoGenerateNumber ? <Lock size={10} /> : <Unlock size={10} />}
                    {autoGenerateNumber ? 'Auto' : 'Manual'}
                  </button>
                </div>
                <Input
                  value={formData.quotation_number}
                  onChange={e => onFormDataChange({ ...formData, quotation_number: e.target.value })}
                  className="h-9 border-border font-mono font-bold uppercase text-xs"
                  disabled={autoGenerateNumber}
                  placeholder={autoGenerateNumber ? "Auto-generated..." : "Enter quote number"}
                />
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
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Switch
                      checked={formData.client_is_company}
                      onCheckedChange={(checked) => onFormDataChange({ ...formData, client_is_company: checked })}
                    />
                    <Label className="text-[9px] font-bold uppercase tracking-widest cursor-pointer">Company Client</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Building2 size={10} /> {formData.client_is_company ? 'Company Name *' : 'Client Name *'}
                      </Label>
                      <Input
                        placeholder={formData.client_is_company ? "Acme Corporation" : "John Doe"}
                        value={formData.client_is_company ? formData.client_company : formData.client_name}
                        onChange={e => onFormDataChange(formData.client_is_company ? { ...formData, client_company: e.target.value } : { ...formData, client_name: e.target.value })}
                        className="h-9 border-border text-xs font-bold mt-1.5"
                      />
                    </div>
                    
                    {formData.client_is_company && (
                      <div className="col-span-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <User size={10} /> Contact Person
                        </Label>
                        <Input
                          placeholder="John Doe"
                          value={formData.client_name}
                          onChange={e => onFormDataChange({ ...formData, client_name: e.target.value })}
                          className="h-9 border-border text-xs mt-1.5"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Globe size={10} /> Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.client_email}
                        onChange={e => onFormDataChange({ ...formData, client_email: e.target.value })}
                        className="h-9 border-border text-xs mt-1.5"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Phone size={10} /> Phone
                      </Label>
                      <Input
                        placeholder="+971 XX XXX XXXX"
                        value={formData.client_phone || ''}
                        onChange={e => onFormDataChange({ ...formData, client_phone: e.target.value })}
                        className="h-9 border-border text-xs mt-1.5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> Address
                    </Label>
                    <Textarea
                      placeholder="Street Address"
                      value={formData.client_address}
                      onChange={e => onFormDataChange({ ...formData, client_address: e.target.value })}
                      className="min-h-[60px] text-xs border-border mt-1.5"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">City</Label>
                      <Input
                        placeholder="Dubai"
                        value={formData.client_city || ''}
                        onChange={e => onFormDataChange({ ...formData, client_city: e.target.value })}
                        className="h-9 border-border text-xs mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Country</Label>
                      <Input
                        placeholder="United Arab Emirates"
                        value={formData.client_country || ''}
                        onChange={e => onFormDataChange({ ...formData, client_country: e.target.value })}
                        className="h-9 border-border text-xs mt-1.5"
                      />
                    </div>
                  </div>
                  
                  {formData.client_is_company && (
                    <div>
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tax ID / VAT Number</Label>
                      <Input
                        placeholder="TRN: 123456789012345"
                        value={formData.client_tax_id || ''}
                        onChange={e => onFormDataChange({ ...formData, client_tax_id: e.target.value })}
                        className="h-9 border-border text-xs font-mono mt-1.5"
                      />
                    </div>
                  )}
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
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
                    <Textarea value={formData.notes} onChange={e => onFormDataChange({ ...formData, notes: e.target.value })} className="min-h-[100px] border-border text-xs resize-none" placeholder="Administrative notes..." />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terms & Conditions</Label>
                    <Textarea 
                      value={formData.terms_and_conditions || ''} 
                      onChange={e => onFormDataChange({ ...formData, terms_and_conditions: e.target.value })} 
                      className="min-h-[120px] border-border text-xs resize-none" 
                      placeholder="Enter terms and conditions, payment terms, delivery terms, warranties, etc..." 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal Position</span>
                    <span className="text-sm font-black text-foreground">{formData.currency} {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tax ({taxRate}%)</span>
                        <div className="flex items-center gap-1 text-[8px]">
                          <button
                            type="button"
                            onClick={() => onFormDataChange({ ...formData, tax_mode: 'auto', manual_tax_adjustment: undefined })}
                            className={`px-2 py-0.5 rounded uppercase font-bold ${
                              (formData.tax_mode || 'auto') === 'auto' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => onFormDataChange({ ...formData, tax_mode: 'manual' })}
                            className={`px-2 py-0.5 rounded uppercase font-bold ${
                              formData.tax_mode === 'manual' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            Manual
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-black text-foreground">{formData.currency} {totals.tax.toLocaleString()}</span>
                    </div>
                    {formData.tax_mode === 'manual' && (
                      <div className="flex items-center gap-2 pl-4">
                        <Label className="text-[8px] uppercase tracking-widest">Adjust Tax:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.manual_tax_adjustment || 0}
                          onChange={e => onFormDataChange({ ...formData, manual_tax_adjustment: parseFloat(e.target.value) || 0 })}
                          className="h-7 w-32 text-xs font-mono"
                          placeholder="Enter tax amount"
                        />
                      </div>
                    )}
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

                    {formData.client_is_company && (
                      <div className="space-y-2">
                        <Label htmlFor="client_company" className="text-xs flex items-center gap-1">
                          <Building2 size={12} /> Company Name *
                        </Label>
                        <Input
                          id="client_company"
                          placeholder="Company Name"
                          value={formData.client_company}
                          onChange={(e) => onFormDataChange({ ...formData, client_company: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client_name" className="text-xs flex items-center gap-1">
                          <User size={12} /> {formData.client_is_company ? 'Contact Person (Optional)' : 'Client Name *'}
                        </Label>
                        <Input
                          id="client_name"
                          placeholder="John Doe"
                          value={formData.client_name}
                          onChange={(e) => onFormDataChange({ ...formData, client_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_email" className="text-xs flex items-center gap-1">
                          <Globe size={12} /> Email
                        </Label>
                        <Input
                          id="client_email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.client_email}
                          onChange={(e) => onFormDataChange({ ...formData, client_email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client_phone" className="text-xs flex items-center gap-1">
                          <Phone size={12} /> Phone
                        </Label>
                        <Input
                          id="client_phone"
                          placeholder="+971 XX XXX XXXX"
                          value={formData.client_phone || ''}
                          onChange={(e) => onFormDataChange({ ...formData, client_phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_city" className="text-xs">City</Label>
                        <Input
                          id="client_city"
                          placeholder="Dubai"
                          value={formData.client_city || ''}
                          onChange={(e) => onFormDataChange({ ...formData, client_city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client_address" className="text-xs flex items-center gap-1">
                          <MapPin size={12} /> Address
                        </Label>
                        <Textarea
                          id="client_address"
                          placeholder="Street Address"
                          value={formData.client_address}
                          onChange={(e) => onFormDataChange({ ...formData, client_address: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_country" className="text-xs">Country</Label>
                        <Input
                          id="client_country"
                          placeholder="United Arab Emirates"
                          value={formData.client_country || ''}
                          onChange={(e) => onFormDataChange({ ...formData, client_country: e.target.value })}
                        />
                      </div>
                    </div>

                    {formData.client_is_company && (
                      <div className="space-y-2">
                        <Label htmlFor="client_tax_id" className="text-xs">Tax ID / VAT Number</Label>
                        <Input
                          id="client_tax_id"
                          placeholder="TRN: 123456789012345"
                          value={formData.client_tax_id || ''}
                          onChange={(e) => onFormDataChange({ ...formData, client_tax_id: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    )}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quotation_number" className="text-xs">Quotation Number *</Label>
                    <button
                      type="button"
                      onClick={() => onAutoGenerateNumberChange?.(!autoGenerateNumber)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                    >
                      {autoGenerateNumber ? <Lock size={12} /> : <Unlock size={12} />}
                      {autoGenerateNumber ? 'Auto' : 'Manual'}
                    </button>
                  </div>
                  <Input
                    id="quotation_number"
                    value={formData.quotation_number}
                    onChange={(e) => onFormDataChange({ ...formData, quotation_number: e.target.value })}
                    disabled={autoGenerateNumber}
                    placeholder={autoGenerateNumber ? "Auto-generated..." : "Enter quote number"}
                    className="font-mono"
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
                  <span>Tax ({taxRate}%):</span>
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

              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions" className="text-xs">Terms & Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  placeholder="Enter terms and conditions, payment terms, delivery terms, warranties, etc..."
                  value={formData.terms_and_conditions || ''}
                  onChange={(e) => onFormDataChange({ ...formData, terms_and_conditions: e.target.value })}
                  className="min-h-[100px] text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
