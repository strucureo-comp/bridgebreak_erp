'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    PieChart,
    Network,
    Calculator,
    GitMerge,
    Layers,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FinanceEngineSettings() {
    const [multiEntity, setMultiEntity] = useState(false);
    const [budgetControl, setBudgetControl] = useState(true);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Finance Engine</Label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border shadow-sm rounded-md bg-card overflow-hidden">
                        <CardHeader className="border-b bg-muted/50 py-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">General Ledger</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fiscal Year Start</Label>
                                    <Select defaultValue="1">
                                        <SelectTrigger className="h-9 rounded-md border-border text-xs font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">January</SelectItem>
                                            <SelectItem value="4">April</SelectItem>
                                            <SelectItem value="7">July</SelectItem>
                                            <SelectItem value="10">October</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Numbering</Label>
                                    <Select defaultValue="alphanumeric">
                                        <SelectTrigger className="h-9 rounded-md border-border text-xs font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                                            <SelectItem value="numeric">Numeric Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Control Logic</Label>
                                <div className="divide-y border rounded-md overflow-hidden">
                                    <ControlToggle
                                        icon={Layers}
                                        label="Cost Centers"
                                        desc="Track P&L across departments and projects"
                                        active={true}
                                    />
                                    <ControlToggle
                                        icon={Calculator}
                                        label="Budget Enforcement"
                                        desc="Prevent spending exceeding set limits"
                                        active={budgetControl}
                                        onToggle={setBudgetControl}
                                    />
                                    <ControlToggle
                                        icon={GitMerge}
                                        label="Internal Transfers"
                                        desc="Auto-offset entries between entities"
                                        active={multiEntity}
                                        onToggle={setMultiEntity}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border shadow-sm rounded-md bg-foreground text-card-foreground p-6 relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="h-9 w-9 rounded-md bg-primary text-card-foreground flex items-center justify-center shadow-sm">
                                <Network className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase tracking-widest">Multi-Entity</h3>
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                                    Consolidate accounts from multiple legal entities into one reporting hub.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setMultiEntity(!multiEntity)}
                                className={cn(
                                    "w-full h-9 rounded-md font-bold uppercase tracking-widest text-[10px] transition-all",
                                    multiEntity ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                            >
                                {multiEntity ? "Feature Active" : "Enable Sync"}
                            </Button>
                        </div>
                    </Card>

                    <Card className="border shadow-sm rounded-md bg-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
                                <PieChart size={16} />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Hierarchy</h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-tighter">
                            Ledger structured with 4 levels (Group, Sub-Group, Ledger, Sub-Ledger) for granular reporting.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ControlToggle({ icon: Icon, label, desc, active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none uppercase tracking-tighter mt-0.5">{desc}</p>
                </div>
            </div>
            <Switch checked={active} onCheckedChange={onToggle} className="scale-75" />
        </div>
    );
}
