'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users, Shield, Lock, ChevronRight, Fingerprint,
    UserPlus, Settings2, CheckCircle2, AlertCircle,
    Clock, Search, MoreVertical, DollarSign, ArrowRight,
    Plus, Trash2, Edit2, X
} from 'lucide-react';

export function RolePermissionConfig() {
    const [workflows, setWorkflows] = useState([
        {
            id: 1,
            title: 'Payroll & Salary Increases',
            status: 'Active',
            stages: 3,
            threshold: 'All',
            flow: [
                { role: 'HR Manager', action: 'Initiate Request' },
                { role: 'MD / Admin', action: 'Strategic Approval' },
                { role: 'Finance Team', action: 'Disbursement & Post' }
            ]
        },
        {
            id: 2,
            title: 'Purchase Orders',
            status: 'Active',
            stages: 3,
            threshold: 'AED 10,000',
            flow: [{ role: 'Dept Head', action: 'Review' }, { role: 'Procurement', action: 'Verify' }, { role: 'MD', action: 'Authorize' }]
        }
    ]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<any>(null);

    const handleEdit = (flow: any) => {
        setEditingFlow(flow);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingFlow({
            title: '',
            status: 'Active',
            threshold: 'All',
            flow: [{ role: '', action: '' }]
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setWorkflows(workflows.filter(w => w.id !== id));
    };

    const saveWorkflow = () => {
        if (editingFlow.id) {
            setWorkflows(workflows.map(w => w.id === editingFlow.id ? { ...editingFlow, stages: editingFlow.flow.length } : w));
        } else {
            setWorkflows([...workflows, { ...editingFlow, id: Date.now(), stages: editingFlow.flow.length }]);
        }
        setIsDialogOpen(false);
    };

    const addStep = () => {
        setEditingFlow({
            ...editingFlow,
            flow: [...editingFlow.flow, { role: '', action: '' }]
        });
    };

    const removeStep = (index: number) => {
        setEditingFlow({
            ...editingFlow,
            flow: editingFlow.flow.filter((_: any, i: number) => i !== index)
        });
    };

    const updateStep = (index: number, field: string, value: string) => {
        const newFlow = [...editingFlow.flow];
        newFlow[index] = { ...newFlow[index], [field]: value };
        setEditingFlow({ ...editingFlow, flow: newFlow });
    };

    return (
        <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="roles">Roles Registry</TabsTrigger>
                <TabsTrigger value="users">User Directory</TabsTrigger>
                <TabsTrigger value="approvals">Approval Workflows</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Defined Access Roles
                            </CardTitle>
                            <CardDescription className="text-xs">Manage permissions and access levels for system roles.</CardDescription>
                        </div>
                        <Button size="sm">Add Role</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {[
                                { name: 'Administrator', users: 2, level: 'Full' },
                                { name: 'Finance Manager', users: 3, level: 'Audit & Approve' },
                                { name: 'Operations Lead', users: 5, level: 'Execution' },
                                { name: 'Sales Representative', users: 8, level: 'CRM Access' },
                            ].map((role, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                            <Lock size={16} className="text-muted-foreground" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{role.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {role.users} Active Users · {role.level}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" /> Active Directory
                            </CardTitle>
                            <CardDescription className="text-xs">Manage system users and their account status.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="Search users..." className="h-9 w-64 pl-8 text-xs" />
                            </div>
                            <Button size="sm" className="gap-2">
                                <UserPlus className="h-4 w-4" /> Add User
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {[
                                { name: 'Ahmed Khalid', email: 'ahmed@systemsteel.ae', role: 'Administrator', status: 'Active' },
                                { name: 'Sarah Connor', email: 'sarah@systemsteel.ae', role: 'Finance Manager', status: 'Active' },
                                { name: 'John Doe', email: 'john@systemsteel.ae', role: 'Operations Lead', status: 'On Leave' },
                                { name: 'Maria Garcia', email: 'maria@systemsteel.ae', role: 'Sales Rep', status: 'Active' },
                            ].map((user, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-xs font-medium">
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">{user.role}</Badge>
                                        <div className="flex items-center gap-1.5 w-24">
                                            <div className={user.status === 'Active' ? 'h-1.5 w-1.5 rounded-full bg-emerald-500' : 'h-1.5 w-1.5 rounded-full bg-amber-500'} />
                                            <span className="text-muted-foreground">{user.status}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Approval Chains
                                </CardTitle>
                                <CardDescription className="text-xs">Define multi-stage approval logic for critical transactions.</CardDescription>
                            </div>
                            <Button size="sm" onClick={handleAdd} className="gap-2">
                                <Plus className="h-4 w-4" /> Create Flow
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {workflows.map((flow, i) => (
                                <div key={i} className="p-4 border rounded-lg group hover:border-primary/50 transition-all space-y-4 relative">
                                    <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(flow)}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(flow.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {flow.title.includes('Payroll') && <DollarSign className="h-4 w-4 text-emerald-500" />}
                                            <h4 className="text-sm font-bold">{flow.title}</h4>
                                        </div>
                                        <Badge variant={flow.status === 'Active' ? 'secondary' : 'outline'}>{flow.status}</Badge>
                                    </div>

                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {flow.flow.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-2 shrink-0">
                                                <div className="px-3 py-1.5 rounded bg-muted border border-border/50 text-[10px] space-y-0.5">
                                                    <p className="font-bold text-foreground leading-none">{step.role || 'Unassigned'}</p>
                                                    <p className="text-muted-foreground opacity-70 italic">{step.action || 'No action'}</p>
                                                </div>
                                                {idx < flow.flow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-6 text-[11px] text-muted-foreground font-medium uppercase tracking-wider pt-2 border-t border-border/30">
                                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {flow.stages} Stages</span>
                                        <span className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Limit: {flow.threshold}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Global Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Auto-Escalation</Label>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Parallel Approvals</Label>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Mobile Sign-off</Label>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                            <Button className="w-full h-8 text-xs" variant="outline">Advanced Config</Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingFlow?.id ? 'Edit Approval Flow' : 'Create New Approval Flow'}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Define the sequential steps and roles required for this business process.
                        </DialogDescription>
                    </DialogHeader>

                    {editingFlow && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Workflow Name</Label>
                                <Input
                                    value={editingFlow.title}
                                    onChange={(e) => setEditingFlow({ ...editingFlow, title: e.target.value })}
                                    placeholder="e.g. Sales Commission Approval"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Amount Limit / Threshold</Label>
                                <Input
                                    value={editingFlow.threshold}
                                    onChange={(e) => setEditingFlow({ ...editingFlow, threshold: e.target.value })}
                                    placeholder="e.g. AED 10,000 or 'All'"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Flow Sequence</Label>
                                    <Button variant="outline" size="sm" onClick={addStep} className="h-7 text-[10px] gap-1">
                                        <Plus className="h-3 w-3" /> Add Step
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                                    {editingFlow.flow.map((step: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                <Select value={step.role} onValueChange={(v) => updateStep(idx, 'role', v)}>
                                                    <SelectTrigger className="h-8 text-[10px]">
                                                        <SelectValue placeholder="Select Role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HR Manager">HR Manager</SelectItem>
                                                        <SelectItem value="MD / Admin">MD / Admin</SelectItem>
                                                        <SelectItem value="Finance Team">Finance Team</SelectItem>
                                                        <SelectItem value="Dept Head">Dept Head</SelectItem>
                                                        <SelectItem value="Procurement">Procurement</SelectItem>
                                                        <SelectItem value="Accountant">Accountant</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    value={step.action}
                                                    onChange={(e) => updateStep(idx, 'action', e.target.value)}
                                                    placeholder="Action name"
                                                    className="h-8 text-[10px]"
                                                />
                                            </div>
                                            {editingFlow.flow.length > 1 && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeStep(idx)}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={saveWorkflow}>Save Workflow</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
