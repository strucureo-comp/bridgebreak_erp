'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DollarSign, ShoppingCart, Cog,
    Users, Package, Briefcase,
    Shield, BarChart3, Factory
} from 'lucide-react';

interface ModuleSelectorProps {
    businessType: string;
    onChange: (modules: Record<string, boolean>) => void;
}

export function ModuleSelector({ businessType, onChange }: ModuleSelectorProps) {
    const modules = [
        { id: 'finance', label: 'Finance & Accounts', icon: DollarSign, core: true },
        { id: 'sales', label: 'Sales & CRM', icon: ShoppingCart, core: true },
        { id: 'operations', label: 'Operations Hub', icon: Cog, core: true },
        { id: 'hr', label: 'Workforce OS', icon: Users, core: false },
        { id: 'inventory', label: 'Inventory Control', icon: Package, core: businessType === 'manufacturing' || businessType === 'retail' },
        { id: 'projects', label: 'Project Portfolio', icon: Briefcase, core: businessType === 'construction' || businessType === 'services' },
        { id: 'manufacturing', label: 'MRP Engine', icon: Factory, core: businessType === 'manufacturing' },
        { id: 'reports', label: 'Strategic BI', icon: BarChart3, core: false },
        { id: 'compliance', label: 'Legal Vault', icon: Shield, core: false },
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
                        checked={m.core}
                        onCheckedChange={(checked) => {
                            // In a real app we'd manage state here
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
