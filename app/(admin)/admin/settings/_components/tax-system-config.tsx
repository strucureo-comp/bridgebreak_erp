'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Landmark, Shield, Calculator, Globe,
    Plus, FileText, BarChart3, Clock,
    AlertCircle, Download, Settings
} from 'lucide-react';

interface TaxSystemConfigProps {
    onChange: (value: any) => void;
}

export function TaxSystemConfig({ onChange }: TaxSystemConfigProps) {
    return (
        <Tabs defaultValue="authority" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="authority">Tax Authority</TabsTrigger>
                <TabsTrigger value="rates">Custom Rates</TabsTrigger>
                <TabsTrigger value="reporting">Reporting Engine</TabsTrigger>
            </TabsList>

            <TabsContent value="authority" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Landmark className="h-4 w-4" /> Jurisdiction
                            </CardTitle>
                            <CardDescription className="text-xs">Primary tax authority integration defaults.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax Region</Label>
                                    <Select defaultValue="uae">
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="uae">United Arab Emirates</SelectItem>
                                            <SelectItem value="ksa">Saudi Arabia</SelectItem>
                                            <SelectItem value="us">United States</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Tax System</Label>
                                    <Select defaultValue="vat">
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vat">VAT (Value Added Tax)</SelectItem>
                                            <SelectItem value="sales">Sales Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Compliance Defaults
                            </CardTitle>
                            <CardDescription className="text-xs">Base rules for tax calculation and validation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Reverse Charge</p>
                                    <p className="text-xs text-muted-foreground">Automate RC for foreign procurement</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Zero-Rated Support</p>
                                    <p className="text-xs text-muted-foreground">Handle exports and exempt goods</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Calculator className="h-4 w-4" /> Tax Formulas & Rates
                            </CardTitle>
                            <CardDescription className="text-xs">Define custom tax brackets and regional overrides.</CardDescription>
                        </div>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Rate
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {[
                                { name: 'Standard VAT', rate: '5%', type: 'Standard', status: 'Core' },
                                { name: 'Export Rate', rate: '0%', type: 'Zero-Rated', status: 'Core' },
                                { name: 'Luxury Surcharge', rate: '15%', type: 'Surcharge', status: 'Custom' },
                                { name: 'Exempt Services', rate: '0%', type: 'Exempt', status: 'Core' },
                            ].map((tax, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                            <span className="text-[10px] font-bold">{tax.rate}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{tax.name}</p>
                                            <p className="text-xs text-muted-foreground">{tax.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={tax.status === 'Core' ? 'outline' : 'secondary'} className="text-[10px] uppercase">{tax.status}</Badge>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reporting" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> E-Filing & Documentation
                            </CardTitle>
                            <CardDescription className="text-xs">Configure the reporting engine and automated returns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs">Filing Frequency</Label>
                                    <Select defaultValue="quarterly">
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Methodology</Label>
                                    <Select defaultValue="accrual">
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accrual">Accrual Basis</SelectItem>
                                            <SelectItem value="cash">Cash Basis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Automation Tokens</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium">Automatic VAT Return Generation</p>
                                                <p className="text-[10px] text-muted-foreground">Generates XML for FTA portal</p>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium">Filing Deadline Reminders</p>
                                                <p className="text-[10px] text-muted-foreground">7-day advance notice</p>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Audit Ready</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">System Verified</p>
                                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500 leading-relaxed">
                                            Your current configuration matches local tax laws for the 2024 fiscal year.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full gap-2" variant="outline" size="sm">
                                <Download className="h-3 w-3" /> Export Audit Log
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}


