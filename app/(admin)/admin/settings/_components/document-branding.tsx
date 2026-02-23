'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Image as ImageIcon, LayoutTemplate, Type } from 'lucide-react';

interface DocumentBrandingProps {
    value: any;
    onChange: (value: any) => void;
}

export function DocumentBranding({ value, onChange }: DocumentBrandingProps) {
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
                            <div className="h-20 w-20 rounded border-2 border-dashed flex flex-col items-center justify-center bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] mt-1 text-muted-foreground">Upload</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Shown on invoices and reports. SVG or PNG recommended.
                                </p>
                                <Button variant="outline" size="sm" className="h-8">Pick from Vault</Button>
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
                                <div className="h-9 w-9 rounded bg-slate-900 border" />
                                <Input defaultValue="#0F172A" className="h-9 text-xs font-mono" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded bg-emerald-500 border" />
                                <Input defaultValue="#10B981" className="h-9 text-xs font-mono" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
