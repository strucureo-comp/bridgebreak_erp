"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Sku } from "../_lib/data";

interface SkuMasterCatalogProps {
    skus: Sku[];
    wasteTolerancePercent: number;
}

export function SkuMasterCatalog({ skus, wasteTolerancePercent }: SkuMasterCatalogProps) {
    return (
        <Card className="rounded-xl border-border overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[100px] font-semibold text-muted-foreground">SKU</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground">Stock</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground hidden md:table-cell">Cost</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground hidden lg:table-cell">Value</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground">Waste %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {skus.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No SKUs found.</TableCell>
                            </TableRow>
                        )}
                        {skus.map((sku) => {
                            const isZero = sku.stock === 0;
                            const isLow = sku.stock > 0 && sku.stock < sku.minThreshold;
                            const value = sku.stock * sku.costPerUnit;

                            return (
                                <TableRow key={sku.id} className="hover:bg-background transition-colors">
                                    <TableCell className="font-medium text-foreground">{sku.id}</TableCell>
                                    <TableCell>
                                        <div>{sku.name}</div>
                                        <div className="text-xs text-muted-foreground">{sku.category}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium">{sku.stock} <span className="text-xs text-muted-foreground font-normal">{sku.unit}</span></div>
                                        <Progress
                                            value={Math.min(100, (sku.stock / (sku.minThreshold * 3)) * 100)}
                                            className={`h-1.5 mt-2 ${isZero ? '[&>div]:bg-red-500 bg-red-100' : isLow ? '[&>div]:bg-orange-500 bg-orange-100' : '[&>div]:bg-emerald-500 bg-emerald-100'}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {isZero ? (
                                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Critical</Badge>
                                        ) : isLow ? (
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Low Stock</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Healthy</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground hidden md:table-cell">${sku.costPerUnit.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium hidden lg:table-cell">${value.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={sku.wastePercent > wasteTolerancePercent ? "text-red-600 font-medium" : "text-muted-foreground"}>
                                            {sku.wastePercent.toFixed(1)}%
                                        </span>
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
