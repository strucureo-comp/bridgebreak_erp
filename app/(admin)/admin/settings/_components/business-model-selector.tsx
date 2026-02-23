'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Factory, Building2, ShoppingCart,
    Construction, Rocket, Users,
    Briefcase, Globe
} from 'lucide-react';

export type BusinessType = 'manufacturing' | 'services' | 'retail' | 'construction' | 'consulting' | 'logistics';
export type CompanySize = 'startup' | 'smb' | 'enterprise';

interface BusinessModelSelectorProps {
    value: { type: BusinessType; size: CompanySize };
    onChange: (value: { type: BusinessType; size: CompanySize }) => void;
}

export function BusinessModelSelector({ value, onChange }: BusinessModelSelectorProps) {
    const types = [
        { id: 'manufacturing', label: 'Manufacturing', icon: Factory, desc: 'Production focus with BOM & WIP' },
        { id: 'services', label: 'Services', icon: Users, desc: 'Timesheets & utilization focus' },
        { id: 'retail', label: 'Retail / Trading', icon: ShoppingCart, desc: 'Fast inventory & sales focus' },
        { id: 'construction', label: 'EPC / Construction', icon: Construction, desc: 'Project-based cost control' },
        { id: 'logistics', label: 'Logistics', icon: Globe, desc: 'Supply chain & transport focus' },
    ];

    const sizes = [
        { id: 'startup', label: 'Emerging', icon: Rocket, desc: '< 50 Staff' },
        { id: 'smb', label: 'Growth', icon: Building2, desc: '50 - 500 Staff' },
        { id: 'enterprise', label: 'Scale', icon: Briefcase, desc: '500+ Staff' },
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label className="text-sm font-medium">Industry Sector</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {types.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onChange({ ...value, type: t.id as BusinessType })}
                            className={cn(
                                "cursor-pointer p-4 rounded-lg border transition-all flex items-start gap-3",
                                value.type === t.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:bg-muted/50"
                            )}
                        >
                            <t.icon className={cn(
                                "h-5 w-5 mt-0.5",
                                value.type === t.id ? "text-primary" : "text-muted-foreground"
                            )} />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">{t.label}</p>
                                <p className="text-xs text-muted-foreground">{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-medium">Company Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {sizes.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => onChange({ ...value, size: s.id as CompanySize })}
                            className={cn(
                                "cursor-pointer p-4 rounded-lg border transition-all flex items-center gap-4",
                                value.size === s.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:bg-muted/50"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-md flex items-center justify-center",
                                value.size === s.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{s.label}</p>
                                <p className="text-xs text-muted-foreground">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
