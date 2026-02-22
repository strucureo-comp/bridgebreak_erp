'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Factory, 
    Plus, 
    Settings2, 
    Layers, 
    ClipboardList, 
    Activity, 
    ChevronRight,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Boxes,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ManufacturingContentProps {
    boms: any[];
    orders: any[];
    onRefresh: () => void;
}

export function ManufacturingContent({ boms, orders, onRefresh }: ManufacturingContentProps) {
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-6">
            <Tabs defaultValue="orders" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 border h-10 p-0.5">
                        <TabsTrigger value="orders" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                           Work Orders
                        </TabsTrigger>
                        <TabsTrigger value="boms" className="text-xs font-semibold px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                           Master BOMs
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-9 gap-2 border-border font-bold uppercase text-[10px]">
                            <Plus className="h-3.5 w-3.5" /> Define BOM
                        </Button>
                        <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                            <Factory className="h-3.5 w-3.5" /> New Work Order
                        </Button>
                    </div>
                </div>

                <TabsContent value="orders" className="mt-0 space-y-6">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map(order => (
                            <Card key={order.id} className="border border-border shadow-sm rounded-md bg-card hover:border-primary/50 transition-colors group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                                            <ClipboardList size={20} />
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                                            order.status === 'in_progress' ? "bg-primary/5 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            {order.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-tight line-clamp-1">{order.item}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Order: {order.order_no} · Qty: {order.quantity}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md mb-4 border border-border">
                                        <div>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Start Date</p>
                                            <p className="text-xs font-black text-foreground">{new Date(order.start_date).toLocaleDateString('en-AE', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Priority</p>
                                            <p className={cn("text-xs font-black uppercase", order.priority === 'high' ? "text-primary" : "text-foreground")}>{order.priority}</p>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="w-full h-8 text-[9px] font-bold uppercase tracking-widest gap-2 rounded-md">
                                        Shop Floor View <ChevronRight size={12} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="boms" className="mt-0">
                    <Card className="border shadow-sm rounded-md overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">BOM Reference</th>
                                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Output Material</th>
                                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground text-center">Components</th>
                                        <th className="px-6 py-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                                        <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {boms.map((bom) => (
                                        <tr key={bom.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-foreground uppercase">{bom.name}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase">{bom.output_item}</td>
                                            <td className="px-6 py-4 text-xs font-black text-foreground text-center">{bom.components} Items</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none bg-emerald-50 text-emerald-700">
                                                    Active
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-primary transition-all">
                                                    <ChevronRight size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
