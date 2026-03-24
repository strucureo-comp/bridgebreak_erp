'use client';

import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { ManufacturingContent } from './_components/manufacturing-content';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Factory, Activity, Box, AlertTriangle } from 'lucide-react';

export default function ManufacturingPage() {
    const { getModuleLabel } = useTenant();
    return (
        <ModuleGuard module="manufacturing">
            <div className="space-y-6 max-w-6xl">
                <div>
                        <h1 className="text-2xl font-semibold">{getModuleLabel('manufacturing')}</h1>
                        <p className="text-muted-foreground">Manage production planning, execution, and BOM.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <KPI title="Active Orders" value="3" icon={Factory} />
                    <KPI title="Work in Progress" value="120 hrs" icon={Activity} />
                    <KPI title="Components Low" value="2" icon={AlertTriangle} />
                    <KPI title="Finished Goods" value="450" icon={Box} />
                </div>

                <ManufacturingContent boms={[]} orders={[]} onRefresh={() => { }} />
            </div>
        </ModuleGuard>
    );
}

function KPI({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
