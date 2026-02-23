"use client";

import React from "react";
import { format } from "date-fns";
import { Building } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Allocation, Sku } from "../_lib/data";

interface SiteAllocationProps {
    allocations: Allocation[];
    skus: Sku[];
}

export function SiteAllocation({ allocations, skus }: SiteAllocationProps) {
    return (
        <Card className="rounded-xl border-border bg-white shadow-sm p-0 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Destination Site</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allocations.map((alloc) => (
                        <TableRow key={alloc.id}>
                            <TableCell className="text-muted-foreground">{format(new Date(alloc.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-medium text-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-primary/70" />
                                    {alloc.site}
                                </div>
                            </TableCell>
                            <TableCell>{alloc.skuId} - <span className="text-muted-foreground text-sm hidden sm:inline">{skus.find(s => s.id === alloc.skuId)?.name}</span></TableCell>
                            <TableCell className="text-right font-medium">{alloc.quantity}</TableCell>
                        </TableRow>
                    ))}
                    {allocations.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No site allocations recorded yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
