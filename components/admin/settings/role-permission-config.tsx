'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Shield, Lock, Eye,
    Pencil, ChevronRight, Users,
    Crown, Wallet, Cog, UserPlus,
    Search, Trash2, Mail, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUsers } from '@/lib/api';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant-context';

export type SystemRole = 'ceo' | 'hr' | 'finance' | 'operations' | 'admin';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

interface HubPermission {
    id: string;
    label: string;
    read: boolean;
    write: boolean;
}

const DEFAULT_HUBS = [
    { id: 'finance', label: 'Finance Hub' },
    { id: 'hr', label: 'Human Resources' },
    { id: 'sales', label: 'Sales CRM' },
    { id: 'ops', label: 'Operations' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'masters', label: 'Master Data' },
    { id: 'reports', label: 'Analytics' },
    { id: 'approvals', label: 'Workflow & Approvals' },
];

const WORKFLOW_TRIGGERS = [
    { id: 'mat_transfer', label: 'Inventory > Site Transfers', desc: 'Material requests exceeding $5k' },
    { id: 'purchase_po', label: 'Purchase Orders', desc: 'Vendor commitments above limit' },
    { id: 'finance_pay', label: 'Payment Clearances', desc: 'Outgoing supplier disbursements' },
    { id: 'hr_leave', label: 'Leave Requests', desc: 'Employee absentee approvals' },
];

export function RolePermissionConfig() {
    const { getModuleLabel, checkAccess } = useTenant();
    const [view, setView] = useState<'roles' | 'users' | 'workflows'>('roles');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('admin');
    const [selectedTrigger, setSelectedTrigger] = useState<string>('mat_transfer');

    // Mock sequential approval chains per trigger
    const [approvalChains, setApprovalChains] = useState<Record<string, string[]>>({
        mat_transfer: ['inventory_mgr', 'md', 'ceo'],
        purchase_po: ['finance', 'ceo'],
        finance_pay: ['finance'],
        hr_leave: ['manager', 'hr'],
    });

    const [permissions, setPermissions] = useState<Record<string, { read: boolean; write: boolean }>>(
        DEFAULT_HUBS.reduce((acc, hub) => ({ ...acc, [hub.id]: { read: true, write: false } }), {})
    );

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchUsers();
    }, []);

    const togglePermission = (hubId: string, type: 'read' | 'write') => {
        setPermissions(prev => ({
            ...prev,
            [hubId]: {
                ...prev[hubId],
                [type]: !prev[hubId][type]
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="bg-muted/50 border p-0.5 rounded-md inline-flex">
                    <button
                        onClick={() => setView('roles')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                            view === 'roles' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >Role Architect</button>
                    <button
                        onClick={() => setView('users')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                            view === 'users' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >Identity Registry</button>
                    <button
                        onClick={() => setView('workflows')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                            view === 'workflows' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >Approval Chains</button>
                </div>
                <Button size="sm" className="h-9 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest gap-2">
                    <UserPlus className="h-3.5 w-3.5" />
                    {view === 'roles' ? 'Create Role' : view === 'users' ? 'Invite User' : 'New Workflow'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: List of Roles or Users */}
                <div className="lg:col-span-4 space-y-2">
                    {view === 'roles' ? (
                        ['Admin', 'Manager', 'Executive', 'Staff', 'Auditor'].map((role) => (
                            <div
                                key={role}
                                onClick={() => setSelectedRole(role.toLowerCase())}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer",
                                    selectedRole === role.toLowerCase() ? "bg-card border-primary shadow-sm" : "bg-muted border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-8 w-8 rounded-md flex items-center justify-center",
                                        selectedRole === role.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight">{role}</span>
                                </div>
                                <ChevronRight className={cn("h-3 w-3", selectedRole === role.toLowerCase() ? "text-primary" : "text-muted-foreground/60")} />
                            </div>
                        ))
                    ) : view === 'workflows' ? (
                        WORKFLOW_TRIGGERS.map((trigger) => (
                            <div
                                key={trigger.id}
                                onClick={() => setSelectedTrigger(trigger.id)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer",
                                    selectedTrigger === trigger.id ? "bg-card border-primary shadow-sm" : "bg-muted border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-8 w-8 rounded-md flex items-center justify-center",
                                        selectedTrigger === trigger.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Cog className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <span className="text-[11px] block font-bold uppercase tracking-tight truncate">{trigger.label}</span>
                                        <span className="text-[9px] block text-muted-foreground uppercase">{approvalChains[trigger.id]?.length || 0} Steps Required</span>
                                    </div>
                                </div>
                                <ChevronRight className={cn("h-3 w-3 shrink-0", selectedTrigger === trigger.id ? "text-primary" : "text-muted-foreground/60")} />
                            </div>
                        ))
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer",
                                    selectedUser?.id === user.id ? "bg-card border-primary shadow-sm" : "bg-muted border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-8 w-8 rounded-md flex items-center justify-center font-bold text-[10px]",
                                        selectedUser?.id === user.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {user.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{user.full_name}</p>
                                        <p className="text-[9px] font-medium text-muted-foreground uppercase">{user.role}</p>
                                    </div>
                                </div>
                                <ChevronRight className={cn("h-3 w-3", selectedUser?.id === user.id ? "text-primary" : "text-muted-foreground/60")} />
                            </div>
                        ))
                    )}
                </div>

                {/* Right Panel: Permission Matrix */}
                <Card className="lg:col-span-8 border shadow-sm rounded-md bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">
                                {view === 'workflows' ? `Approval Chain: ${WORKFLOW_TRIGGERS.find(t => t.id === selectedTrigger)?.label}` : view === 'roles' ? `${selectedRole} Policy` : `User: ${selectedUser?.full_name || 'Select User'}`}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {view === 'workflows' ? 'Sequential Authorization Matrix' : 'Access control matrix'}
                            </p>
                        </div>
                        <Lock className="h-4 w-4 text-muted-foreground/60" />
                    </CardHeader>

                    <CardContent className="p-0">
                        {view === 'workflows' ? (
                            <div className="divide-y p-6 space-y-4">
                                <div className="space-y-1 mb-6">
                                    <h3 className="text-[13px] font-bold text-foreground tracking-tight uppercase">Authorization Sequence</h3>
                                    <p className="text-[11px] text-muted-foreground">When this trigger executes, the system will request clearance from each tier sequentially. If rejected at any stage, the chain terminates.</p>
                                </div>
                                <div className="space-y-3 relative">
                                    {/* Vertical connecting line */}
                                    <div className="absolute top-4 bottom-4 left-4 w-[2px] bg-border z-0" />

                                    {(approvalChains[selectedTrigger] || []).map((stepRole, idx) => (
                                        <div key={idx} className="relative z-10 flex items-center gap-4 bg-card">
                                            <div className="h-8 w-8 rounded-full border-2 border-primary bg-background text-primary flex items-center justify-center text-[10px] font-black shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <Crown className="h-4 w-4 text-muted-foreground" />
                                                    <div className="space-y-0.5">
                                                        <span className="text-xs font-bold uppercase">{typeof stepRole === 'string' ? stepRole.replace('_', ' ') : 'N/A'}</span>
                                                        <span className="block text-[9px] text-muted-foreground uppercase">Authorization Step {idx + 1}</span>
                                                    </div>
                                                </div>
                                                <button className="h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="relative z-10 flex items-center gap-4 bg-card pt-2">
                                        <div className="h-8 w-8 rounded-full border-2 border-dashed border-border bg-background text-muted-foreground flex items-center justify-center">
                                            ...
                                        </div>
                                        <Button variant="outline" className="h-9 border-dashed font-bold uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground">
                                            + Insert Rule Level
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y">
                                <div className="grid grid-cols-12 bg-muted/50 p-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    <div className="col-span-6">System Hub</div>
                                    <div className="col-span-3 text-center">Read</div>
                                    <div className="col-span-3 text-center">Write</div>
                                </div>
                                {DEFAULT_HUBS.filter(hub => {
                                    if (hub.id === 'approvals' || hub.id === 'masters' || hub.id === 'reports') return true;
                                    const access = checkAccess(hub.id as any);
                                    return access.accessible;
                                }).map((hub) => (
                                    <div key={hub.id} className="grid grid-cols-12 p-4 items-center hover:bg-accent hover:text-accent-foreground transition-colors group">
                                        <div className="col-span-6">
                                            <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                                                {hub.id === 'approvals' || hub.id === 'masters' || hub.id === 'reports' ? hub.label : getModuleLabel(hub.id)}
                                            </span>
                                        </div>
                                        <div className="col-span-3 flex justify-center">
                                            <button
                                                onClick={() => togglePermission(hub.id, 'read')}
                                                className={cn(
                                                    "h-7 px-3 rounded-md flex items-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-widest border",
                                                    permissions[hub.id]?.read || selectedRole === "admin"
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                        : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                {permissions[hub.id]?.read || selectedRole === "admin" ? <Check className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                Read
                                            </button>
                                        </div>
                                        <div className="col-span-3 flex justify-center">
                                            <button
                                                onClick={() => togglePermission(hub.id, 'write')}
                                                className={cn(
                                                    "h-7 px-3 rounded-md flex items-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-widest border",
                                                    permissions[hub.id]?.write || selectedRole === "admin"
                                                        ? "bg-primary border-primary/20 text-primary-foreground shadow-sm"
                                                        : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                {permissions[hub.id]?.write || selectedRole === "admin" ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                                                Write
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    <div className="p-4 border-t bg-muted flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                            <Shield className="h-3 w-3 text-primary" />
                            Policies enforce real-time data isolation
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] px-6 h-9">
                            Update Matrix
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
