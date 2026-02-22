'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Upload,
    FileText,
    Receipt,
    ShoppingCart,
    ClipboardCheck,
    Eye,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Loader2,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentBrandingProps {
    value?: any;
    onChange: (config: any) => void;
}

type DocType = 'invoice' | 'quotation' | 'po' | 'delivery';
type Alignment = 'left' | 'center' | 'right';

export function DocumentBranding({ value, onChange }: DocumentBrandingProps) {
    const [color, setColor] = useState(value?.color || '#ef4444');
    const [template, setTemplate] = useState(value?.template || 'modern');
    const [activeDoc, setActiveDoc] = useState<DocType>('invoice');
    const [headerAlign, setHeaderAlign] = useState<Alignment>(value?.headerAlign || 'left');
    const [showWatermark, setShowWatermark] = useState(value?.showWatermark ?? true);
    const [terms, setTerms] = useState(value?.terms || '1. Payment is due within 30 days.\n2. Goods once sold are not returnable.');
    const [footerNote, setFooterNote] = useState(value?.footerNote || 'Thank you for your business!');

    const [logo, setLogo] = useState<string | null>(value?.logo || null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        onChange({
            color,
            template,
            headerAlign,
            showWatermark,
            terms,
            footerNote,
            logo
        });
    }, [color, template, headerAlign, showWatermark, terms, footerNote, logo]);

    const docConfigs = {
        invoice: { title: 'TAX INVOICE', icon: Receipt, label: 'Billing' },
        quotation: { title: 'FORMAL QUOTATION', icon: FileText, label: 'Sales' },
        po: { title: 'PURCHASE ORDER', icon: ShoppingCart, label: 'Procurement' },
        delivery: { title: 'DELIVERY NOTE', icon: ClipboardCheck, label: 'Logistics' },
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
                setUploading(false);
                toast.success('Company logo updated');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Visual Lab</Label>
                    <Card className="border shadow-sm rounded-md bg-card overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Logo Asset</Label>
                                <div className={cn(
                                    "border-2 border-dashed border-border rounded-md h-24 flex flex-col items-center justify-center relative overflow-hidden transition-all group",
                                    logo ? "border-solid border-primary/20 bg-card" : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                )}>
                                    {logo ? (
                                        <>
                                            <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain p-2" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLogo(null); }}
                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={handleLogoUpload}
                                            />
                                            {uploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Select PNG/SVG</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Identity</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Accent</p>
                                        <div className="flex gap-1.5">
                                            {['#ef4444', '#09090b', '#71717a'].map((c) => (
                                                <div
                                                    key={c}
                                                    onClick={() => setColor(c)}
                                                    className={cn(
                                                        "h-6 w-6 rounded-sm cursor-pointer border transition-all",
                                                        color === c ? "border-primary ring-2 ring-primary/10" : "border-border"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Watermark</p>
                                        <Switch checked={showWatermark} onCheckedChange={setShowWatermark} className="scale-75 origin-left" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Header Layout</Label>
                                <div className="flex gap-1 p-1 bg-muted border rounded-md h-9">
                                    {(['left', 'center', 'right'] as Alignment[]).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => setHeaderAlign(align)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center rounded-sm transition-all",
                                                headerAlign === align ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {align === 'left' && <AlignLeft size={14} />}
                                            {align === 'center' && <AlignCenter size={14} />}
                                            {align === 'right' && <AlignRight size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terms & Notes</Label>
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Terms & Conditions..."
                                        value={terms}
                                        onChange={(e) => setTerms(e.target.value)}
                                        className="text-[10px] min-h-[60px] resize-none border-border"
                                    />
                                    <Input
                                        placeholder="Footer Note..."
                                        value={footerNote}
                                        onChange={(e) => setFooterNote(e.target.value)}
                                        className="text-[10px] h-8 border-border"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Selection</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {(Object.keys(docConfigs) as DocType[]).map((type) => {
                            const config = docConfigs[type];
                            const Icon = config.icon;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveDoc(type)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-md border transition-all text-left",
                                        activeDoc === type
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                                            activeDoc === type ? "bg-primary text-card-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon size={14} />
                                        </div>
                                        <p className={cn("text-[11px] font-bold uppercase tracking-tight", activeDoc === type ? "text-foreground" : "text-muted-foreground")}>{config.title}</p>
                                    </div>
                                    {activeDoc === type && <Eye className="h-3 w-3 text-primary animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Master Preview</Label>
                    <Badge variant="secondary" className="bg-foreground text-card-foreground font-bold text-[8px] uppercase tracking-[0.2em] px-3 py-1">Engine v2.0</Badge>
                </div>

                <Card className="border shadow-sm rounded-md bg-muted p-12 flex items-center justify-center relative overflow-hidden min-h-[600px]">
                    {/* Master Document Preview */}
                    <div className={cn(
                        "bg-card rounded-sm shadow-2xl border border-border w-full max-w-[440px] aspect-[1/1.414] p-10 flex flex-col relative transition-all duration-500 animate-in fade-in zoom-in-95",
                        template === 'classic' ? 'font-serif' : template === 'mono' ? 'font-mono' : 'font-sans'
                    )}>
                        {/* Header Area */}
                        <div className={cn(
                            "flex mb-12",
                            headerAlign === 'left' ? "flex-row justify-between items-start" :
                                headerAlign === 'center' ? "flex-col items-center gap-6" :
                                    "flex-row-reverse justify-between items-start"
                        )}>
                            <div className="h-16 w-32 flex items-center justify-center overflow-hidden" style={{ backgroundColor: logo ? 'transparent' : color }}>
                                {logo ? (
                                    <img src={logo} alt="Brand Logo" className={cn(
                                        "h-full w-full object-contain",
                                        headerAlign === 'left' ? "object-left" :
                                            headerAlign === 'center' ? "object-center" :
                                                "object-right"
                                    )} />
                                ) : (
                                    <div className="text-card-foreground font-black text-sm uppercase tracking-tighter">BRAND</div>
                                )}
                            </div>
                            <div className={cn(
                                "space-y-1",
                                headerAlign === 'left' ? "text-right" :
                                    headerAlign === 'center' ? "text-center" :
                                        "text-left"
                            )}>
                                <h4 className="font-black text-foreground text-xl tracking-tighter uppercase leading-none">{docConfigs[activeDoc].title}</h4>
                                <p className="text-muted-foreground font-mono text-[9px] tracking-widest uppercase">ID: {activeDoc.toUpperCase()}-2026-0042</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Issuer Entity</p>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground text-[11px]">System Steel Engineering LLC</p>
                                    <p className="text-muted-foreground text-[9px]">Warehouse 4, Al Quoz Industrial, Dubai</p>
                                    <p className="text-muted-foreground text-[9px] font-bold">TRN: 100123456789003</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Attention To</p>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground text-[11px]">Prestige Structures LLC</p>
                                    <p className="text-muted-foreground text-[9px]">Client ID: CUST-992 | Net 30</p>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="flex-1">
                            <div className="border-t border-b border-border py-2 mb-4 flex justify-between bg-muted/50 px-2">
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Work Detail</span>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest w-16 text-right">AED</span>
                            </div>
                            <div className="space-y-4 px-2">
                                {[
                                    { item: 'Structural Steel Fabrication', qty: '12.5 T', val: '42,500' },
                                    { item: 'Installation & Site Works', qty: '1 Unit', val: '8,200' },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-foreground">{row.item}</p>
                                            <p className="text-[8px] text-muted-foreground uppercase font-mono">{row.qty} · SS-FAB-{i + 1}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-foreground w-16 text-right">{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terms and Notes Section */}
                        <div className="mt-8 pt-6 border-t border-border space-y-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Terms & Conditions</p>
                                    <p className="text-[8px] text-muted-foreground leading-relaxed whitespace-pre-line">{terms}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Total Position</p>
                                    <div className="space-y-1 text-right">
                                        <div className="flex justify-between gap-8 text-[9px]">
                                            <span className="text-muted-foreground font-bold uppercase tracking-tighter">Subtotal</span>
                                            <span className="text-foreground font-bold">50,700.00</span>
                                        </div>
                                        <div className="flex justify-between gap-8 text-[9px] mb-2">
                                            <span className="text-muted-foreground font-bold uppercase tracking-tighter">VAT (5%)</span>
                                            <span className="text-foreground font-bold">2,535.00</span>
                                        </div>
                                        <div className="pt-2 border-t border-border">
                                            <p className="text-2xl font-black tracking-tighter" style={{ color: color }}>AED 53,235.00</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature & Footer */}
                        <div className="mt-auto pt-8">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Authorized Authorization</p>
                                    <div className="h-10 w-24 border-b border-border flex items-center justify-center">
                                        <span className="text-[8px] text-muted-foreground/60 italic opacity-50">Upload Sign</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-foreground uppercase tracking-widest">{footerNote}</p>
                                </div>
                            </div>
                        </div>

                        {/* Watermark - Dynamic Logo based */}
                        {showWatermark && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] pointer-events-none opacity-[0.04] w-full flex items-center justify-center overflow-hidden">
                                {logo ? (
                                    <img src={logo} alt="Watermark" className="w-[80%] h-auto grayscale" />
                                ) : (
                                    <div className="text-6xl font-black tracking-[0.5em]">{activeDoc.toUpperCase()}</div>
                                )}
                            </div>
                        )}
                    </div>

                    <Badge variant="outline" className="absolute top-4 right-4 bg-card text-foreground font-bold border-border shadow-sm text-[8px] uppercase tracking-widest">
                        PREVIEW ENGINE
                    </Badge>
                </Card>
            </div>
        </div>
    );
}
