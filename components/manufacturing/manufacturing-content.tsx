"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBOMs, createBOM, getProductionOrders, createProductionOrder, updateProductionOrder, getProducts } from "@/lib/api";
import { format } from "date-fns";
import { Layers, Factory, Plus, ArrowRight, Package, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ManufacturingContent() {
    return (
        <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl border border-slate-100">
                <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                    <Factory className="mr-2 h-4 w-4" /> Production Orders
                </TabsTrigger>
                <TabsTrigger value="boms" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                    <Layers className="mr-2 h-4 w-4" /> Bill of Materials
                </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
                <ProductionOrderList />
            </TabsContent>

            <TabsContent value="boms">
                <BOMList />
            </TabsContent>
        </Tabs>
    );
}

function BOMList() {
    const [boms, setBoms] = useState<any[]>([]);

    useEffect(() => { load(); }, []);
    async function load() {
        const data = await getBOMs();
        setBoms(data || []);
    }

    // Checking "Create BOM" is complex due to component selection UI. 
    // Skipping complex creation UI for this iteration, focusing on list view first.

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Bill of Materials</CardTitle>
                    <CardDescription>Product recipes and component structures.</CardDescription>
                </div>
                <Button disabled><Plus className="mr-2 h-4 w-4" /> New BOM</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Finished Good</TableHead>
                            <TableHead>Yield</TableHead>
                            <TableHead>Components</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {boms.map(bom => (
                            <TableRow key={bom.id}>
                                <TableCell className="font-bold">{bom.name}</TableCell>
                                <TableCell>{bom.variant?.product?.name} ({bom.variant?.name})</TableCell>
                                <TableCell>{Number(bom.quantity)}</TableCell>
                                <TableCell>{bom.components?.length || 0}</TableCell>
                                <TableCell><Badge variant={bom.active ? 'default' : 'secondary'}>{bom.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {boms.length === 0 && <div className="p-8 text-center text-slate-500">No BOMs defined.</div>}
            </CardContent>
        </Card>
    )
}

function ProductionOrderList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [boms, setBoms] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form
    const [selectedBom, setSelectedBom] = useState("");
    const [qty, setQty] = useState("1");
    const [date, setDate] = useState("");

    useEffect(() => { load(); }, []);

    async function load() {
        const [oData, bData] = await Promise.all([getProductionOrders(), getBOMs()]);
        setOrders(oData || []);
        setBoms(bData || []);
    }

    async function handleCreate() {
        if (!selectedBom) return toast.error("Select a BOM");
        try {
            await createProductionOrder({
                bom_id: selectedBom,
                quantity: Number(qty),
                start_date: date
            });
            toast.success("Production Order Created");
            setIsCreateOpen(false);
            load();
        } catch (e) { toast.error("Failed to create order"); }
    }

    async function handleStatusChange(id: string, status: string) {
        try {
            await updateProductionOrder(id, status);
            toast.success(`Order ${status}`);
            load();
        } catch (e) { toast.error("Update failed"); }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">Production Schedule</h3>
                    <p className="text-slate-500 text-sm">Manage manufacturing jobs and component consumption.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Order</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Production Order</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Product (BOM)</Label>
                                <Select onValueChange={setSelectedBom}>
                                    <SelectTrigger><SelectValue placeholder="Select BOM" /></SelectTrigger>
                                    <SelectContent>
                                        {boms.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} ({b.variant?.product?.name})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity to Produce</Label>
                                <Input type="number" value={qty} onChange={e => setQty(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreate}>Release Order</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {orders.map(order => (
                    <Card key={order.id} className="overflow-hidden">
                        <div className="flex items-center p-6 gap-6">
                            <div className="h-16 w-16 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <Factory size={32} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-lg">{order.number}</h4>
                                        <p className="text-slate-500">{order.variant?.product?.name} ({order.variant?.name})</p>
                                    </div>
                                    <Badge className={
                                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'released' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                    }>
                                        {order.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
                                    <span className="flex items-center"><Package className="mr-2 h-4 w-4" /> Qty: {Number(order.quantity)}</span>
                                    <span className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Due: {order.end_date ? format(new Date(order.end_date), 'MMM d') : 'Pending'}</span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    {order.status === 'planned' && (
                                        <Button size="sm" onClick={() => handleStatusChange(order.id, 'released')}>Release to Floor</Button>
                                    )}
                                    {order.status === 'released' && (
                                        <Button size="sm" onClick={() => handleStatusChange(order.id, 'completed')}>Mark Completed</Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
                {orders.length === 0 && <div className="text-center p-8 text-slate-400">No active production orders.</div>}
            </div>
        </div>
    )
}
