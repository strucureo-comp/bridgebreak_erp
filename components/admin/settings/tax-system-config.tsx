'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Landmark, Info, Plus, Trash2, Calculator, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaxRegime = 'GST_INDIA' | 'VAT_UAE' | 'VAT_EU' | 'SALES_TAX_US' | 'VAT_UK' | 'NONE';

interface TaxRate {
    id: string;
    name: string;
    rate: number;
    type: string;
}

interface TaxSystemConfigProps {
    onChange: (config: any) => void;
}

const REGIME_DEFAULTS: Record<TaxRegime, TaxRate[]> = {
    GST_INDIA: [
        { id: '1', name: 'CGST', rate: 9, type: 'CGST' },
        { id: '2', name: 'SGST', rate: 9, type: 'SGST' },
        { id: '3', name: 'IGST', rate: 18, type: 'IGST' },
    ],
    VAT_UAE: [
        { id: '1', name: 'VAT Standard', rate: 5, type: 'VAT' },
    ],
    VAT_EU: [
        { id: '1', name: 'VAT Standard', rate: 20, type: 'VAT' },
    ],
    SALES_TAX_US: [
        { id: '1', name: 'State Tax', rate: 6.25, type: 'SALES_TAX' },
    ],
    VAT_UK: [
        { id: '1', name: 'VAT Standard', rate: 20, type: 'VAT' },
    ],
    NONE: [],
};

export function TaxSystemConfig({ onChange }: TaxSystemConfigProps) {
    const [regime, setRegime] = useState<TaxRegime>('NONE');
    const [rates, setRates] = useState<TaxRate[]>([]);
    const [autoApply, setAutoApply] = useState(true);

    const handleRegimeChange = (val: TaxRegime) => {
        setRegime(val);
        const defaults = REGIME_DEFAULTS[val] || [];
        setRates(defaults);
        onChange({ regime: val, rates: defaults, autoApply });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Tax Configuration</Label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm rounded-md bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/50 py-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Jurisdiction & ID</CardTitle>
                    </CardHeader>
                    <div className="p-6 space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Region</Label>
                                <Select value={regime} onValueChange={handleRegimeChange}>
                                    <SelectTrigger className="h-9 rounded-md border-border text-xs font-bold">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GST_INDIA">India (GST)</SelectItem>
                                        <SelectItem value="VAT_UAE">UAE (VAT)</SelectItem>
                                        <SelectItem value="VAT_EU">Europe (VAT)</SelectItem>
                                        <SelectItem value="SALES_TAX_US">USA (Sales Tax)</SelectItem>
                                        <SelectItem value="VAT_UK">UK (VAT)</SelectItem>
                                        <SelectItem value="NONE">None / Exempt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registration (TRN)</Label>
                                <Input placeholder="Official ID" className="h-9 border-border text-xs font-bold" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Tax Rate Matrix</Label>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-primary">
                                    <Plus className="h-3 w-3 mr-1" /> Add Rate
                                </Button>
                            </div>

                            <div className="divide-y border rounded-md overflow-hidden">
                                {rates.map((rate) => (
                                    <div key={rate.id} className="flex items-center gap-4 p-3 hover:bg-accent hover:text-accent-foreground transition-colors group">
                                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                            <Calculator className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-foreground uppercase">{rate.name}</p>
                                            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tighter">{rate.type}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input defaultValue={rate.rate} type="number" className="h-8 w-16 text-right text-[11px] font-black border-border pr-2" />
                                            <span className="text-[10px] font-bold text-muted-foreground/60">%</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {rates.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground italic">
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Select region to load rates</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="border shadow-sm rounded-md bg-foreground text-card-foreground p-6 relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <div className="h-9 w-9 rounded-md bg-primary text-card-foreground flex items-center justify-center shadow-sm">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase tracking-widest">Compliance</h3>
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                                    System automatically calculates and posts tax entries based on these rules.
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Auto-Apply</span>
                                <Switch checked={autoApply} onCheckedChange={setAutoApply} className="scale-75" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border shadow-sm rounded-md bg-muted p-4 border-border">
                        <div className="flex gap-3">
                            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-tight">
                                Rate changes only affect new transactions. Historical data is locked for audit integrity.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
