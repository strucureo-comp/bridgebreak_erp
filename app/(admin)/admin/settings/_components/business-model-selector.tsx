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
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Sector Vertical</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {types.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onChange({ ...value, type: t.id as BusinessType })}
                            className={cn(
                                "cursor-pointer p-5 rounded-2xl border transition-all flex items-start gap-4 hover:shadow-md active:scale-[0.98]",
                                value.type === t.id
                                    ? "border-red-600 bg-red-50/10 shadow-sm"
                                    : "border-slate-100 bg-white"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                value.type === t.id ? "bg-red-600 text-white" : "bg-slate-50 text-slate-400"
                            )}>
                                <t.icon className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{t.label}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-60">{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Corporate Scale</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sizes.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => onChange({ ...value, size: s.id as CompanySize })}
                            className={cn(
                                "cursor-pointer p-5 rounded-xl border transition-all flex items-center gap-5 hover:shadow-md",
                                value.size === s.id
                                    ? "border-emerald-600 bg-emerald-50/10 shadow-sm"
                                    : "border-slate-100 bg-white"
                            )}
                        >
                            <div className={cn(
                                "h-11 w-11 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                                value.size === s.id ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400"
                            )}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{s.label}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
