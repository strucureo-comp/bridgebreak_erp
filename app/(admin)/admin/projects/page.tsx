'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects, updateProject, getUsers, createProject } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
    FolderKanban, 
    ArrowRight, 
    Calendar, 
    DollarSign, 
    Star, 
    Plus, 
    Loader2, 
    Search, 
    Filter, 
    Activity, 
    ChevronRight, 
    Box,
    Clock,
    CheckCircle2,
    RefreshCcw,
    LayoutGrid,
    MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import type { Project, User } from '@/lib/db/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function AdminProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // Create Project State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', client_id: '' });

  useEffect(() => {
    setIsMounted(true);
    if (user?.role === 'admin') fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => ['accepted', 'in_progress', 'testing'].includes(p.status)).length,
    pending: projects.filter(p => p.status === 'pending').length,
    completed: projects.filter(p => p.status === 'completed').length
  }), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    if (clients.length === 0) {
      const users = await getUsers();
      setClients(users.filter(u => u.role === 'client'));
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.client_id) return toast.error('Required fields missing');
    setCreating(true);
    try {
      await createProject(newProject);
      toast.success('Project initialized');
      setIsCreateOpen(false);
      setNewProject({ title: '', description: '', client_id: '' });
      fetchProjects();
    } catch { toast.error('Failed to create project'); }
    finally { setCreating(false); }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Synchronizing Site Data...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-8 pb-12">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Site Deployments</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              Monitor every phase of your engineering projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreate} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Plus className="h-5 w-5 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-[2.5rem] p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-3xl font-black">Launch Project</DialogTitle>
                  <DialogDescription className="text-base">Initialize a new deployment for a verified client.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Assign Client</Label>
                    <Select value={newProject.client_id} onValueChange={(val) => setNewProject({ ...newProject, client_id: val })}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select client profile" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Project Title</Label>
                    <Input placeholder="e.g. Structure Bridge A-10" className="h-12 rounded-xl font-bold" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Deployment Specs</Label>
                    <Textarea placeholder="Describe the scope of work..." className="rounded-xl min-h-[100px]" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProject} disabled={creating} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">
                    {creating ? "Launching..." : "Initialize Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid gap-6 md:grid-cols-4">
            <ProjectKPI title="All Operations" value={stats.total} icon={LayoutGrid} color="slate" />
            <ProjectKPI title="Live Sites" value={stats.active} icon={Activity} color="blue" />
            <ProjectKPI title="New Orders" value={stats.pending} icon={Clock} color="amber" />
            <ProjectKPI title="Completed" value={stats.completed} icon={CheckCircle2} color="emerald" />
        </div>

        <Tabs defaultValue="all" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl">
                    <TabsTrigger value="all" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">All Sites</TabsTrigger>
                    <TabsTrigger value="live" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Live Now</TabsTrigger>
                    <TabsTrigger value="done" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Archived</TabsTrigger>
                </TabsList>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by title or spec..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <TabsContent value="all" className="animate-in fade-in slide-in-from-bottom-2">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map(p => (
                        <ProjectVisualCard key={p.id} project={p} onClick={() => router.push(`/admin/projects/${p.id}`)} />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function ProjectKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100/50",
        slate: "bg-slate-50 text-slate-600 shadow-slate-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}

function ProjectVisualCard({ project, onClick }: { project: Project; onClick: () => void }) {
    const progress = project.status === 'completed' ? 100 : project.status === 'accepted' ? 25 : project.status === 'in_progress' ? 65 : 10;
    
    return (
        <Card onClick={onClick} className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer">
            <CardHeader className="p-10 pb-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Box size={32} />
                    </div>
                    <Badge className={cn(
                        "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none",
                        project.status === 'completed' ? "bg-emerald-50 text-emerald-600" : project.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                        {project.status.replace('_', ' ')}
                    </Badge>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 line-clamp-1">{project.title}</h3>
                    <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed">{project.description || 'No specifications provided.'}</p>
                </div>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Construction Phase</span>
                        <span className="text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full rounded-full transition-all duration-1000", progress === 100 ? "bg-emerald-500" : "bg-primary")} 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                </div>
            </CardContent>
        </Card>
    );
}
