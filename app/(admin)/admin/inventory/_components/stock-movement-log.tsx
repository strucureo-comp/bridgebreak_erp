"use client";

import React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Movement, ROLES } from "../_lib/data";

interface StockMovementLogProps {
    movements: Movement[];
}

export function StockMovementLog({ movements }: StockMovementLogProps) {
    return (
        <Card className="rounded-xl border-border overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>User Role</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((mov) => (
                        <TableRow key={mov.id}>
                            <TableCell className="text-muted-foreground">{format(new Date(mov.timestamp), "MMM dd, yyyy HH:mm")}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={
                                    mov.type === "Increase" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                        mov.type === "Deduct" ? "border-orange-200 text-orange-700 bg-orange-50" :
                                            mov.type === "Waste" ? "border-red-200 text-red-700 bg-red-50" :
                                                "border-border text-primary bg-primary/10"
                                }>
                                    {mov.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-foreground font-semibold">{mov.skuId}</TableCell>
                            <TableCell className="text-right">{mov.type === "Increase" ? "+" : "-"}{mov.quantity}</TableCell>
                            <TableCell className="text-muted-foreground">{ROLES.find(r => r.id === mov.user)?.name || mov.user}</TableCell>
                            <TableCell className="text-muted-foreground truncate max-w-[200px]">{mov.notes}</TableCell>
                        </TableRow>
                    ))}
                    {movements.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No stock movements recorded.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
