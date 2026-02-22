'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
    Globe, 
    Settings2, 
    Wallet, 
    Calculator, 
    ChevronRight,
    Landmark,
    Plus,
    Save,
    Trash2,
    Shield,
    Users,
    X,
    Pencil,
    Briefcase,
    Building2,
    Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHRRole, createDepartment } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type ConfigMode = 'statutory' | 'roles' | 'departments' | 'employment-types' | 'components' | 'templates';

export function HRMSSettings() {
    const [mode, setConfigMode] = useState<ConfigMode>('statutory');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsEditOpen(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Configuration Mode Selector */}
            <div className="lg:col-span-4 space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wider text-foreground px-1">Configuration Hub</Label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'statutory', label: 'Statutory Rules', desc: 'Country tax & laws', icon: Globe },
                        { id: 'roles', label: 'Role Architect', desc: 'Designations/Positions', icon: Shield },
                        { id: 'departments', label: 'Work Units', desc: 'Departments/Divisions', icon: Building2 },
                        { id: 'employment-types', label: 'Contract Types', desc: 'Staffing categories', icon: Tags },
                        { id: 'components', label: 'Component Master', desc: 'Earnings & deductions', icon: Calculator },
                        { id: 'templates', label: 'Salary Templates', desc: 'Role-based structures', icon: Wallet },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setConfigMode(item.id as ConfigMode)}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-md border text-left transition-all",
                                mode === item.id 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-md flex items-center justify-center transition-colors",
                                mode === item.id ? "bg-primary text-card-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <item.icon size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-xs font-black uppercase tracking-widest", mode === item.id ? "text-foreground" : "text-muted-foreground")}>{item.label}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter mt-0.5">{item.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Input-Based Configuration Area */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Configure Properties</Label>
                    <Button size="sm" className="h-8 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[9px] tracking-widest">
                        <Save className="h-3 w-3" /> Save All Changes
                    </Button>
                </div>

                {mode === 'statutory' && (
                    <Card className="border shadow-sm rounded-md bg-card">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Statutory Engine</CardTitle>
                            <Landmark className="h-4 w-4 text-muted-foreground/60" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Active Region</Label>
                                <Select defaultValue="AE">
                                    <SelectTrigger className="h-10 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AE" className="text-xs font-bold uppercase">United Arab Emirates (AED)</SelectItem>
                                        <SelectItem value="IN" className="text-xs font-bold uppercase">India (INR)</SelectItem>
                                        <SelectItem value="US" className="text-xs font-bold uppercase">United States (USD)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax Model</Label>
                                    <Select defaultValue="none">
                                        <SelectTrigger className="h-9 border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Exempt)</SelectItem>
                                            <SelectItem value="flat">Flat Rate</SelectItem>
                                            <SelectItem value="slab">Progressive Slabs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gratuity Rule</Label>
                                    <div className="flex items-center gap-3 h-9">
                                        <Switch defaultChecked />
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Mandatory Accrual</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'roles' && (
                    <Card className="border shadow-sm rounded-md bg-card">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Role Architect</CardTitle>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase">Designations</Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Designation</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. Senior Fitter" className="h-9 border-border text-xs font-bold uppercase" id="new-role-title" />
                                        <Button size="sm" className="h-9 px-4 bg-primary font-bold uppercase text-[10px]" onClick={async () => {
                                            const input = document.getElementById('new-role-title') as HTMLInputElement;
                                            if (!input.value) return;
                                            try {
                                                await createHRRole({ title: input.value, code: input.value.toLowerCase().replace(/\s+/g, '_') });
                                                toast.success('Designation added');
                                                input.value = '';
                                            } catch { toast.error('Failed to add'); }
                                        }}>Add</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Configured Roles</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {['Structural Engineer', 'Site Supervisor', 'Lead Fabricator', 'Project Manager'].map(role => (
                                        <div key={role} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Users size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-[11px] font-bold uppercase text-foreground">{role}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'role', name: role })}>
                                                    <Pencil size={12} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'departments' && (
                    <Card className="border shadow-sm rounded-md bg-card">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Work Units</CardTitle>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase">Departments</Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Department Name</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. Fabrication" className="h-9 border-border text-xs font-bold uppercase" id="new-dept-name" />
                                        <Button size="sm" className="h-9 px-4 bg-primary font-bold uppercase text-[10px]" onClick={async () => {
                                            const input = document.getElementById('new-dept-name') as HTMLInputElement;
                                            if (!input.value) return;
                                            try {
                                                await createDepartment({ name: input.value, code: input.value.toUpperCase().slice(0, 3) });
                                                toast.success('Department created');
                                                input.value = '';
                                            } catch { toast.error('Failed to create'); }
                                        }}>Add</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Active Units</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {['Engineering', 'Production', 'Operations', 'Finance', 'Logistics'].map(dept => (
                                        <div key={dept} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Building2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-[11px] font-bold uppercase text-foreground">{dept}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'dept', name: dept })}>
                                                    <Pencil size={12} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'employment-types' && (
                    <Card className="border shadow-sm rounded-md bg-card">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Contract Types</CardTitle>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase">Staffing</Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Category</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. Daily Wages" className="h-9 border-border text-xs font-bold uppercase" />
                                        <Button size="sm" className="h-9 px-4 bg-primary font-bold uppercase text-[10px]">Add</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Current Categories</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {['Permanent', 'Contract', 'Intern', 'Probationary'].map(type => (
                                        <div key={type} className="flex items-center justify-between p-3 border rounded-md bg-muted hover:bg-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Tags size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-[11px] font-bold uppercase text-foreground">{type}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ type: 'contract', name: type })}>
                                                    <Pencil size={12} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={12} /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'components' && (
                    <Card className="border shadow-sm rounded-md bg-card overflow-hidden">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Salary Components</CardTitle>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20">+ Add</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { name: 'Base Salary', cat: 'Earning', type: 'Fixed' },
                                    { name: 'Housing', cat: 'Earning', type: '40% of Base' },
                                    { name: 'Transport', cat: 'Earning', type: 'Flat' },
                                ].map((comp) => (
                                    <div key={comp.name} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                                <Calculator size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground uppercase">{comp.name}</p>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest px-1.5 h-4 mt-1 border-none",
                                                    comp.cat === 'Earning' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                                )}>{comp.cat}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-4">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Logic</p>
                                                <p className="text-xs font-black text-foreground uppercase mt-0.5">{comp.type}</p>
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit({ ...comp, kind: 'component' })}>
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-rose-500"><Trash2 size={14} /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'templates' && (
                    <Card className="border shadow-sm rounded-md bg-card">
                        <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between text-foreground">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Template Architect</CardTitle>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20">+ New</Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Edit Template</Label>
                                    <Select defaultValue="eng">
                                        <SelectTrigger className="h-9 border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="eng" className="text-[10px] font-bold uppercase">Senior Engineer - UAE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Global Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="uppercase tracking-widest">Edit Properties</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">Update system configuration</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name / Title</Label>
                            <Input defaultValue={editingItem?.name} className="h-10 border-border font-bold uppercase text-xs" />
                        </div>
                        {editingItem?.type === 'component' && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calculation Logic</Label>
                                    <Select defaultValue="fixed">
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                            <SelectItem value="percent">Percentage of Base</SelectItem>
                                            <SelectItem value="formula">Custom Formula</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Taxable Component</span>
                                    <Switch defaultChecked={editingItem?.tax} className="scale-75" />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] h-10" onClick={() => {
                            toast.success('Configuration updated');
                            setIsEditOpen(false);
                        }}>Commit Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
