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
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Visual Assets
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Brand Colors
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="h-9 w-9 rounded border cursor-pointer p-0.5"
                                />
                                <Input
                                    value={primaryColor}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="h-9 text-xs font-mono"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => handleColorChange('accent', e.target.value)}
                                    className="h-9 w-9 rounded border cursor-pointer p-0.5"
                                />
                                <Input
                                    value={accentColor}
                                    onChange={(e) => handleColorChange('accent', e.target.value)}
                                    className="h-9 text-xs font-mono"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Live preview */}
                    <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="h-3 rounded-full w-full" style={{ backgroundColor: primaryColor }} />
                            <div className="flex gap-2">
                                <div className="h-8 rounded flex-1" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
                                <div className="h-8 rounded w-20" style={{ backgroundColor: accentColor }} />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-2 rounded-full w-1/3 bg-muted" />
                                <div className="h-2 rounded-full w-1/4" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
