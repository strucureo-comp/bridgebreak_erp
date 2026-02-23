"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Lock,
    Plus,
    AlertTriangle,
    CheckCircle2,
    Ban
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    getApprovalWorkflows,
    createApprovalWorkflow,
    getBudgetControls,
    setBudgetControl,
    getAccounts
} from "@/lib/api";

export function ControlsContent() {
    const [activeTab, setActiveTab] = useState("approvals");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Approval Workflows</CardTitle>
                            <CardDescription>Configure rules for transaction approvals</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-rose-50/50">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Budget Controls</CardTitle>
                            <CardDescription>Set spending limits and enforcement actions</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="bg-card p-1 rounded-xl border border-border w-fit">
                    <TabsTrigger value="approvals" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        Approval Workflows
                    </TabsTrigger>
                    <TabsTrigger value="budgets" className="rounded-lg data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                        Budget Controls
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="approvals">
                    <ApprovalWorkflowsList />
                </TabsContent>

                <TabsContent value="budgets">
                    <BudgetControlsList />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ApprovalWorkflowsList() {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form
    const [entityType, setEntityType] = useState("journal_entry");
    const [minAmount, setMinAmount] = useState("");
    const [role, setRole] = useState("admin");

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const data = await getApprovalWorkflows();
            setWorkflows(data || []);
        } catch (e) {
            console.error(e);
        }
    }

    async function handleCreate() {
        if (!minAmount) return toast.error("Enter minimum amount");
        setLoading(true);
        try {
            await createApprovalWorkflow({
                entity_type: entityType,
                min_amount: Number(minAmount),
                approver_role: role
            });
            toast.success("Workflow rule created");
            setIsOpen(false);
            load();
            setMinAmount("");
        } catch (e) {
            toast.error("Failed to create rule");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Active Approval Rules</CardTitle>
                    <CardDescription>Transactions matching these criteria require approval.</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 text-card-foreground hover:bg-slate-800">
                            <Plus className="mr-2 h-4 w-4" /> New Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Approval Rule</DialogTitle>
                            <DialogDescription>Define thresholds for mandatory approvals.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Transaction Type</Label>
                                <Select value={entityType} onValueChange={setEntityType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="journal_entry">Journal Entry</SelectItem>
                                        <SelectItem value="vendor_bill">Vendor Bill</SelectItem>
                                        <SelectItem value="expense_claim">Expense Claim</SelectItem>
                                        <SelectItem value="purchase_order">Purchase Order</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Minimum Amount ($)</Label>
                                <Input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="e.g. 1000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Approver Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="finance_head">Head of Finance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading ? 'Saving...' : 'Create Rule'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead>Threshold</TableHead>
                            <TableHead>Required Approver</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workflows.map((wf: any) => (
                            <TableRow key={wf.id}>
                                <TableCell className="font-medium capitalize">{wf.entity_type.replace('_', ' ')}</TableCell>
                                <TableCell>&gt; ${Number(wf.min_amount).toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline">{wf.approver_role}</Badge></TableCell>
                                <TableCell><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge></TableCell>
                            </TableRow>
                        ))}
                        {workflows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    No approval rules defined. All transactions will auto-approve if logic allows.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function BudgetControlsList() {
    const [controls, setControls] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form
    const [accountId, setAccountId] = useState("");
    const [period, setPeriod] = useState("monthly");
    const [limit, setLimit] = useState("");
    const [action, setAction] = useState("warn");

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const [cData, aData] = await Promise.all([getBudgetControls(), getAccounts()]);
            setControls(cData || []);
            setAccounts((aData as any[]).filter((a: any) => a.type === 'expense') || []);
        } catch (e) {
            console.error(e);
        }
    }

    async function handleCreate() {
        if (!accountId || !limit) return toast.error("Fill required fields");
        setLoading(true);
        try {
            await setBudgetControl({
                account_id: accountId,
                period,
                limit_amount: Number(limit),
                action
            });
            toast.success("Budget control set");
            setIsOpen(false);
            load();
            setLimit("");
        } catch (e) {
            toast.error("Failed to set budget");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Budget Limits</CardTitle>
                    <CardDescription>Control spending on specific expense accounts.</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 text-card-foreground hover:bg-slate-800">
                            <Plus className="mr-2 h-4 w-4" /> Set Budget
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Budget Limit</DialogTitle>
                            <DialogDescription>Define spending limits for an expense account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Expense Account</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((acc: any) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Period</Label>
                                    <Select value={period} onValueChange={setPeriod}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Limit Amount ($)</Label>
                                    <Input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="5000" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Enforcement Action</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="warn">Warning Notification</SelectItem>
                                        <SelectItem value="block">Block Transaction</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading ? 'Saving...' : 'Set Budget'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Limit</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Usage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {controls.map((c: any) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-bold">{c.account?.name} <span className="text-xs text-muted-foreground font-normal">({c.account?.code})</span></TableCell>
                                <TableCell className="capitalize">{c.period}</TableCell>
                                <TableCell>${Number(c.limit_amount).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={c.action === 'block' ? 'destructive' : 'secondary'}>
                                        {c.action.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {/* Placeholder for actual usage calc */}
                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[0%]" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">0% Used</span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {controls.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No budget limits set.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
