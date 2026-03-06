"use client";

import React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { History, User, FileText, ArrowUpDown } from "lucide-react";

interface StockMovementLogProps {
    movements: any[];
}

export function StockMovementLog({ movements }: StockMovementLogProps) {
    return (
        <Card className="rounded-xl border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Timestamp / Reference</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center">Event Type</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">SKU / Item</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Qty Delta</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Performed By</TableHead>
                            <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Notes / Reason</th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((mov, idx) => {
                            const dateStr = mov.createdAt || mov.timestamp || new Date().toISOString();
                            const type = mov.type || 'Movement';
                            const sku = mov.item_id?.sku || mov.skuId || 'UNKNOWN';
                            const qty = mov.quantity || 0;
                            const user = mov.posted_by || mov.user || 'System';
                            const ref = mov.transaction_id || mov.id || `TX-${idx}`;

                            return (
                                <TableRow key={ref} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">{format(new Date(dateStr), "MMM dd, HH:mm")}</span>
                                            <span className="text-[9px] font-bold text-red-600 font-mono tracking-tighter">{ref}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-black h-5 px-2 uppercase tracking-tighter rounded-sm border-none",
                                            type === "GRN" || type === "Increase" ? "bg-emerald-100 text-emerald-700" :
                                                type === "waste" || type === "Waste" ? "bg-red-100 text-red-700" :
                                                    "bg-slate-100 text-slate-600"
                                        )}>
                                            {type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">{sku}</span>
                                            {mov.item_id?.name && <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px] uppercase tracking-tighter">{mov.item_id.name}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 font-black text-sm">
                                            <span className={qty > 0 ? "text-emerald-600" : "text-red-600"}>
                                                {qty > 0 ? "+" : ""}{qty.toLocaleString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500 truncate max-w-[80px]">{user}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                            <FileText className="h-3 w-3 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 italic max-w-[150px] truncate leading-tight">
                                                {mov.reference_no || mov.notes || "No additional context"}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {movements.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                        <History className="h-8 w-8" />
                                        <p className="text-sm font-bold uppercase tracking-widest">The movement ledger is empty</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
