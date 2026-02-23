'use client';

import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import type { Vendor } from '@/lib/db/types';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';

interface POPreviewProps {
    poNumber: string;
    vendor: Vendor | null;
    lines: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
    }>;
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
    notes?: string;
}

export function POPreview({ poNumber, vendor, lines, totals, notes }: POPreviewProps) {
    const { companyProfile } = useTenant();
    const branding = companyProfile?.branding;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: companyProfile?.baseCurrency || 'AED',
        }).format(amount);
    };

    return (
        <div className={cn(
            "bg-card text-foreground p-12 shadow-2xl border border-border aspect-[1/1.414] w-full max-w-[800px] mx-auto flex flex-col relative overflow-hidden",
            branding?.template === 'classic' ? 'font-serif' : branding?.template === 'mono' ? 'font-mono' : 'font-sans'
        )}>
            {/* Header */}
            <div className={cn(
                "flex border-b-2 border-zinc-900 pb-8 mb-10",
                branding?.headerAlign === 'center' ? "flex-col items-center gap-6" :
                branding?.headerAlign === 'right' ? "flex-row-reverse justify-between items-start" :
                "flex-row justify-between items-start"
            )}>
                <div className="space-y-2">
                    <div className={cn(
                        "h-16 w-32 flex items-center mb-4 overflow-hidden",
                        branding?.headerAlign === 'center' ? "justify-center" :
                        branding?.headerAlign === 'right' ? "justify-end" : "justify-start"
                    )}>
                        {branding?.logo ? (
                            <img src={branding.logo} alt="Company Logo" className="h-full w-full object-contain" />
                        ) : (
                            <div className="h-16 w-16 bg-foreground flex items-center justify-center rounded-md">
                                <img src="/logo_trans_(4884x4884)px_for_white_bg.png" alt="SSE" className="invert" />
                            </div>
                        )}
                    </div>
                    <div className={cn(
                        "space-y-0.5",
                        branding?.headerAlign === 'center' ? "text-center" :
                        branding?.headerAlign === 'right' ? "text-right" : "text-left"
                    )}>
                        <h1 className="text-xl font-black tracking-tighter uppercase">{companyProfile?.legalName || 'SYSTEM STEEL ENGINEERING LLC'}</h1>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Structural Solutions & Material Control</p>
                        <p className="text-[8px] text-muted-foreground uppercase">{companyProfile?.address || 'Warehouse 4, Al Quoz Industrial Area, Dubai, UAE'}</p>
                        <p className="text-[8px] font-black text-foreground">TRN: {companyProfile?.taxId || '100123456789003'}</p>
                    </div>
                </div>
                <div className={cn(
                    "space-y-1",
                    branding?.headerAlign === 'center' ? "text-center mt-4" :
                    branding?.headerAlign === 'right' ? "text-left" : "text-right"
                )}>
                    <h2 className="text-4xl font-black text-foreground tracking-tighter mb-2">PURCHASE ORDER</h2>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Document No</p>
                        <p className="text-sm font-black font-mono" style={{ color: branding?.color || '#ef4444' }}>{poNumber}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Issue Date</p>
                        <p className="text-xs font-bold">{format(new Date(), 'dd MMMM yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Entities */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-1">Supplier Entity</h3>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase">{vendor?.name || 'VEND-SPEC-NOT-SELECTED'}</p>
                        <p className="text-[10px] text-muted-foreground">{vendor?.address || 'Supplier address not provided'}</p>
                        <p className="text-[10px] font-bold text-foreground mt-2">TRN: {vendor?.tax_id || 'REGISTERED'}</p>
                    </div>
                </div>
                <div className="space-y-4 text-right">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-1">Ship To / Project</h3>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase">SSE Fabrication Yard</p>
                        <p className="text-[10px] text-muted-foreground">Logistics Hub, Zone 4</p>
                        <p className="text-[10px] font-bold text-foreground mt-2">ATTN: SITE SUPERVISOR</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="bg-foreground text-card-foreground">
                            <th className="py-2.5 px-4 text-left text-[9px] font-black uppercase tracking-widest rounded-tl-sm">Description</th>
                            <th className="py-2.5 px-4 text-center text-[9px] font-black uppercase tracking-widest">Qty</th>
                            <th className="py-2.5 px-4 text-right text-[9px] font-black uppercase tracking-widest">Unit Price</th>
                            <th className="py-2.5 px-4 text-right text-[9px] font-black uppercase tracking-widest rounded-tr-sm">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border border-b-2 border-zinc-900">
                        {lines.map((line, index) => (
                            <tr key={index}>
                                <td className="py-4 px-4 text-xs font-bold uppercase">{line.description || 'Line Item Specification'}</td>
                                <td className="py-4 px-4 text-center text-xs font-medium">{line.quantity}</td>
                                <td className="py-4 px-4 text-right text-xs font-medium">{formatCurrency(line.unit_price)}</td>
                                <td className="py-4 px-4 text-right text-xs font-black">{formatCurrency(line.quantity * line.unit_price)}</td>
                            </tr>
                        ))}
                        {lines.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
                                    No items specified in draft
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Financial Summary */}
            <div className="mt-8 flex justify-end">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>VAT (5%)</span>
                        <span className="text-foreground">{formatCurrency(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-foreground text-card-foreground p-4 rounded-sm mt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                        <span className="text-lg font-black" style={{ color: branding?.color === '#ef4444' ? '#ffffff' : 'inherit' }}>{formatCurrency(totals.total)}</span>
                    </div>
                </div>
            </div>

            {/* Legal / Notes */}
            <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t border-border">
                <div className="space-y-2">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Terms & Conditions</h4>
                    <p className="text-[8px] text-muted-foreground leading-relaxed uppercase font-medium whitespace-pre-line">
                        {branding?.terms || '1. Delivery must be accompanied by original invoice & TRN.\n2. QC inspection required at point of delivery.\n3. Payment terms as per agreement.'}
                    </p>
                </div>
                <div className="flex flex-col items-end justify-end space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-6 w-6 opacity-50" style={{ color: branding?.color || '#ef4444' }} />
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Digital Auth Record</span>
                    </div>
                    <div className="h-px w-32 bg-zinc-200"></div>
                    <p className="text-[9px] font-black uppercase">Procurement Authority</p>
                </div>
            </div>

            {/* Watermark */}
            {branding?.showWatermark && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] pointer-events-none opacity-[0.03] w-full flex items-center justify-center overflow-hidden">
                    {branding.logo ? (
                        <img src={branding.logo} alt="Watermark" className="w-[80%] h-auto grayscale" />
                    ) : (
                        <div className="text-6xl font-black tracking-[0.5em]">PURCHASE ORDER</div>
                    )}
                </div>
            )}
        </div>
    );
}
