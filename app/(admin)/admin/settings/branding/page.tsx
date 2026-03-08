'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface BrandingConfig {
    logo: string | null;
    primaryColor: string;
    accentColor: string;
    footerText: string;
    favicon: string | null;
}

const DEFAULT_BRANDING: BrandingConfig = {
    logo: null,
    primaryColor: '#0F172A',
    accentColor: '#10B981',
    footerText: '',
    favicon: null,
};

// Predefined color palettes
const COLOR_PRESETS = [
    { name: 'White + Red', primary: '#FFFFFF', accent: '#DC2626' },
    { name: 'Red', primary: '#DC2626', accent: '#EF4444' },
    { name: 'Emerald', primary: '#059669', accent: '#10B981' },
    { name: 'Blue', primary: '#2563EB', accent: '#3B82F6' },
    { name: 'Purple', primary: '#7C3AED', accent: '#8B5CF6' },
    { name: 'Rose', primary: '#E11D48', accent: '#F43F5E' },
    { name: 'Orange', primary: '#EA580C', accent: '#F97316' },
    { name: 'Slate', primary: '#0F172A', accent: '#64748B' },
    { name: 'Teal', primary: '#0D9488', accent: '#14B8A6' },
    { name: 'Indigo', primary: '#4338CA', accent: '#6366F1' },
];

// Helper functions for color conversion
function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyBrandingColors(primaryColor: string, accentColor: string) {
    const root = document.documentElement;

    const primaryRGB = hexToRGB(primaryColor);
    if (primaryRGB) {
        const primaryHSL = rgbToHSL(primaryRGB.r, primaryRGB.g, primaryRGB.b);
        root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
        root.style.setProperty('--ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
        root.style.setProperty('--sidebar-primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
        root.style.setProperty('--sidebar-ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    }

    const accentRGB = hexToRGB(accentColor);
    if (accentRGB) {
        const accentHSL = rgbToHSL(accentRGB.r, accentRGB.g, accentRGB.b);
        root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
        root.style.setProperty('--sidebar-accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    }
}

export default function BrandingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('branding_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            setBranding({ ...DEFAULT_BRANDING, ...parsed });
            // Apply branding immediately on load
            if (parsed.primaryColor && parsed.accentColor) {
                applyBrandingColors(parsed.primaryColor, parsed.accentColor);
            }
        }
        setLoading(false);
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be under 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setBranding({ ...branding, logo: reader.result as string });
                toast.success('Logo uploaded');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setBranding({ ...branding, logo: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setBranding({ ...branding, primaryColor: preset.primary, accentColor: preset.accent });
        // Apply immediately
        applyBrandingColors(preset.primary, preset.accent);
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));

        // Save to branding_settings
        localStorage.setItem('branding_settings', JSON.stringify(branding));

        // Also save to branding_config for tenant context
        localStorage.setItem('branding_config', JSON.stringify({
            logo: branding.logo,
            primaryColor: branding.primaryColor,
            accentColor: branding.accentColor,
        }));

        // Apply branding colors
        applyBrandingColors(branding.primaryColor, branding.accentColor);

        // Update document title with company name
        const companySaved = localStorage.getItem('company_settings');
        if (companySaved) {
            const company = JSON.parse(companySaved);
            document.title = `${company.companyName || 'BridgeBreak'} - ERP`;
        }

        toast.success('Branding saved - UI colors updated');
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Branding</h1>
                <p className="text-muted-foreground">Customize your application's colors and logo</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Theme & Colors</CardTitle>
                        <CardDescription>Choose your primary and accent colors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Color Presets */}
                        <div className="space-y-2">
                            <Label>Quick Presets</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {COLOR_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => handleColorPreset(preset)}
                                        className="h-10 rounded-lg border-2 overflow-hidden relative hover:scale-105 transition-transform"
                                        style={{
                                            backgroundColor: preset.primary,
                                            borderColor: branding.primaryColor === preset.primary && branding.accentColor === preset.accent ? 'var(--primary)' : 'transparent'
                                        }}
                                        title={preset.name}
                                    >
                                        <div
                                            className="absolute bottom-0 right-0 w-4 h-4"
                                            style={{ backgroundColor: preset.accent }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={branding.primaryColor}
                                        onChange={(e) => {
                                            setBranding({ ...branding, primaryColor: e.target.value });
                                            applyBrandingColors(e.target.value, branding.accentColor);
                                        }}
                                        className="h-10 w-10 rounded cursor-pointer border"
                                    />
                                    <Input
                                        value={branding.primaryColor}
                                        onChange={(e) => {
                                            setBranding({ ...branding, primaryColor: e.target.value });
                                            applyBrandingColors(e.target.value, branding.accentColor);
                                        }}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Accent Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={branding.accentColor}
                                        onChange={(e) => {
                                            setBranding({ ...branding, accentColor: e.target.value });
                                            applyBrandingColors(branding.primaryColor, e.target.value);
                                        }}
                                        className="h-10 w-10 rounded cursor-pointer border"
                                    />
                                    <Input
                                        value={branding.accentColor}
                                        onChange={(e) => {
                                            setBranding({ ...branding, accentColor: e.target.value });
                                            applyBrandingColors(branding.primaryColor, e.target.value);
                                        }}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <Label>Company Logo</Label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted cursor-pointer hover:bg-muted/80"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {branding.logo ? (
                                        <img src={branding.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                                    ) : (
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                />
                                <div>
                                    <p className="text-sm font-medium">Upload Logo</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG. Max 2MB</p>
                                </div>
                                {branding.logo && (
                                    <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Preview</CardTitle>
                        <CardDescription>See how your theme looks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Sidebar Preview */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-2 text-xs font-medium text-muted-foreground">Sidebar</div>
                            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--background)' }}>
                                <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: branding.primaryColor }}
                                >
                                    {branding.logo ? (
                                        <img src={branding.logo} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <span className="text-xs font-bold">B</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Company Name</p>
                                    <p className="text-xs text-muted-foreground">Enterprise OS</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 space-y-1">
                                <div
                                    className="h-8 rounded-md flex items-center gap-2 px-3 text-sm"
                                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                                >
                                    Dashboard
                                </div>
                                <div className="h-8 rounded-md flex items-center gap-2 px-3 text-sm text-muted-foreground hover:bg-accent">
                                    Sales
                                </div>
                            </div>
                        </div>

                        {/* Button Preview */}
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 rounded-md text-white text-sm font-medium"
                                    style={{ backgroundColor: branding.primaryColor }}
                                >
                                    Primary Button
                                </button>
                                <button
                                    className="px-4 py-2 rounded-md text-white text-sm font-medium"
                                    style={{ backgroundColor: branding.accentColor }}
                                >
                                    Accent Button
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Primary: {branding.primaryColor} | Accent: {branding.accentColor}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
