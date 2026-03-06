'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DollarSign, ShoppingCart, Cog,
    Users, Package, Briefcase,
    Shield, BarChart3, Factory, Building2
} from 'lucide-react';

interface ModuleSelectorProps {
    businessType: string;
    activeModules?: Record<string, boolean>;
    onChange: (modules: Record<string, boolean>) => void;
}

export function ModuleSelector({ businessType, activeModules, onChange }: ModuleSelectorProps) {
    const modules = [
        { id: 'finance', label: 'Finance', icon: DollarSign, core: true },
        { id: 'sales', label: 'Sales', icon: ShoppingCart, core: true },
        { id: 'operations', label: 'Operations', icon: Cog, core: true },
        { id: 'hr', label: 'Human Resources', icon: Users, core: false },
        { id: 'inventory', label: 'Inventory', icon: Package, core: businessType === 'manufacturing' || businessType === 'retail' },
        { id: 'projects', label: 'Projects', icon: Briefcase, core: businessType === 'construction' || businessType === 'services' },
        { id: 'purchases', label: 'Procurement', icon: Building2, core: true },
        { id: 'manufacturing', label: 'Manufacturing', icon: Factory, core: businessType === 'manufacturing' },
        { id: 'reports', label: 'Reports', icon: BarChart3, core: false },
        { id: 'compliance', label: 'Legal & Compliance', icon: Shield, core: false },
    ];

    return (
        <div className="space-y-4">
            {modules.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100",
                            activeModules?.[m.id] ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-400"
                        )}>
                            <m.icon size={18} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-3">
                                {m.label}
                                {m.core && (
                                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest h-4 px-2 bg-emerald-50 text-emerald-600 border-none">
                                        Core Asset
                                    </Badge>
                                )}
                            </Label>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Operational Node</p>
                        </div>
                    </div>
                    <Switch
                        checked={activeModules ? !!activeModules[m.id] : m.core}
                        onCheckedChange={(checked) => {
                            const allModules: Record<string, boolean> = {};
                            modules.forEach(mod => {
                                allModules[mod.id] = activeModules ? !!activeModules[mod.id] : mod.core;
                            });
                            allModules[m.id] = checked;
                            onChange(allModules);
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
