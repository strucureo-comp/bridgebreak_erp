'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Users, Shield, Lock, ChevronRight, Fingerprint,
    UserPlus, Settings2, CheckCircle2, AlertCircle,
    Clock, Search, MoreVertical, DollarSign, ArrowRight,
    Plus, Trash2, Edit2, X
} from 'lucide-react';
import { toast } from 'sonner';

interface Role { id: number; name: string; users: number; level: string; }
interface UserEntry { id: number; name: string; email: string; role: string; status: 'Active' | 'On Leave' | 'Suspended'; }
interface WorkflowStep { role: string; action: string; }
interface Workflow { id: number; title: string; status: string; stages: number; threshold: string; flow: WorkflowStep[]; }
interface GlobalSettings { autoEscalation: boolean; parallelApprovals: boolean; mobileSignoff: boolean; }

interface RolesConfigData {
    roles: Role[];
    users: UserEntry[];
    workflows: Workflow[];
    globalSettings: GlobalSettings;
}

interface RolePermissionConfigProps {
    value?: RolesConfigData;
    onChange?: (data: RolesConfigData) => void;
}

export function RolePermissionConfig({ value, onChange }: RolePermissionConfigProps) {
    const [roles, setRoles] = useState<Role[]>(value?.roles || []);
    const [users, setUsers] = useState<UserEntry[]>(value?.users || []);
    const [workflows, setWorkflows] = useState<Workflow[]>(value?.workflows || []);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(value?.globalSettings || { autoEscalation: false, parallelApprovals: true, mobileSignoff: true });

    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
    const [userSearch, setUserSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<any>(null);

    // Sync from parent on mount
    useEffect(() => {
        if (value) {
            setRoles(value.roles);
            setUsers(value.users);
            setWorkflows(value.workflows);
            setGlobalSettings(value.globalSettings);
        }
    }, []); // Only on mount

    const emit = (patch: Partial<RolesConfigData>) => {
        const full: RolesConfigData = { roles, users, workflows, globalSettings, ...patch };
        onChange?.(full);
    };

    // === ROLE HANDLERS ===
    const handleAddRole = () => { setEditingRole({ id: 0, name: '', users: 0, level: 'View Only' }); setRoleDialogOpen(true); };
    const handleEditRole = (role: Role) => { setEditingRole({ ...role }); setRoleDialogOpen(true); };
    const handleDeleteRole = (id: number) => {
        const updated = roles.filter(r => r.id !== id);
        setRoles(updated); emit({ roles: updated }); toast.success('Role deleted');
    };
    const handleSaveRole = () => {
        if (!editingRole || !editingRole.name) { toast.error('Role name is required'); return; }
        let updated: Role[];
        if (editingRole.id) {
            updated = roles.map(r => r.id === editingRole.id ? editingRole : r);
            toast.success('Role updated');
        } else {
            updated = [...roles, { ...editingRole, id: Date.now() }];
            toast.success('Role created');
        }
        setRoles(updated); emit({ roles: updated }); setRoleDialogOpen(false);
    };

    // === USER HANDLERS ===
    const handleAddUser = () => { setEditingUser({ id: 0, name: '', email: '', role: roles[0]?.name || 'Administrator', status: 'Active' }); setUserDialogOpen(true); };
    const handleEditUser = (user: UserEntry) => { setEditingUser({ ...user }); setUserDialogOpen(true); };
    const handleDeleteUser = (id: number) => {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated); emit({ users: updated }); toast.success('User removed');
    };
    const handleToggleUserStatus = (user: UserEntry) => {
        const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
        const updated = users.map(u => u.id === user.id ? { ...u, status: nextStatus as UserEntry['status'] } : u);
        setUsers(updated); emit({ users: updated });
        toast.success(`User ${nextStatus === 'Suspended' ? 'suspended' : 'reactivated'}`);
    };
    const handleSaveUser = () => {
        if (!editingUser || !editingUser.name || !editingUser.email) { toast.error('Name and email are required'); return; }
        let updated: UserEntry[];
        if (editingUser.id) {
            updated = users.map(u => u.id === editingUser.id ? editingUser : u);
            toast.success('User updated');
        } else {
            updated = [...users, { ...editingUser, id: Date.now() }];
            toast.success('User added');
        }
        setUsers(updated); emit({ users: updated }); setUserDialogOpen(false);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    // === WORKFLOW HANDLERS ===
    const handleEditWorkflow = (flow: Workflow) => { setEditingFlow({ ...flow }); setIsDialogOpen(true); };
    const handleAddWorkflow = () => { setEditingFlow({ title: '', status: 'Active', threshold: 'All', flow: [{ role: '', action: '' }] }); setIsDialogOpen(true); };
    const handleDeleteWorkflow = (id: number) => {
        const updated = workflows.filter(w => w.id !== id);
        setWorkflows(updated); emit({ workflows: updated }); toast.success('Workflow deleted');
    };
    const saveWorkflow = () => {
        if (!editingFlow?.title) { toast.error('Workflow name is required'); return; }
        let updated: Workflow[];
        if (editingFlow.id) {
            updated = workflows.map(w => w.id === editingFlow.id ? { ...editingFlow, stages: editingFlow.flow.length } : w);
            toast.success('Workflow updated');
        } else {
            updated = [...workflows, { ...editingFlow, id: Date.now(), stages: editingFlow.flow.length }];
            toast.success('Workflow created');
        }
        setWorkflows(updated); emit({ workflows: updated }); setIsDialogOpen(false);
    };
    const addStep = () => { setEditingFlow({ ...editingFlow, flow: [...editingFlow.flow, { role: '', action: '' }] }); };
    const removeStep = (index: number) => { setEditingFlow({ ...editingFlow, flow: editingFlow.flow.filter((_: any, i: number) => i !== index) }); };
    const updateStep = (index: number, field: string, value: string) => {
        const newFlow = [...editingFlow.flow];
        newFlow[index] = { ...newFlow[index], [field]: value };
        setEditingFlow({ ...editingFlow, flow: newFlow });
    };

    // === GLOBAL SETTINGS ===
    const updateGlobal = (key: keyof GlobalSettings, val: boolean) => {
        const updated = { ...globalSettings, [key]: val };
        setGlobalSettings(updated);
        emit({ globalSettings: updated });
        toast.success(`${key === 'autoEscalation' ? 'Auto-escalation' : key === 'parallelApprovals' ? 'Parallel approvals' : 'Mobile sign-off'} ${val ? 'enabled' : 'disabled'}`);
    };

    const roleNames = roles.map(r => r.name);

    return (
        <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="bg-muted/50 border">
                <TabsTrigger value="roles">Roles Registry</TabsTrigger>
                <TabsTrigger value="users">User Directory</TabsTrigger>
                <TabsTrigger value="approvals">Approval Workflows</TabsTrigger>
            </TabsList>

            {/* ROLES TAB */}
            <TabsContent value="roles" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Defined Access Roles</CardTitle>
                            <CardDescription className="text-xs">Manage permissions and access levels for system roles.</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleAddRole} className="gap-2"><Plus className="h-4 w-4" /> Add Role</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {roles.map((role) => (
                                <div key={role.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Lock size={16} className="text-muted-foreground" /></div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{role.name}</p>
                                            <p className="text-xs text-muted-foreground">{role.users} Active Users · {role.level}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditRole(role)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            ))}
                            {roles.length === 0 && <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No roles defined. Click &quot;Add Role&quot; to create one.</div>}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Active Directory</CardTitle>
                            <CardDescription className="text-xs">Manage system users and their account status.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="Search users..." className="h-9 w-64 pl-8 text-xs" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                            </div>
                            <Button size="sm" className="gap-2" onClick={handleAddUser}><UserPlus className="h-4 w-4" /> Add User</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-t">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
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
                                            <div className={user.status === 'Active' ? 'h-1.5 w-1.5 rounded-full bg-emerald-500' : user.status === 'On Leave' ? 'h-1.5 w-1.5 rounded-full bg-amber-500' : 'h-1.5 w-1.5 rounded-full bg-red-500'} />
                                            <span className="text-muted-foreground">{user.status}</span>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditUser(user)}><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit User</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}><Shield className="h-3.5 w-3.5 mr-2" />{user.status === 'Suspended' ? 'Reactivate' : 'Suspend'}</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Remove User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">{userSearch ? 'No users match your search.' : 'No users in system.'}</div>}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* APPROVALS TAB */}
            <TabsContent value="approvals" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Approval Chains</CardTitle>
                                <CardDescription className="text-xs">Define multi-stage approval logic for critical transactions.</CardDescription>
                            </div>
                            <Button size="sm" onClick={handleAddWorkflow} className="gap-2"><Plus className="h-4 w-4" /> Create Flow</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {workflows.map((flow) => (
                                <div key={flow.id} className="p-4 border rounded-lg group hover:border-primary/50 transition-all space-y-4 relative">
                                    <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditWorkflow(flow)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteWorkflow(flow.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {flow.title.includes('Payroll') && <DollarSign className="h-4 w-4 text-emerald-500" />}
                                            <h4 className="text-sm font-bold">{flow.title}</h4>
                                        </div>
                                        <Badge variant={flow.status === 'Active' ? 'secondary' : 'outline'}>{flow.status}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {flow.flow.map((step: WorkflowStep, idx: number) => (
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
                            {workflows.length === 0 && <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No approval workflows. Click &quot;Create Flow&quot; to add one.</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold">Global Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between"><Label className="text-xs">Auto-Escalation</Label><Switch checked={globalSettings.autoEscalation} onCheckedChange={(v) => updateGlobal('autoEscalation', v)} /></div>
                            <div className="flex items-center justify-between"><Label className="text-xs">Parallel Approvals</Label><Switch checked={globalSettings.parallelApprovals} onCheckedChange={(v) => updateGlobal('parallelApprovals', v)} /></div>
                            <div className="flex items-center justify-between"><Label className="text-xs">Mobile Sign-off</Label><Switch checked={globalSettings.mobileSignoff} onCheckedChange={(v) => updateGlobal('mobileSignoff', v)} /></div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ROLE DIALOG */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{editingRole?.id ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                        <DialogDescription className="text-xs">Define access level and permissions for this role.</DialogDescription>
                    </DialogHeader>
                    {editingRole && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Role Name</Label>
                                <Input value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} placeholder="e.g. Warehouse Supervisor" className="h-9 text-xs" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs">Access Level</Label>
                                <Select value={editingRole.level} onValueChange={(v) => setEditingRole({ ...editingRole, level: v })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full">Full Access</SelectItem>
                                        <SelectItem value="Audit & Approve">Audit & Approve</SelectItem>
                                        <SelectItem value="Execution">Execution</SelectItem>
                                        <SelectItem value="CRM Access">CRM Access</SelectItem>
                                        <SelectItem value="View Only">View Only</SelectItem>
                                        <SelectItem value="Custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveRole}>Save Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* USER DIALOG */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser?.id ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription className="text-xs">Manage user details and assigned role.</DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Full Name</Label>
                                <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="John Smith" className="h-9 text-xs" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs">Email Address</Label>
                                <Input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} placeholder="john@company.ae" className="h-9 text-xs" type="email" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs">Assigned Role</Label>
                                <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roleNames.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs">Status</Label>
                                <Select value={editingUser.status} onValueChange={(v) => setEditingUser({ ...editingUser, status: v as UserEntry['status'] })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="On Leave">On Leave</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveUser}>Save User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* WORKFLOW DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingFlow?.id ? 'Edit Approval Flow' : 'Create New Approval Flow'}</DialogTitle>
                        <DialogDescription className="text-xs">Define the sequential steps and roles required for this business process.</DialogDescription>
                    </DialogHeader>
                    {editingFlow && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Workflow Name</Label>
                                <Input value={editingFlow.title} onChange={(e) => setEditingFlow({ ...editingFlow, title: e.target.value })} placeholder="e.g. Sales Commission Approval" className="h-9 text-xs" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs">Amount Limit / Threshold</Label>
                                <Input value={editingFlow.threshold} onChange={(e) => setEditingFlow({ ...editingFlow, threshold: e.target.value })} placeholder="e.g. AED 10,000 or 'All'" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Flow Sequence</Label>
                                    <Button variant="outline" size="sm" onClick={addStep} className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add Step</Button>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                                    {editingFlow.flow.map((step: WorkflowStep, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{idx + 1}</div>
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                <Select value={step.role} onValueChange={(v) => updateStep(idx, 'role', v)}>
                                                    <SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Select Role" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HR Manager">HR Manager</SelectItem>
                                                        <SelectItem value="MD / Admin">MD / Admin</SelectItem>
                                                        <SelectItem value="Finance Team">Finance Team</SelectItem>
                                                        <SelectItem value="Dept Head">Dept Head</SelectItem>
                                                        <SelectItem value="Procurement">Procurement</SelectItem>
                                                        <SelectItem value="Accountant">Accountant</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input value={step.action} onChange={(e) => updateStep(idx, 'action', e.target.value)} placeholder="Action name" className="h-8 text-[10px]" />
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
