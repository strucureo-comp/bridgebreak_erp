'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    DollarSign, ShoppingCart, Users, Cog,
    Box, Briefcase, BarChart3,
    Truck, Layers, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessType } from './business-model-selector';

interface ModuleSelectorProps {
    businessType: BusinessType;
    onChange: (modules: Record<string, boolean>) => void;
}

const GET_MODULE_CONFIG = (sector: BusinessType) => {
    const base = [
        { id: 'finance', label: 'Finance', icon: DollarSign, desc: 'Ledger & Statutory Tax' },
        { id: 'sales', label: 'Sales CRM', icon: ShoppingCart, desc: 'Pipeline & Quotes' },
        { id: 'purchases', label: 'Procurement', icon: Truck, desc: 'Vendor & Supply Chain' },
        { id: 'inventory', label: 'Inventory', icon: Box, desc: 'Stock & Warehouse' },
        { id: 'hr', label: 'Human Resources', icon: Users, desc: 'Payroll & Workforce' },
        { id: 'projects', label: 'Projects', icon: Briefcase, desc: 'Tasks & Site Execution' },
        { id: 'manufacturing', label: 'Production', icon: Cog, desc: 'BOM & Fabrication' },
        { id: 'assets', label: 'Fixed Assets', icon: Layers, desc: 'Asset Depreciation' },
        { id: 'reports', label: 'Analytics', icon: BarChart3, desc: 'Business Intelligence' },
    ];

    return base.map(m => {
        if (sector === 'manufacturing') {
            if (m.id === 'inventory') return { ...m, label: 'Raw Materials', desc: 'RM & FG Stock Control' };
            if (m.id === 'manufacturing') return { ...m, label: 'Shop Floor', desc: 'Production Control' };
        }
        if (sector === 'construction') {
            if (m.id === 'inventory') return { ...m, label: 'Material Store', desc: 'On-site Material Issue' };
            if (m.id === 'projects') return { ...m, label: 'Site Records', desc: 'Daily Logs & Progress' };
            if (m.id === 'manufacturing') return { ...m, label: 'Fabrication', desc: 'Off-site Production' };
        }
        if (sector === 'retail') {
            if (m.id === 'sales') return { ...m, label: 'POS Terminal', desc: 'Point of Sale & Billing' };
        }
        if (sector === 'hospitality') {
            if (m.id === 'sales') return { ...m, label: 'Reservations', desc: 'Bookings & Front Desk' };
            if (m.id === 'inventory') return { ...m, label: 'Kitchen Stock', desc: 'F&B Inventory Mgmt' };
        }
        return m;
    });
};

const SECTOR_RECOMMENDED: Record<string, string[]> = {
    manufacturing: ['finance', 'hr', 'reports', 'inventory', 'manufacturing', 'purchases', 'assets'],
    retail: ['finance', 'hr', 'reports', 'sales', 'inventory'],
    service: ['finance', 'hr', 'reports', 'sales', 'projects'],
    construction: ['finance', 'hr', 'reports', 'inventory', 'projects', 'manufacturing'],
    hospitality: ['finance', 'hr', 'reports', 'sales', 'inventory'],
    real_estate: ['finance', 'reports', 'projects', 'sales', 'assets'],
    trading: ['finance', 'reports', 'sales', 'purchases', 'inventory'],
    logistics: ['finance', 'reports', 'sales', 'purchases', 'inventory', 'assets'],
    holding: ['finance', 'hr', 'reports', 'assets'],
    ngo: ['finance', 'hr', 'reports', 'projects'],
};

export function ModuleSelector({ businessType, onChange }: ModuleSelectorProps) {
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const dynamicModules = GET_MODULE_CONFIG(businessType);

    useEffect(() => {
        const recommendations = SECTOR_RECOMMENDED[businessType] || [];
        const newSelection: Record<string, boolean> = {};
        recommendations.forEach(id => {
            newSelection[id] = true;
        });
        setSelected(newSelection);
        onChange(newSelection);
    }, [businessType]);

    const toggle = (id: string) => {
        const newState = { ...selected, [id]: !selected[id] };
        setSelected(newState);
        onChange(newState);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">3. System Hubs</Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        Adaptive matrix for <span className="text-primary">{businessType}</span>
                    </p>
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                    {Object.values(selected).filter(Boolean).length} Hubs Enabled
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-3">
                {dynamicModules.map(module => {
                    const isRecommended = SECTOR_RECOMMENDED[businessType]?.includes(module.id);
                    const isActive = !!selected[module.id];
                    return (
                        <Card key={module.id} className={cn(
                            "rounded-md border shadow-sm transition-all duration-200",
                            isActive ? "bg-card border-primary" : "bg-muted border-border opacity-60 grayscale-[0.5]"
                        )}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex flex-1 min-w-0 items-center gap-3 pr-2">
                                    <div className={cn(
                                        "h-8 w-8 shrink-0 rounded-md flex items-center justify-center transition-colors",
                                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <module.icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-xs font-bold text-foreground uppercase tracking-tight truncate">{module.label}</h4>
                                            {isRecommended && isActive && (
                                                <Star className="h-2.5 w-2.5 fill-primary text-primary shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tighter mt-0.5 truncate">{module.desc}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={() => toggle(module.id)}
                                    className="scale-75 shrink-0"
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
