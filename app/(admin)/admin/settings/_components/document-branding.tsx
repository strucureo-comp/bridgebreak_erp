'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Image as ImageIcon, LayoutTemplate, Type, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentBrandingProps {
    value: any;
    onChange: (value: any) => void;
}

export function DocumentBranding({ value, onChange }: DocumentBrandingProps) {
    const [primaryColor, setPrimaryColor] = useState(value?.primaryColor || '#0F172A');
    const [accentColor, setAccentColor] = useState(value?.accentColor || '#10B981');
    const [logoPreview, setLogoPreview] = useState<string | null>(value?.logo || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emitChange = (patch: Record<string, any>) => {
        onChange({ primaryColor, accentColor, logo: logoPreview, ...patch });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, SVG, JPG)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be under 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setLogoPreview(dataUrl);
            emitChange({ logo: dataUrl });
            toast.success('Logo uploaded successfully');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        emitChange({ logo: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success('Logo removed');
    };

    const handleColorChange = (type: 'primary' | 'accent', hex: string) => {
        // Validate hex
        const isValid = /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
        if (type === 'primary') {
            setPrimaryColor(hex);
            if (isValid) emitChange({ primaryColor: hex });
        } else {
            setAccentColor(hex);
            if (isValid) emitChange({ accentColor: hex });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-muted/10 border-b py-5">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                            <ImageIcon className="h-3.5 w-3.5" />
                        </div>
                        Visual Assets
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Corporate Seal / Logo</Label>
                        <div className="flex items-center gap-4">
                            <div
                                className="h-20 w-20 rounded border-2 border-dashed flex flex-col items-center justify-center bg-muted/50 hover:bg-muted cursor-pointer transition-colors overflow-hidden relative group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-4 w-4 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-[10px] mt-1 text-muted-foreground">Upload</span>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <div className="flex-1 space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    Shown on invoices and reports. SVG or PNG recommended. Max 2MB.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="h-3 w-3 mr-1.5" /> Upload File
                                    </Button>
                                    {logoPreview && (
                                        <Button variant="outline" size="sm" className="h-8 text-destructive" onClick={handleRemoveLogo}>
                                            <X className="h-3 w-3 mr-1.5" /> Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-muted/10 border-b py-5">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white">
                            <Palette className="h-3.5 w-3.5" />
                        </div>
                        Color Intelligence Matrix
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Primary Signature (Global)</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => handleColorChange('primary', e.target.value)}
                                        className="h-12 w-12 rounded-xl border-none cursor-pointer p-0 bg-transparent absolute inset-0 opacity-0 z-10"
                                    />
                                    <div className="h-12 w-12 rounded-xl border border-slate-100 shadow-sm p-1.5 bg-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
                                        <div className="h-full w-full rounded-lg shadow-inner" style={{ backgroundColor: primaryColor }} />
                                    </div>
                                </div>
                                <Input
                                    value={primaryColor}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="h-12 flex-1 font-mono text-xs font-black text-center rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner uppercase tracking-widest"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Accent Interaction Node</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => handleColorChange('accent', e.target.value)}
                                        className="h-12 w-12 rounded-xl border-none cursor-pointer p-0 bg-transparent absolute inset-0 opacity-0 z-10"
                                    />
                                    <div className="h-12 w-12 rounded-xl border border-slate-100 shadow-sm p-1.5 bg-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
                                        <div className="h-full w-full rounded-lg shadow-inner" style={{ backgroundColor: accentColor }} />
                                    </div>
                                </div>
                                <Input
                                    value={accentColor}
                                    onChange={(e) => handleColorChange('accent', e.target.value)}
                                    className="h-12 flex-1 font-mono text-xs font-black text-center rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner uppercase tracking-widest"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 pl-1">Dynamic Contrast Preview</p>
                        <div className="rounded-2xl border border-slate-100 p-8 space-y-4 bg-slate-50/20 shadow-inner">
                            <div className="h-4 rounded-full w-full shadow-sm" style={{ backgroundColor: primaryColor }} />
                            <div className="flex gap-4">
                                <div className="h-12 rounded-xl flex-1 border border-slate-100 shadow-sm" style={{ backgroundColor: primaryColor, opacity: 0.08 }} />
                                <div className="h-12 rounded-xl w-32 shadow-lg" style={{ backgroundColor: accentColor }} />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <div className="h-2 rounded-full w-1/3 bg-slate-200" />
                                <div className="h-2 rounded-full w-1/4" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
                                <div className="h-2 rounded-full flex-1 bg-slate-100" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
