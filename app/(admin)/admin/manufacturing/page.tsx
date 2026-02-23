'use client';

import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { useTenant } from '@/lib/tenant-context';
import { ManufacturingContent } from './_components/manufacturing-content';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Factory, Activity, Box, AlertTriangle } from 'lucide-react';

export default function ManufacturingPage() {
    const { getModuleLabel } = useTenant();
    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">{getModuleLabel('manufacturing')}</h1>
                        <p className="text-muted-foreground font-medium">Production planning, execution, and BOM management.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <KPI title="Active Orders" value="3" icon={Factory} color="orange" />
                    <KPI title="Work in Progress" value="120 hrs" icon={Activity} color="blue" />
                    <KPI title="Components Low" value="2" icon={AlertTriangle} color="red" />
                    <KPI title="Finished Goods" value="450" icon={Box} color="green" />
                </div>

                <ManufacturingContent boms={[]} orders={[]} onRefresh={() => { }} />
            </div>
        </DashboardShell>
    );
}

function KPI({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
    };
    return (
        <Card className="rounded-[2rem] border-none shadow-sm bg-card p-6">
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${variants[color]}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{title}</p>
                    <h3 className="text-2xl font-black text-foreground">{value}</h3>
                </div>
            </div>
        </Card>
    )
}
