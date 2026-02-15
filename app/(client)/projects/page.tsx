'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Box, Calendar, ChevronRight, RefreshCcw, Search } from 'lucide-react';
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
          <RefreshCcw className="h-12 w-12 animate-spin text-accent-purple" />
          <p className="font-bold text-muted-foreground">Retrieving Your Files...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Your Deployments</h1>
            <p className="text-muted-foreground font-medium">Monitor project progress and site specifications.</p>
          </div>
          <Button onClick={() => router.push('/projects/new')} className="rounded-2xl bg-primary text-primary-foreground h-12 px-8 font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform">
            <Plus className="mr-2 h-5 w-5" />
            Launch New Project
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-2xl font-bold text-foreground">Project List</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deployments..."
                className="pl-10 rounded-2xl border-none bg-white shadow-sm w-[350px] h-11 font-medium placeholder:text-muted-foreground/50 focus-visible:ring-accent-purple/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6">
            {filteredProjects.map(project => (
              <Card key={project.id} onClick={() => router.push(`/projects/${project.id}`)} className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all duration-500 cursor-pointer">
                <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
                      <Box size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-none shadow-none",
                          project.status === 'completed' ? "bg-emerald-50 text-emerald-700" :
                            project.status === 'pending' ? "bg-amber-50 text-amber-700" :
                              "bg-primary/10 text-primary"
                        )}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={12} />
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="space-y-2 text-right hidden md:block">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <span>Progress</span>
                        <span className="text-foreground">65%</span>
                      </div>
                      <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[65%] rounded-full" />
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-4xl bg-muted/20">
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No projects found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}