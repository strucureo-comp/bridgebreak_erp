'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { 
    RefreshCcw, 
    Factory, 
    ClipboardList, 
    Layers, 
    Activity, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    AlertTriangle 
} from 'lucide-react';
import { getBOMs, getProductionOrders } from '@/lib/api';
import { ManufacturingContent } from '@/components/manufacturing/manufacturing-content';
import { ModuleGuard } from '@/components/shared/layout/module-guard';
import { useTenant } from '@/lib/tenant-context';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ProductionPage() {
  const { getModuleLabel } = useTenant();
  const [boms, setBoms] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [bomData, orderData] = await Promise.all([
        getBOMs().catch(() => []),
        getProductionOrders().catch(() => [])
      ]);
      setBoms(bomData);
      setOrders(orderData);
    } catch (err) {
      console.error('[Production Hub] Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing Shop Floor Data</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <ModuleGuard module="manufacturing">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-foreground text-card-foreground flex items-center justify-center shadow-sm">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">{getModuleLabel('manufacturing')}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Production Control & Shop Floor Registry</p>
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsTile title="Active BOMs" value={boms.length} icon={Layers} label="Master Definitions" />
            <StatsTile title="Work Orders" value={orders.length} icon={ClipboardList} label="In-Pipeline" highlight />
            <StatsTile title="Completed" value="0" icon={CheckCircle2} label="This Month" />
            <StatsTile title="Efficiency" value="92%" icon={Activity} label="Shop Floor Metric" />
          </div>

          <ManufacturingContent boms={boms} orders={orders} onRefresh={fetchAll} />
        </div>
      </ModuleGuard>
    </DashboardShell>
  );
}

function StatsTile({ title, value, icon: Icon, label, highlight }: { title: string; value: any; icon: any; label: string; highlight?: boolean }) {
    return (
      <Card className={cn(
        "border border-border shadow-sm rounded-md bg-card p-5 relative overflow-hidden",
        highlight && "border-primary/20 bg-primary/5"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center border transition-colors",
            highlight ? "bg-primary text-card-foreground border-primary" : "bg-muted border-border text-muted-foreground"
          )}>
            <Icon size={16} />
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-xl font-black text-foreground tracking-tight">{value}</h3>
          <p className={cn("text-[8px] font-black uppercase tracking-tighter", highlight ? "text-primary" : "text-muted-foreground")}>{label}</p>
        </div>
      </Card>
    );
}
