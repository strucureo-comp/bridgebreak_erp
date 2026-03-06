'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
    Plus, Trash2, Edit2, X, Calculator, Database,
    Globe, History as HistoryIcon, ShieldCheck, TrendingUp, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Role { id: number; name: string; users: number; level: string; }
interface UserEntry { id: number; name: string; email: string; role: string; status: 'Active' | 'On Leave' | 'Suspended'; }
interface WorkflowStep { role: string; action: string; }
interface Workflow { id: number; title: string; status: string; stages: number; threshold: string; flow: WorkflowStep[]; }
interface SecurityIntelligence {
    credentialScanActive: boolean;
    geoFencingEnabled: boolean;
    policyEnforcementActive: boolean;
    sessionRotationMinutes: number;
}

interface GlobalSettings { autoEscalation: boolean; parallelApprovals: boolean; mobileSignoff: boolean; }

export interface RolesConfigData {
    roles: Role[];
    users: UserEntry[];
    workflows: Workflow[];
    globalSettings: GlobalSettings;
    intelligence: SecurityIntelligence;
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
    const [intelligence, setIntelligence] = useState<SecurityIntelligence>(value?.intelligence || {
        credentialScanActive: true,
        geoFencingEnabled: true,
        policyEnforcementActive: true,
        sessionRotationMinutes: 15
    });

    const [tab, setTab] = useState('governance');
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
            setIntelligence(value.intelligence || {
                credentialScanActive: true,
                geoFencingEnabled: true,
                policyEnforcementActive: true,
                sessionRotationMinutes: 15
            });
        }
    }, [value]);

    const emit = (patch: Partial<RolesConfigData>) => {
        const full: RolesConfigData = { roles, users, workflows, globalSettings, intelligence, ...patch };
        onChange?.(full);
    };

    const updateGlobal = (key: keyof GlobalSettings, val: boolean) => {
        const updated = { ...globalSettings, [key]: val };
        setGlobalSettings(updated);
        emit({ globalSettings: updated });
        toast.success(`Security Protocol Updated: ${String(key)}`);
    };

    const updateIntelligence = (key: keyof SecurityIntelligence, val: any) => {
        const updated = { ...intelligence, [key]: val };
        setIntelligence(updated);
        emit({ intelligence: updated });
        toast.success(`Security Intelligence Synchronized: ${String(key)}`);
    };

    // Handlers (Simplified for brevity in chunk but maintaining parity)
    const handleAddRole = () => { setEditingRole({ id: 0, name: '', users: 0, level: 'View Only' }); setRoleDialogOpen(true); };
    const handleEditRole = (role: Role) => { setEditingRole({ ...role }); setRoleDialogOpen(true); };
    const handleDeleteRole = (id: number) => {
        const updated = roles.filter(r => r.id !== id);
        setRoles(updated); emit({ roles: updated }); toast.success('Role Permanently Revoked');
    };
    const handleSaveRole = () => {
        if (!editingRole?.name) { toast.error('Identity name required'); return; }
        const updated = editingRole.id ? roles.map(r => r.id === editingRole.id ? editingRole : r) : [...roles, { ...editingRole, id: Date.now() }];
        setRoles(updated); emit({ roles: updated }); setRoleDialogOpen(false); toast.success('Governance Role Synchronized');
    };

    const handleSaveUser = () => {
        if (!editingUser?.name || !editingUser?.email) { toast.error('Credentials incomplete'); return; }
        const updated = editingUser.id ? users.map(u => u.id === editingUser.id ? editingUser : u) : [...users, { ...editingUser, id: Date.now() }];
        setUsers(updated); emit({ users: updated }); setUserDialogOpen(false); toast.success('Identity Provisioned');
    };

    const roleNames = roles.map(r => r.name);

    return (
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="bg-muted/50 border p-1 h-12 rounded-xl mb-4">
                <TabsTrigger value="governance" className="text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Workforce Governance</TabsTrigger>
                <TabsTrigger value="identities" className="text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Identity Access (IAM)</TabsTrigger>
                <TabsTrigger value="protocols" className="text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Approval Protocols</TabsTrigger>
                <TabsTrigger value="intelligence" className="text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Security Intelligence</TabsTrigger>
            </TabsList>

            {/* GOVERNANCE TAB */}
            <TabsContent value="governance" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3">
                        <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-5">
                                <div className="space-y-1">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        Workforce Access Registry
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-10">Global tier-based permissions mapping</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddRole} className="bg-slate-900 hover:bg-slate-800 h-10 text-[10px] uppercase font-black tracking-widest px-6 rounded-lg shadow-sm"><Plus className="h-3.5 w-3.5 mr-2" /> New Access Tier</Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-red-600 group-hover:border-red-500 transition-all">
                                                    <Fingerprint size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-tight text-slate-800">{role.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{role.level} · {role.users} Active Holders</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest h-7 px-4 bg-white border-slate-200 shadow-sm">Tier {role.id.toString().slice(-1)}</Badge>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 text-slate-400 hover:text-red-600 transition-colors bg-slate-100/50 hover:bg-white hover:shadow-sm" onClick={() => handleEditRole(role)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive/40 hover:text-destructive transition-colors bg-red-50/50 hover:bg-white hover:shadow-sm" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        <Card className="bg-slate-900 border-slate-800 text-white p-8 shadow-2xl relative overflow-hidden group rounded-xl">
                            <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Lock className="h-32 w-32" /></div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-4">Security Quotient</h4>
                            <div className="flex items-baseline gap-2 mb-1">
                                <p className="text-5xl font-black">98.4</p>
                                <p className="text-xs font-black text-emerald-500 tracking-tighter">%</p>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Workforce Governance Health</p>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">Privileged Accounts</span>
                                        <span className="text-white">12/42<span className="text-[8px] ml-1 opacity-40">(SAFE)</span></span>
                                    </div>
                                    <Progress value={28} className="h-1.5 bg-slate-800" />
                                </div>
                                <div className="flex justify-between items-center py-3 border-t border-slate-800 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Audit Compliance</span>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest h-5 px-3">Enforced</Badge>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-2 py-8 bg-muted/5">
                            <Database className="h-6 w-6 text-muted-foreground/30" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Artifacts</p>
                            <Button variant="link" size="sm" className="text-[9px] font-black uppercase text-red-600">Archived Logs</Button>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            {/* IDENTITIES TAB */}
            <TabsContent value="identities" className="space-y-6 animate-in fade-in duration-500">
                <Card className="border-border shadow-md rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-5">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
                                    <Users className="h-4 w-4" />
                                </div>
                                Identity & Access Directory
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-10">System-wide credential management and auditing</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                                <Input
                                    placeholder="Search global identities..."
                                    className="h-10 w-72 pl-10 text-[10px] font-black uppercase tracking-widest border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-500/10 rounded-lg"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 h-10 font-black uppercase tracking-widest text-[10px] px-6 rounded-lg shadow-sm" onClick={() => { setEditingUser({ id: 0, name: '', email: '', role: 'Employee', status: 'Active' }); setUserDialogOpen(true); }}>
                                <UserPlus className="h-3.5 w-3.5 mr-2" /> Identity Provisioning
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map((user) => (
                                <div key={user.id} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-all relative group">
                                    <div className="flex items-center gap-6">
                                        <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-red-600 font-black text-xs group-hover:border-red-500 transition-all">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-800">{user.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-16 text-[10px] font-black uppercase tracking-widest">
                                        <div className="min-w-32">
                                            <span className="text-slate-400 block text-[8px] mb-1 opacity-60">Strategic Tier</span>
                                            <span className="text-slate-900">{user.role}</span>
                                        </div>
                                        <div className="min-w-28">
                                            <span className="text-slate-400 block text-[8px] mb-1 opacity-60">Security Trust</span>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-1.5 w-1.5 rounded-full", user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]')} />
                                                <span className={user.status === 'Active' ? 'text-emerald-600 font-black' : 'text-red-500 font-black'}>{user.status}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-400 hover:text-red-600 transition-all bg-slate-100/50 hover:bg-white hover:shadow-sm" onClick={() => { setEditingUser({ ...user }); setUserDialogOpen(true); }}><Settings2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* PROTOCOLS TAB (Approvals) */}
            <TabsContent value="protocols" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-6">
                        {workflows.map((flow) => (
                            <Card key={flow.id} className="border-border shadow-md rounded-xl overflow-hidden bg-white group hover:border-red-200 transition-all duration-300">
                                <div className="px-8 py-6 flex items-center justify-between border-b bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 group-hover:text-red-600 transition-colors">
                                            {flow.title.includes('Payroll') ? <DollarSign className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-900">{flow.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                                                <span>Threshold: {flow.threshold}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="text-red-500/70">Global Policy Enforced</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-6 px-4 bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm">Active Sequence</Badge>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 text-slate-400 hover:text-red-600 transition-all bg-slate-100/30 hover:bg-white hover:shadow-sm" onClick={() => { setEditingFlow({ ...flow }); setIsDialogOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                                <div className="p-8 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                                    {flow.flow.map((step: WorkflowStep, idx: number) => (
                                        <div key={idx} className="flex items-center gap-6 shrink-0">
                                            <div className="flex flex-col items-center gap-2 group/step relative">
                                                <div className="w-28 px-4 py-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center text-center space-y-2 hover:border-red-500 hover:shadow-md transition-all cursor-pointer">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">STAGE 0{idx + 1}</span>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate w-full px-1">{step.role || 'ANY'}</p>
                                                    <Badge variant="secondary" className="text-[8px] font-black uppercase h-4 px-2.5 opacity-80 bg-slate-100 text-slate-600 border-none">{step.action || 'AUTHORIZE'}</Badge>
                                                </div>
                                            </div>
                                            {idx < flow.flow.length - 1 && (
                                                <div className="relative h-px w-8 bg-slate-100 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-red-200 to-slate-100 opacity-30" />
                                                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 relative z-10" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="h-20 w-12 shrink-0 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <Card className="p-5 border-border shadow-sm bg-white">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-red-600 border-b pb-2">Global Constraints</h5>
                            <div className="space-y-5 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 text-left">
                                        <Label className="text-[10px] font-black uppercase leading-none">Auto-Escalation</Label>
                                        <p className="text-[8px] font-medium text-muted-foreground">Move after 48h static</p>
                                    </div>
                                    <Switch checked={globalSettings.autoEscalation} onCheckedChange={(v) => updateGlobal('autoEscalation', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 text-left">
                                        <Label className="text-[10px] font-black uppercase leading-none">Parallel Execution</Label>
                                        <p className="text-[8px] font-medium text-muted-foreground">Allow multi-approver tier</p>
                                    </div>
                                    <Switch checked={globalSettings.parallelApprovals} onCheckedChange={(v) => updateGlobal('parallelApprovals', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 text-left">
                                        <Label className="text-[10px] font-black uppercase leading-none">Biometric Override</Label>
                                        <p className="text-[8px] font-medium text-muted-foreground">Hardware token required</p>
                                    </div>
                                    <Switch checked={globalSettings.mobileSignoff} onCheckedChange={(v) => updateGlobal('mobileSignoff', v)} />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-red-50 border-red-100 p-5">
                            <h5 className="text-[10px] font-black uppercase tracking-widest mb-2 text-red-600">Protocol Engine</h5>
                            <p className="text-[9px] font-medium text-red-800 leading-relaxed mb-4">
                                Workflows ensure compliance with IFRS-9 separation of duties. Any bypass is logged to SOC.
                            </p>
                            <Button variant="outline" className="w-full h-8 text-[9px] font-black uppercase tracking-widest border-red-200 text-red-700 bg-white">Recalibrate All</Button>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            {/* INTELLIGENCE TAB */}
            <TabsContent value="intelligence" className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 border-slate-900 bg-slate-900 text-white shadow-2xl overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-6 transition-transform"><TrendingUp className="h-48 w-48" /></div>
                        <div className="flex items-center justify-between mb-6">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-red-500">Credential Leak monitoring</h5>
                            <Switch checked={intelligence.credentialScanActive} onCheckedChange={(v) => updateIntelligence('credentialScanActive', v)} className="data-[state=checked]:bg-red-600 scale-75" />
                        </div>
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <p className="text-4xl font-black">ZERO</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Critical threats found</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] h-5 border-emerald-400 text-emerald-400">Secure</Badge>
                        </div>
                        <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] h-10">Scan Darkweb Ecosystem</Button>
                    </Card>

                    <Card className="p-8 border-border shadow-md bg-white space-y-8 rounded-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 p-4 opacity-5"><Globe className="h-24 w-24" /></div>
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Login Geo Intelligence</h5>
                            <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
                                <Switch checked={intelligence.geoFencingEnabled} onCheckedChange={(v) => updateIntelligence('geoFencingEnabled', v)} className="data-[state=checked]:bg-red-600 scale-75" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-slate-700 font-mono"><Globe className="h-4 w-4 text-emerald-500" /> UAE.DXB.CORP</span>
                                <Badge className="text-[8px] font-black bg-emerald-500 h-5 px-3 uppercase tracking-widest">92.4% Optimal</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/30 border border-red-100 transition-all hover:bg-white hover:shadow-sm group">
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-red-600 font-mono"><Globe className="h-4 w-4 animate-bounce" /> RU.MSK.EXT</span>
                                <Badge className="text-[8px] font-black bg-red-600 h-5 px-3 uppercase tracking-widest">Anomalous Spike</Badge>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center font-black opacity-50">Protocol: {intelligence.geoFencingEnabled ? 'Automatic Geo-Fence Active' : 'Geo-Fence Standby'}</p>
                        </div>
                    </Card>

                    <Card className="p-6 border-border shadow-sm bg-red-600 text-white relative">
                        <div className="flex items-start justify-between">
                            <ShieldCheck className="h-8 w-8 mb-4 text-white" />
                            <Switch checked={intelligence.policyEnforcementActive} onCheckedChange={(v) => updateIntelligence('policyEnforcementActive', v)} className="data-[state=checked]:bg-white data-[state=unchecked]:bg-red-800 scale-75" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">Policy Enforcer</h3>
                        <p className="text-[10px] font-medium opacity-80 leading-relaxed mb-6">
                            2FA hardware enforcement is {intelligence.policyEnforcementActive ? 'ACTIVE' : 'DISABLED'} for all accounts with level &gt; Execution.
                            Rotating session keys every {intelligence.sessionRotationMinutes} minutes.
                        </p>
                        <div className="h-px bg-white/20 mb-6" />
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Policy Rev: 4.8.2</span>
                            <span className="flex items-center gap-1.5"><HistoryIcon className="h-3 w-3" /> 2h ago</span>
                        </div>
                    </Card>
                </div>
            </TabsContent>

            {/* IDENTITY MODAL */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Shield className="h-16 w-16 text-red-600" /></div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            Identify & Authorize
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Administrative Credential Provisioning Master</DialogDescription>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Legal Asset Identity Name</Label>
                            <Input value={editingUser?.name} onChange={(e) => setEditingUser({ ...editingUser!, name: e.target.value })} placeholder="Full Legal Identity" className="h-11 font-black text-xs uppercase border-slate-100 bg-slate-50/50 focus:bg-white rounded-lg px-4" />
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Corporate Security Email</Label>
                            <Input value={editingUser?.email} onChange={(e) => setEditingUser({ ...editingUser!, email: e.target.value })} placeholder="corporate.auth@enterprise.ae" className="h-11 font-black text-xs border-slate-100 bg-slate-50/50 focus:bg-white rounded-lg px-4" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Access Protocol Tier</Label>
                                <Select value={editingUser?.role} onValueChange={(v) => setEditingUser({ ...editingUser!, role: v })}>
                                    <SelectTrigger className="h-11 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-lg"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roleNames.map(r => (<SelectItem key={r} value={r} className="text-[10px] font-black uppercase">{r}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 pl-1">Trust Validation State</Label>
                                <Select value={editingUser?.status} onValueChange={(v) => setEditingUser({ ...editingUser!, status: v as any })}>
                                    <SelectTrigger className="h-11 font-black text-[10px] uppercase border-slate-100 bg-slate-50/50 rounded-lg"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active" className="text-[10px] font-black uppercase text-emerald-600">Active Trust</SelectItem>
                                        <SelectItem value="Suspended" className="text-[10px] font-black uppercase text-red-600">Suspended / Revoked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="pt-4 border-t flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] border-slate-200" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-[2] bg-slate-900 hover:bg-slate-800 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200" onClick={handleSaveUser}>Authorize & Commit Identity</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}



