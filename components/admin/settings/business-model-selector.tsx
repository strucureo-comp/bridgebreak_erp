'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Factory, ShoppingBag, Briefcase, Truck,
    HardHat, Hotel,
    Building2, Network, Globe, Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BusinessType =
    | 'manufacturing' | 'retail' | 'service' | 'trading'
    | 'construction' | 'hospitality'
    | 'logistics' | 'ngo' | 'real_estate' | 'holding';

export type CompanySize = 'startup' | 'sme' | 'enterprise';

interface BusinessModelSelectorProps {
    value: { type: BusinessType; size: CompanySize };
    onChange: (value: { type: BusinessType; size: CompanySize }) => void;
}

const BUSINESS_TYPES: { id: BusinessType; label: string; icon: any; desc: string }[] = [
    { id: 'manufacturing', label: 'Manufacturing', icon: Factory, desc: 'Production & BOM' },
    { id: 'retail', label: 'Retail', icon: ShoppingBag, desc: 'POS & Stock' },
    { id: 'service', label: 'Service', icon: Briefcase, desc: 'Projects & Time' },
    { id: 'trading', label: 'Trading', icon: Boxes, desc: 'Logistics & Inventory' },
    { id: 'construction', label: 'Construction', icon: HardHat, desc: 'Site & Contractors' },
    { id: 'hospitality', label: 'Hospitality', icon: Hotel, desc: 'Bookings & F&B' },
    { id: 'real_estate', label: 'Real Estate', icon: Building2, desc: 'Property Sales' },
    { id: 'logistics', label: 'Logistics', icon: Truck, desc: 'Fleet & Tracking' },
    { id: 'holding', label: 'Holding Co.', icon: Network, desc: 'Consolidation' },
    { id: 'ngo', label: 'Non-Profit', icon: Globe, desc: 'Grants & Projects' },
];

export function BusinessModelSelector({ value, onChange }: BusinessModelSelectorProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">1. Business Sector</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {BUSINESS_TYPES.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onChange({ ...value, type: item.id })}
                            className={cn(
                                "cursor-pointer rounded-md border p-4 transition-all duration-200 group",
                                value.type === item.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-md flex items-center justify-center mb-3 transition-colors",
                                value.type === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                            )}>
                                <item.icon className="h-4 w-4" />
                            </div>
                            <h4 className={cn("font-bold text-xs uppercase tracking-tight", value.type === item.id ? "text-foreground" : "text-foreground")}>{item.label}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight uppercase tracking-tighter">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">2. Operational Scale</Label>
                </div>
                <RadioGroup
                    value={value.size}
                    onValueChange={(v) => onChange({ ...value, size: v as CompanySize })}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                    {[
                        { id: 'startup', label: 'Startup', desc: '< 50 STAFF' },
                        { id: 'sme', label: 'Growth / SME', desc: '50 - 500 STAFF' },
                        { id: 'enterprise', label: 'Enterprise', desc: '500+ STAFF' },
                    ].map((size) => (
                        <div key={size.id}>
                            <RadioGroupItem value={size.id} id={size.id} className="peer sr-only" />
                            <Label
                                htmlFor={size.id}
                                className="flex flex-col items-center justify-center rounded-md border border-border bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                            >
                                <span className="font-bold text-sm uppercase tracking-widest mb-1">{size.label}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{size.desc}</span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    );
}
