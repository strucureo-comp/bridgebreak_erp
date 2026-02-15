'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
    Shield, Users, UserPlus, Search, ChevronRight,
    Crown, Briefcase, DollarSign, ShoppingCart,
    Cog, Eye, CheckCircle2, XCircle, Lock,
    Mail, MoreHorizontal, UserCheck, AlertTriangle,
    Pencil
} from 'lucide-react';

// Role definitions matching the ERP spec
const roleDefinitions = [
    {
        id: 'super_admin',
        name: 'Super Admin',
        subtitle: 'CEO / Owner',
        icon: Crown,
        color: 'bg-amber-500',
        description: 'Full access to all modules. Can override approvals.',
        userCount: 1,
        permissions: { finance: 'full', hr: 'full', sales: 'full', operations: 'full', reports: 'full', settings: 'full' }
    },
    {
        id: 'finance',
        name: 'Finance',
        subtitle: 'CFO / Accountant',
        icon: DollarSign,
        color: 'bg-emerald-500',
        description: 'Full access to Finance, Reports. Read-only for other modules.',
        userCount: 2,
        permissions: { finance: 'full', hr: 'view', sales: 'view', operations: 'view', reports: 'full', settings: 'limited' }
    },
    {
        id: 'hr',
        name: 'HR',
        subtitle: 'HR Manager',
        icon: Users,
        color: 'bg-blue-500',
        description: 'Full access to HR. View-only for Finance payroll posting.',
        userCount: 1,
        permissions: { finance: 'limited', hr: 'full', sales: 'none', operations: 'view', reports: 'limited', settings: 'limited' }
    },
    {
        id: 'sales',
        name: 'Sales',
        subtitle: 'Sales Manager / Rep',
        icon: ShoppingCart,
        color: 'bg-violet-500',
        description: 'Full access to Sales pipeline. Can create quotes and invoices.',
        userCount: 3,
        permissions: { finance: 'limited', hr: 'none', sales: 'full', operations: 'view', reports: 'limited', settings: 'none' }
    },
    {
        id: 'operations',
        name: 'Operations',
        subtitle: 'Ops / Project Manager',
        icon: Cog,
        color: 'bg-orange-500',
        description: 'Full access to Operations. Can manage projects, procurement.',
        userCount: 4,
        permissions: { finance: 'limited', hr: 'view', sales: 'view', operations: 'full', reports: 'limited', settings: 'none' }
    },
    {
        id: 'viewer',
        name: 'Viewer / Auditor',
        subtitle: 'External Auditor',
        icon: Eye,
        color: 'bg-slate-500',
        description: 'Read-only access across all modules for auditing purposes.',
        userCount: 1,
        permissions: { finance: 'view', hr: 'view', sales: 'view', operations: 'view', reports: 'view', settings: 'view' }
    },
];

// Mock users
const mockUsers = [
    { id: '1', name: 'Aathish Kumar', email: 'aathish@systemsteel.ae', role: 'super_admin', status: 'active', lastActive: '2 min ago', avatar: 'AK' },
    { id: '2', name: 'Viyas Ramachandran', email: 'viyasramachandran@gmail.com', role: 'super_admin', status: 'active', lastActive: '5 min ago', avatar: 'VR' },
    { id: '3', name: 'Mohammed Ali', email: 'mali@systemsteel.ae', role: 'finance', status: 'active', lastActive: '1 hr ago', avatar: 'MA' },
    { id: '4', name: 'Sara Ahmed', email: 'sara@systemsteel.ae', role: 'finance', status: 'active', lastActive: '3 hrs ago', avatar: 'SA' },
    { id: '5', name: 'Ravi Sharma', email: 'ravi@systemsteel.ae', role: 'hr', status: 'active', lastActive: '30 min ago', avatar: 'RS' },
    { id: '6', name: 'Fatima Khan', email: 'fatima@systemsteel.ae', role: 'sales', status: 'active', lastActive: '15 min ago', avatar: 'FK' },
    { id: '7', name: 'Ahmed Hassan', email: 'ahmed@systemsteel.ae', role: 'sales', status: 'active', lastActive: '1 day ago', avatar: 'AH' },
    { id: '8', name: 'John Smith', email: 'john@systemsteel.ae', role: 'sales', status: 'inactive', lastActive: '5 days ago', avatar: 'JS' },
    { id: '9', name: 'Suresh Kumar', email: 'suresh@systemsteel.ae', role: 'operations', status: 'active', lastActive: '10 min ago', avatar: 'SK' },
    { id: '10', name: 'Omar Farooq', email: 'omar@systemsteel.ae', role: 'operations', status: 'active', lastActive: '2 hrs ago', avatar: 'OF' },
    { id: '11', name: 'David Lee', email: 'david@systemsteel.ae', role: 'operations', status: 'active', lastActive: '45 min ago', avatar: 'DL' },
    { id: '12', name: 'External Auditor', email: 'audit@pwc.com', role: 'viewer', status: 'active', lastActive: '3 days ago', avatar: 'EA' },
];

// Permission matrix modules and actions
const permissionModules = [
    {
        module: 'Finance',
        subModules: [
            { name: 'Chart of Accounts', actions: ['view', 'create', 'edit', 'delete'] },
            { name: 'Journal Entries', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Invoices', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Payables', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Reports', actions: ['view', 'export'] },
        ]
    },
    {
        module: 'Sales',
        subModules: [
            { name: 'Leads', actions: ['view', 'create', 'edit', 'delete'] },
            { name: 'Quotations', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Sales Orders', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Customers', actions: ['view', 'create', 'edit', 'delete'] },
        ]
    },
    {
        module: 'HR',
        subModules: [
            { name: 'Employees', actions: ['view', 'create', 'edit', 'delete'] },
            { name: 'Attendance', actions: ['view', 'create', 'edit'] },
            { name: 'Leave', actions: ['view', 'create', 'approve'] },
            { name: 'Payroll', actions: ['view', 'create', 'approve', 'post'] },
        ]
    },
    {
        module: 'Operations',
        subModules: [
            { name: 'Projects', actions: ['view', 'create', 'edit', 'delete'] },
            { name: 'Purchase Orders', actions: ['view', 'create', 'edit', 'approve'] },
            { name: 'Inventory', actions: ['view', 'create', 'edit', 'adjust'] },
            { name: 'GRN', actions: ['view', 'create', 'edit'] },
        ]
    },
];

import { ModuleGuard } from '@/components/layout/module-guard';

export default function UsersRolesPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !selectedRole || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    return (
        <DashboardShell requireAdmin>
            <ModuleGuard module="users_roles">
                <div className="space-y-8 pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Manage access control and permissions
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button className="rounded-xl font-semibold gap-2 h-11">
                            <UserPlus className="h-4 w-4" />
                            Invite User
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Users" value={mockUsers.length.toString()} icon={Users} />
                        <StatCard label="Active" value={mockUsers.filter(u => u.status === 'active').length.toString()} icon={UserCheck} color="emerald" />
                        <StatCard label="Roles" value={roleDefinitions.length.toString()} icon={Shield} color="violet" />
                        <StatCard label="Inactive" value={mockUsers.filter(u => u.status === 'inactive').length.toString()} icon={AlertTriangle} color="amber" />
                    </div>

                    {/* Main Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="rounded-2xl bg-background border shadow-sm p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="users" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Users className="h-3.5 w-3.5" /> Users
                            </TabsTrigger>
                            <TabsTrigger value="roles" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Shield className="h-3.5 w-3.5" /> Roles
                            </TabsTrigger>
                            <TabsTrigger value="permissions" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5">
                                <Lock className="h-3.5 w-3.5" /> Permission Matrix
                            </TabsTrigger>
                        </TabsList>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-4">
                            {/* Search & Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-10 rounded-xl h-11"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setSelectedRole(null)}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                                            !selectedRole ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        All
                                    </button>
                                    {roleDefinitions.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                                                selectedRole === role.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User List */}
                            <div className="space-y-2">
                                {filteredUsers.map(user => {
                                    const roleDef = roleDefinitions.find(r => r.id === user.role);
                                    return (
                                        <Card key={user.id} className="rounded-2xl border-border/50 hover:shadow-md transition-all duration-200 group cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                                                            roleDef?.color || 'bg-slate-500'
                                                        )}>
                                                            {user.avatar}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                                {user.name}
                                                                {user.role === 'super_admin' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Badge variant="outline" className="rounded-lg text-[10px] font-semibold hidden sm:flex">
                                                            {roleDef?.name}
                                                        </Badge>
                                                        <div className="text-right hidden md:block">
                                                            <p className="text-xs text-muted-foreground">Last active</p>
                                                            <p className="text-xs font-semibold">{user.lastActive}</p>
                                                        </div>
                                                        <Badge className={cn(
                                                            "rounded-full text-[10px] font-semibold border-none",
                                                            user.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                        )}>
                                                            {user.status}
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        {/* Roles Tab */}
                        <TabsContent value="roles" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Access Roles</h3>
                                    <p className="text-sm text-muted-foreground">Define who can access what across the ERP</p>
                                </div>
                                <Button variant="outline" className="rounded-xl font-semibold gap-2">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Create Custom Role
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {roleDefinitions.map(role => {
                                    const RoleIcon = role.icon;
                                    return (
                                        <Card key={role.id} className="rounded-3xl border-border/50 hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className={cn("p-5 text-white", role.color)}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                                                            <RoleIcon className="h-5 w-5" />
                                                        </div>
                                                        <Badge className="bg-white/20 text-white border-none rounded-full text-[10px] font-bold">
                                                            {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="text-lg font-bold mt-4">{role.name}</h3>
                                                    <p className="text-sm text-white/80">{role.subtitle}</p>
                                                </div>
                                                <div className="p-5 space-y-4">
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Module Access</p>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            {Object.entries(role.permissions).map(([mod, level]) => (
                                                                <div key={mod} className="flex items-center gap-1.5">
                                                                    <div className={cn(
                                                                        "h-1.5 w-1.5 rounded-full",
                                                                        level === 'full' ? 'bg-emerald-500' :
                                                                            level === 'limited' ? 'bg-amber-500' :
                                                                                level === 'view' ? 'bg-blue-500' :
                                                                                    'bg-red-300'
                                                                    )} />
                                                                    <span className="text-[11px] font-medium text-muted-foreground capitalize">{mod}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Full Access</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Limited</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> View Only</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-300" /> No Access</span>
                            </div>
                        </TabsContent>

                        {/* Permission Matrix Tab */}
                        <TabsContent value="permissions" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Permission Matrix</h3>
                                    <p className="text-sm text-muted-foreground">Module → Sub-module → Action level permissions</p>
                                </div>
                                <Button className="rounded-xl font-semibold gap-2 h-11">
                                    Save Permissions
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {permissionModules.map(pm => (
                                    <Card key={pm.module} className="rounded-3xl border-border/50 overflow-hidden">
                                        <CardHeader className="bg-muted/30 py-3 px-6">
                                            <CardTitle className="text-sm font-bold">{pm.module}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 w-48">Sub-module</th>
                                                            {roleDefinitions.slice(0, 5).map(r => (
                                                                <th key={r.id} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider p-4 min-w-[100px]">
                                                                    {r.name}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pm.subModules.map((sub, i) => (
                                                            <tr key={sub.name} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-muted/10" : "")}>
                                                                <td className="p-4">
                                                                    <p className="text-sm font-semibold">{sub.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {sub.actions.join(' · ')}
                                                                    </p>
                                                                </td>
                                                                {roleDefinitions.slice(0, 5).map(r => {
                                                                    const perm = r.permissions[pm.module.toLowerCase() as keyof typeof r.permissions];
                                                                    return (
                                                                        <td key={r.id} className="text-center p-4">
                                                                            <div className="flex justify-center">
                                                                                {perm === 'full' ? (
                                                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                                                ) : perm === 'limited' ? (
                                                                                    <div className="h-5 w-5 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
                                                                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                                                    </div>
                                                                                ) : perm === 'view' ? (
                                                                                    <Eye className="h-5 w-5 text-blue-400" />
                                                                                ) : (
                                                                                    <XCircle className="h-5 w-5 text-red-300" />
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ModuleGuard>
        </DashboardShell >
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color?: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <Card className="rounded-2xl border-border/50 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colors[color || ''] || 'bg-primary/10 text-primary')}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
