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
import { Save, Loader2, Plus, Trash2, ArrowRight, Workflow, Edit2, DollarSign, Receipt, ShoppingCart, Users, FileText, Building2, Truck } from 'lucide-react';
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

// Sales CRM Document Approval Config
interface SalesApprovalConfig {
    quotation: { enabled: boolean; approverRole: string };
    proformaInvoice: { enabled: boolean; approverRole: string };
    salesInvoice: { enabled: boolean; approverRole: string };
    deliveryNote: { enabled: boolean; approverRole: string };
}

// ============= DEFAULT DATA =============

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

// Sales CRM Documents
const SALES_MODULES = [
    { id: 'quotation', name: 'Quotation', icon: FileText },
    { id: 'proformaInvoice', name: 'Proforma Invoice', icon: Receipt },
    { id: 'salesInvoice', name: 'Sales Invoice', icon: Receipt },
    { id: 'deliveryNote', name: 'Delivery Note', icon: Truck },
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

const DEFAULT_SALES_APPROVAL: SalesApprovalConfig = {
    quotation: { enabled: false, approverRole: '' },
    proformaInvoice: { enabled: false, approverRole: '' },
    salesInvoice: { enabled: false, approverRole: '' },
    deliveryNote: { enabled: false, approverRole: '' },
};

// ============= MAIN COMPONENT =============

export default function ApprovalsSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(DEFAULT_WORKFLOWS);
    const [salesApproval, setSalesApproval] = useState<SalesApprovalConfig>(DEFAULT_SALES_APPROVAL);
    const [roles, setRoles] = useState<string[]>(getRoles());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const savedWorkflows = localStorage.getItem('approval_workflows');
        const savedRoles = localStorage.getItem('roles_settings');
        const savedSalesApproval = localStorage.getItem('sales_approval_config');

        if (savedWorkflows) setWorkflows(JSON.parse(savedWorkflows));
        if (savedSalesApproval) setSalesApproval(JSON.parse(savedSalesApproval));
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

    const handleSalesApprovalToggle = (docId: keyof SalesApprovalConfig) => {
        setSalesApproval(prev => ({
            ...prev,
            [docId]: { ...prev[docId], enabled: !prev[docId].enabled }
        }));
    };

    const handleSalesApprovalRoleChange = (docId: keyof SalesApprovalConfig, role: string) => {
        setSalesApproval(prev => ({
            ...prev,
            [docId]: { ...prev[docId], approverRole: role }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        localStorage.setItem('approval_workflows', JSON.stringify(workflows));
        localStorage.setItem('sales_approval_config', JSON.stringify(salesApproval));
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
            <div>
                <h1 className="text-2xl font-semibold">Approval Workflows</h1>
                <p className="text-muted-foreground">Configure approval chains for all modules</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general">General Approvals</TabsTrigger>
                    <TabsTrigger value="sales">Sales & CRM</TabsTrigger>
                </TabsList>

                {/* General Approvals Tab */}
                <TabsContent value="general" className="space-y-4">
                    <div className="flex justify-end">
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
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Switch
                                                    checked={workflow.enabled}
                                                    onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                                                />
                                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", workflow.enabled ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                                    {module?.icon && <module.icon className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{workflow.name}</p>
                                                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {workflow.steps.map((step, idx) => (
                                                            <span key={step.id} className="flex items-center text-xs">
                                                                <Badge variant="outline" className="mr-1">{step.role}</Badge>
                                                                {idx < workflow.steps.length - 1 && <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditWorkflow(workflow)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteWorkflow(workflow.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Sales & CRM Approvals Tab */}
                <TabsContent value="sales" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sales & CRM Document Approvals</CardTitle>
                            <CardDescription>
                                Configure which roles can approve Sales & CRM documents.
                                Only selected role users will see Approve/Reject buttons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {SALES_MODULES.map((doc) => {
                                const config = salesApproval[doc.id as keyof SalesApprovalConfig];
                                return (
                                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Switch
                                                checked={config.enabled}
                                                onCheckedChange={() => handleSalesApprovalToggle(doc.id as keyof SalesApprovalConfig)}
                                            />
                                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.enabled ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                                <doc.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{doc.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {config.enabled ? `Approver: ${config.approverRole || 'Not set'}` : 'Approval not required'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-[200px]">
                                            <Select
                                                value={config.approverRole}
                                                onValueChange={(v) => handleSalesApprovalRoleChange(doc.id as keyof SalesApprovalConfig, v)}
                                                disabled={!config.enabled}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select approver role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Workflow className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium">How it works:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>Enable approval for a document type</li>
                                        <li>Select which role can approve (e.g., Finance Manager, Sales Manager)</li>
                                        <li>Only users with that role will see Approve/Reject buttons</li>
                                        <li>Documents will go through: Draft → Pending Approval → Approved/Rejected → Completed</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Edit Workflow Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingWorkflow?.id ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Workflow Name</Label>
                            <Input
                                value={editingWorkflow?.name || ''}
                                onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
                                placeholder="e.g., Payroll Approval"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Module</Label>
                            <Select
                                value={editingWorkflow?.module || 'payroll'}
                                onValueChange={(v) => setEditingWorkflow(prev => prev ? { ...prev, module: v } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODULES.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={editingWorkflow?.description || ''}
                                onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, description: e.target.value } : null)}
                                placeholder="Brief description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Approval Steps</Label>
                            <div className="space-y-2">
                                {editingWorkflow?.steps.map((step, idx) => (
                                    <div key={step.id} className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                                            {idx + 1}
                                        </div>
                                        <Select
                                            value={step.role}
                                            onValueChange={(v) => {
                                                const updated = editingWorkflow.steps.map(s => s.id === step.id ? { ...s, role: v } : s);
                                                setEditingWorkflow(prev => prev ? { ...prev, steps: updated } : null);
                                            }}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={step.action}
                                            onValueChange={(v: 'approve' | 'verify' | 'authorize') => {
                                                const updated = editingWorkflow.steps.map(s => s.id === step.id ? { ...s, action: v } : s);
                                                setEditingWorkflow(prev => prev ? { ...prev, steps: updated } : null);
                                            }}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="approve">Approve</SelectItem>
                                                <SelectItem value="verify">Verify</SelectItem>
                                                <SelectItem value="authorize">Authorize</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {editingWorkflow.steps.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveStep(step.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={handleAddStep} className="mt-2">
                                <Plus className="h-4 w-4 mr-1" /> Add Step
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveWorkflow}>Save Workflow</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
