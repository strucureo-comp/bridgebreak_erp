'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Plus, Trash2, ArrowRight, Workflow, Edit2, DollarSign, Receipt, ShoppingCart, Users, FileText, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============= TYPES =============

interface ApprovalStep {
    id: string;
    order: number;
    role: string;
    action: 'approve' | 'verify' | 'authorize';
}

interface ApprovalWorkflow {
    id: string;
    name: string;
    description: string;
    module: string;
    enabled: boolean;
    threshold?: number;
    steps: ApprovalStep[];
    allowSelfApproval: boolean;
}

// ============= DEFAULT DATA =============

// Get roles from localStorage or use defaults
const getRoles = (): string[] => {
    const saved = localStorage.getItem('roles_settings');
    if (saved) {
        const roles = JSON.parse(saved);
        return roles.map((r: any) => r.name);
    }
    return ['Administrator', 'Finance Manager', 'Sales Manager', 'HR Manager', 'Operations Manager', 'Project Manager', 'Employee', 'Viewer'];
};

const MODULES = [
    { id: 'payroll', name: 'Payroll Approval', icon: DollarSign },
    { id: 'purchases', name: 'Purchase Requests', icon: ShoppingCart },
    { id: 'invoices', name: 'Invoice Approvals', icon: Receipt },
    { id: 'expenses', name: 'Expense Claims', icon: Users },
    { id: 'leaves', name: 'Leave Requests', icon: Users },
    { id: 'quotations', name: 'Quotations', icon: FileText },
    { id: 'projects', name: 'Project Budget', icon: Building2 },
];

const DEFAULT_WORKFLOWS: ApprovalWorkflow[] = [
    {
        id: '1',
        name: 'Payroll Approval',
        description: 'HR Manager prepares → Finance verifies → MD/CEO authorizes',
        module: 'payroll',
        enabled: true,
        threshold: 0,
        allowSelfApproval: false,
        steps: [
            { id: 's1', order: 1, role: 'HR Manager', action: 'verify' },
            { id: 's2', order: 2, role: 'Finance Manager', action: 'verify' },
            { id: 's3', order: 3, role: 'Administrator', action: 'authorize' },
        ]
    },
    {
        id: '2',
        name: 'Purchase Request',
        description: 'Department request → Operations verify → Finance authorize',
        module: 'purchases',
        enabled: true,
        threshold: 10000,
        allowSelfApproval: false,
        steps: [
            { id: 's1', order: 1, role: 'Operations Manager', action: 'verify' },
            { id: 's2', order: 2, role: 'Finance Manager', action: 'authorize' },
        ]
    },
    {
        id: '3',
        name: 'Leave Approval',
        description: 'Employee request → Manager approve → HR verify',
        module: 'leaves',
        enabled: true,
        allowSelfApproval: false,
        steps: [
            { id: 's1', order: 1, role: 'Operations Manager', action: 'approve' },
            { id: 's2', order: 2, role: 'HR Manager', action: 'verify' },
        ]
    },
];

// ============= MAIN COMPONENT =============

export default function ApprovalsSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(DEFAULT_WORKFLOWS);
    const [roles, setRoles] = useState<string[]>(getRoles());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

    useEffect(() => {
        const savedWorkflows = localStorage.getItem('approval_workflows');
        const savedRoles = localStorage.getItem('roles_settings');
        if (savedWorkflows) setWorkflows(JSON.parse(savedWorkflows));
        if (savedRoles) {
            const parsedRoles = JSON.parse(savedRoles);
            setRoles(parsedRoles.map((r: any) => r.name));
        }
        setLoading(false);
    }, []);

    const handleAddWorkflow = () => {
        setEditingWorkflow({
            id: Date.now().toString(),
            name: '',
            description: '',
            module: 'payroll',
            enabled: true,
            allowSelfApproval: false,
            steps: [{ id: 's1', order: 1, role: '', action: 'approve' }],
        });
        setDialogOpen(true);
    };

    const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
        setEditingWorkflow({ ...workflow });
        setDialogOpen(true);
    };

    const handleSaveWorkflow = () => {
        if (!editingWorkflow?.name) {
            toast.error('Workflow name is required');
            return;
        }
        if (editingWorkflow.steps.some(s => !s.role)) {
            toast.error('All approval steps must have a role selected');
            return;
        }

        const existing = workflows.find(w => w.id === editingWorkflow.id);
        if (existing) {
            setWorkflows(workflows.map(w => w.id === editingWorkflow.id ? editingWorkflow : w));
            toast.success('Workflow updated');
        } else {
            setWorkflows([...workflows, editingWorkflow]);
            toast.success('Workflow created');
        }

        setDialogOpen(false);
        setEditingWorkflow(null);
    };

    const handleDeleteWorkflow = (id: string) => {
        setWorkflows(workflows.filter(w => w.id !== id));
        toast.success('Workflow deleted');
        setDeleteConfirmOpen(false);
        setWorkflowToDelete(null);
    };

    const handleToggleWorkflow = (id: string) => {
        setWorkflows(workflows.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
    };

    const handleAddStep = () => {
        if (!editingWorkflow) return;
        const newStep: ApprovalStep = {
            id: `s${editingWorkflow.steps.length + 1}`,
            order: editingWorkflow.steps.length + 1,
            role: '',
            action: 'approve',
        };
        setEditingWorkflow({ ...editingWorkflow, steps: [...editingWorkflow.steps, newStep] });
    };

    const handleRemoveStep = (stepId: string) => {
        if (!editingWorkflow) return;
        const updatedSteps = editingWorkflow.steps
            .filter(s => s.id !== stepId)
            .map((s, idx) => ({ ...s, order: idx + 1 }));
        setEditingWorkflow({ ...editingWorkflow, steps: updatedSteps });
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        localStorage.setItem('approval_workflows', JSON.stringify(workflows));
        toast.success('Approvals saved');
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Approval Workflows</h1>
                    <p className="text-muted-foreground">Create custom approval chains based on roles</p>
                </div>
                <Button onClick={handleAddWorkflow} className="gap-1">
                    <Plus className="h-4 w-4" /> Create Workflow
                </Button>
            </div>

            {/* Workflows List */}
            <div className="grid gap-4">
                {workflows.map((workflow) => {
                    const module = MODULES.find(m => m.id === workflow.module);
                    return (
                        <Card key={workflow.id} className={cn(!workflow.enabled && "opacity-60")}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", workflow.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                            {module ? <module.icon className="h-6 w-6" /> : <Workflow className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{workflow.name}</p>
                                                <Badge variant={workflow.enabled ? "default" : "secondary"}>
                                                    {workflow.enabled ? "Active" : "Disabled"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                            {workflow.threshold !== undefined && workflow.threshold > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Threshold: AED {workflow.threshold.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={workflow.enabled} onCheckedChange={() => handleToggleWorkflow(workflow.id)} />
                                        <Button variant="ghost" size="sm" onClick={() => handleEditWorkflow(workflow)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => { setWorkflowToDelete(workflow.id); setDeleteConfirmOpen(true); }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Approval Chain Visual */}
                                {workflow.steps.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Approval Chain:</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {workflow.steps.map((step, idx) => (
                                                <div key={step.id} className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {idx + 1}. {step.role} ({step.action})
                                                    </Badge>
                                                    {idx < workflow.steps.length - 1 && (
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {workflows.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No approval workflows created</p>
                    <Button variant="outline" className="mt-4" onClick={handleAddWorkflow}>
                        <Plus className="h-4 w-4 mr-2" /> Create First Workflow
                    </Button>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingWorkflow?.id && workflows.find(w => w.id === editingWorkflow.id) ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
                    </DialogHeader>
                    {editingWorkflow && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Workflow Name *</Label>
                                    <Input
                                        value={editingWorkflow.name}
                                        onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                        placeholder="e.g., Payroll Approval"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Module</Label>
                                    <Select value={editingWorkflow.module} onValueChange={(v) => setEditingWorkflow({ ...editingWorkflow, module: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {MODULES.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={editingWorkflow.description}
                                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                                    placeholder="Brief description of this workflow"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Threshold Amount (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={editingWorkflow.threshold || ''}
                                        onChange={(e) => setEditingWorkflow({ ...editingWorkflow, threshold: parseFloat(e.target.value) || undefined })}
                                        placeholder="0 for all amounts"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2 h-10">
                                        <Switch checked={editingWorkflow.enabled} onCheckedChange={(v) => setEditingWorkflow({ ...editingWorkflow, enabled: v })} />
                                        <span className="text-sm">{editingWorkflow.enabled ? 'Active' : 'Disabled'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Steps */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Approval Chain *</Label>
                                    <Button variant="outline" size="sm" onClick={handleAddStep}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Step
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Define the order of approvers. Example: HR Manager → Finance → MD</p>
                                <div className="space-y-2">
                                    {editingWorkflow.steps.map((step, idx) => (
                                        <div key={step.id} className="flex items-center gap-2 p-3 border rounded-lg">
                                            <Badge variant="outline" className="w-8">{idx + 1}</Badge>
                                            <Select value={step.role} onValueChange={(v) => {
                                                const updated = [...editingWorkflow.steps];
                                                updated[idx].role = v;
                                                setEditingWorkflow({ ...editingWorkflow, steps: updated });
                                            }}>
                                                <SelectTrigger className="flex-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select value={step.action} onValueChange={(v: any) => {
                                                const updated = [...editingWorkflow.steps];
                                                updated[idx].action = v;
                                                setEditingWorkflow({ ...editingWorkflow, steps: updated });
                                            }}>
                                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="approve">Approve</SelectItem>
                                                    <SelectItem value="verify">Verify</SelectItem>
                                                    <SelectItem value="authorize">Authorize</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveStep(step.id)} disabled={editingWorkflow.steps.length === 1}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveWorkflow}>Save Workflow</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workflow</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this workflow? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => workflowToDelete && handleDeleteWorkflow(workflowToDelete)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
