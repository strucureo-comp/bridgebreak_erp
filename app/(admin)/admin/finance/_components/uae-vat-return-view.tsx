'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Landmark, Receipt, ArrowRightLeft, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateUAEVATReturn, Emirate } from '@/app/(admin)/admin/finance/_lib/finance/uae-tax-engine';
import { cn } from '@/lib/utils';

interface UAEVATReturnViewProps {
  trn: string;
  fromDate: string;
  toDate: string;
  invoices: any[];
  bills: any[];
}

export function UAEVATReturnView({ trn, fromDate, toDate, invoices, bills }: UAEVATReturnViewProps) {
  const vatReturn = useMemo(() => 
    calculateUAEVATReturn(trn, fromDate, toDate, invoices, bills),
    [trn, fromDate, toDate, invoices, bills]
  );

  const emirates: Emirate[] = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-card-foreground p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Landmark className="h-6 w-6 text-primary" />
                UAE VAT Return (Form 201)
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Federal Tax Authority Compliance Report
              </CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-800 text-card-foreground hover:bg-slate-700">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tax Registration Number</p>
              <p className="text-lg font-mono font-bold text-primary">{trn}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reporting Period</p>
              <p className="text-sm font-bold">{new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase">Draft</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</p>
              <p className="text-sm font-bold">AED</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              1. VAT on Sales and all other Outputs
            </h3>
            
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-muted rounded-xl overflow-hidden hover:bg-slate-50">
                  <TableHead className="rounded-l-xl font-black text-foreground">Emirate Supply</TableHead>
                  <TableHead className="text-right font-black text-foreground">Amount (AED)</TableHead>
                  <TableHead className="text-right font-black text-foreground">VAT Amount (AED)</TableHead>
                  <TableHead className="text-right rounded-r-xl font-black text-foreground">Adjustments (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emirates.map((emirate) => (
                  <TableRow key={emirate} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700">{emirate}</TableCell>
                    <TableCell className="text-right font-medium">
                      {vatReturn.emirate_supplies[emirate].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {vatReturn.emirate_supplies[emirate].vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">0.00</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-900/5 hover:bg-slate-900/5">
                  <TableCell className="font-black text-foreground">Total Standard Rated Supplies</TableCell>
                  <TableCell className="text-right font-black text-foreground">
                    {vatReturn.total_standard_rated_supplies.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-black text-primary">
                    {vatReturn.total_standard_rated_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground">0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator className="bg-muted" />

          <div className="p-8">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              2. VAT on Expenses and all other Inputs
            </h3>
            
            <div className="bg-muted rounded-3xl p-6 grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Total Purchase Amount</p>
                <p className="text-2xl font-black text-foreground">
                  {vatReturn.tax_on_expenses.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">AED</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Total Input VAT</p>
                <p className="text-2xl font-black text-foreground">
                  {vatReturn.tax_on_expenses.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">AED</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Recoverable VAT</p>
                <p className="text-2xl font-black text-emerald-600">
                  {vatReturn.tax_on_expenses.recoverable_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">AED</span>
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-muted" />

          <div className="p-8 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  3. Net VAT Due
                </h3>
                <p className="text-sm font-medium text-muted-foreground italic">Total Payable or Reclaimable for this period</p>
              </div>
              
              <div className={cn(
                "rounded-3xl px-8 py-6 shadow-xl flex flex-col items-end",
                vatReturn.net_vat_due >= 0 ? "bg-slate-900 text-card-foreground" : "bg-emerald-600 text-card-foreground"
              )}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
                  {vatReturn.net_vat_due >= 0 ? "Payable to FTA" : "Reclaimable from FTA"}
                </p>
                <p className="text-4xl font-black tracking-tighter">
                  {Math.abs(vatReturn.net_vat_due).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-lg font-medium opacity-60 ml-1">AED</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
