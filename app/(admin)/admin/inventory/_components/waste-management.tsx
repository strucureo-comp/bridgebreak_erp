"use client";

import React from "react";
import { format } from "date-fns";
import { Check, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { WasteLog, Sku, ROLES } from "../_lib/data";

interface WasteManagementProps {
    wasteLogs: WasteLog[];
    skus: Sku[];
    writeOffApprovalThreshold: number;
    role: any;
    onApprove: (logId: string, approve: boolean) => void;
}

export function WasteManagement({ wasteLogs, skus, writeOffApprovalThreshold, role, onApprove }: WasteManagementProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wasteLogs.map(log => {
                const sku = skus.find(s => s.id === log.skuId);
                const value = sku ? sku.costPerUnit * log.quantity : 0;

                return (
                    <Card key={log.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="font-mono bg-muted/40 text-muted-foreground">{log.id}</Badge>
                                <Badge variant={
                                    log.status === "Approved" ? "default" :
                                        log.status === "Rejected" ? "destructive" :
                                            "secondary"
                                } className={
                                    log.status === "Approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" :
                                        log.status === "Pending Finance" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : ""
                                }>
                                    {log.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg font-bold text-foreground font-semibold flex justify-between">
                                <span>{log.skuId}</span>
                                <span className="text-red-600">- {log.quantity} unit(s)</span>
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {sku?.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-2 border-b border-border">
                            <div>
                                <span className="font-medium text-muted-foreground">Reason:</span>
                                <p className="mt-1 line-clamp-2">{log.reason}</p>
                            </div>
                            <div className="flex justify-between items-center bg-muted/40 p-2 rounded-md">
                                <span className="font-medium text-muted-foreground">Loss Value:</span>
                                <span className="font-bold text-foreground font-semibold">${value.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-muted-foreground/60">
                                Reported by: {ROLES.find(r => r.id === log.reportedBy)?.name || log.reportedBy} on {format(new Date(log.date), "MMM dd")}
                            </div>
                        </CardContent>

                        {log.status.includes("Pending") && (
                            <CardFooter className="p-3 bg-muted/40 flex gap-2 justify-end rounded-b-xl">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => onApprove(log.id, false)}
                                >
                                    <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={
                                        (log.status === "Pending Finance" && !role.canApproveFinance && !role.canOverride) ||
                                        (log.status === "Pending" && !role.canApproveWaste && !role.canOverride)
                                    }
                                    onClick={() => onApprove(log.id, true)}
                                >
                                    <Check className="h-4 w-4 mr-1" /> Approve Write-off
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                );
            })}
            {wasteLogs.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center border-2 border-dashed border-border rounded-xl">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="text-muted-foreground font-medium">No waste logs recorded.</p>
                </div>
            )}
        </div>
    );
}
