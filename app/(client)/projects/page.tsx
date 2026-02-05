'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Box, ArrowRight, Calendar, ChevronRight, RefreshCcw, Search, Filter } from 'lucide-react';
import type { Project } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects(user?.id);
      setProjects(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="font-bold text-slate-900">Retrieving Your Files...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Your Deployments</h1>
            <p className="text-slate-500 font-medium">Monitor project progress and site specifications.</p>
          </div>
          <Button onClick={() => router.push('/projects/new')} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <Plus className="mr-2 h-5 w-5" />
            Launch New Project
          </Button>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between ml-2">
                <h2 className="text-2xl font-black text-slate-900">Project List</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search deployments..." 
                        className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(p => (
                    <ProjectVisualCard key={p.id} project={p} onClick={() => router.push(`/projects/${p.id}`)} />
                ))}
                {filteredProjects.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white rounded-[3rem] shadow-sm">
                        <Box size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No matching deployments</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardShell>
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
                    <h3 className="text-2xl font-black text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed">{project.description || 'Project details are being finalized.'}</p>
                </div>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Completion Status</span>
                        <span className="text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full rounded-full transition-all duration-1000", progress === 100 ? "bg-emerald-500" : "bg-primary")} 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
                </div>
            </CardContent>
        </Card>
    );
}