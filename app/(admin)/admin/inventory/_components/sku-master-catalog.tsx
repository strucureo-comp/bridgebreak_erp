"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
    Barcode, QrCode, ShieldCheck, ShieldAlert,
    ArrowUpRight, Info, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SkuMasterCatalogProps {
    skus: any[];
    wasteTolerancePercent: number;
}

export function SkuMasterCatalog({ skus, wasteTolerancePercent }: SkuMasterCatalogProps) {
    return (
        <Card className="rounded-xl border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px] font-bold text-slate-500 text-[10px] uppercase tracking-wider">Item ID / SKU</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Product Description</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">On Hand</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Condition</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Unit Cost</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Holding Value</TableHead>
                            <TableHead className="text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">Waste Metrics</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {skus.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                        <Info className="h-8 w-8" />
                                        <p className="text-sm font-medium">No inventory items available</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {skus.map((sku) => {
                            const isZero = sku.stock === 0;
                            const isLow = sku.stock > 0 && sku.stock < sku.minThreshold;
                            const value = sku.stock * sku.costPerUnit;

                            return (
                                <TableRow key={sku.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-bold text-red-600 font-mono text-xs">{sku.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm tracking-tight">{sku.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4 uppercase tracking-tighter bg-slate-100 text-slate-600 border-none">
                                                    {sku.category}
                                                </Badge>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Barcode className="h-3 w-3 text-slate-400" />
                                                    <QrCode className="h-3 w-3 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-slate-900 text-sm">{sku.stock.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{sku.unit}</span></span>
                                            <div className="w-20 mt-1.5">
                                                <Progress
                                                    value={Math.min(100, (sku.stock / (sku.minThreshold * 3)) * 100)}
                                                    className={`h-1 ${isZero ? '[&>div]:bg-red-500 bg-red-100' : isLow ? '[&>div]:bg-orange-500 bg-orange-100' : '[&>div]:bg-emerald-500 bg-emerald-100'}`}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isZero ? (
                                            <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Stockout
                                            </div>
                                        ) : isLow ? (
                                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] uppercase">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Reorder
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Healthy
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-slate-500">${sku.costPerUnit.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900 text-sm">${value.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={sku.wastePercent > wasteTolerancePercent ? "text-red-600 font-black text-xs" : "text-slate-600 font-bold text-xs"}>
                                                {sku.wastePercent.toFixed(1)}%
                                            </span>
                                            {sku.wastePercent > wasteTolerancePercent && (
                                                <span className="text-[8px] font-black bg-red-100 text-red-700 px-1 rounded-sm uppercase tracking-tighter">Warning</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 transition-colors">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 font-bold text-[11px] uppercase tracking-wide">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Info className="mr-2 h-3.5 w-3.5" /> View Analytics
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <ArrowUpRight className="mr-2 h-3.5 w-3.5" /> Movement History
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 cursor-pointer">
                                                    Delete SKU
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
