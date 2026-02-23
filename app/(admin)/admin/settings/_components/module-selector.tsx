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
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                            <m.icon size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                {m.label}
                                {m.core && (
                                    <Badge variant="secondary" className="text-[10px] py-0 h-4 border-emerald-100 text-emerald-600 bg-emerald-50">
                                        Core
                                    </Badge>
                                )}
                            </Label>
                        </div>
                    </div>
                    <Switch
                        checked={activeModules ? !!activeModules[m.id] : m.core}
                        onCheckedChange={(checked) => {
                            // Build a complete map with all modules
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
