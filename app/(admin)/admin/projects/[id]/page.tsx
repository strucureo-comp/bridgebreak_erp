'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProject } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ProjectNodeView } from '@/components/admin/project-node-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/db/types';

export default function AdminProjectNodePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProject();
    }
  }, [user, params.id]);

  const fetchProject = async () => {
    const data = await getProject(params.id);
    if (data) {
      setProject(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!project) return null;

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Project Workspace</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Node-Based Project Management</p>
          </div>
        </div>

        <div className="flex-1 min-h-[600px]">
          <ProjectNodeView project={project} onRefresh={fetchProject} />
        </div>
      </div>
    </DashboardShell>
  );
}