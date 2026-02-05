'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { createProject } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { FileUploader } from '@/components/common/file-uploader';

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    github_link: '',
    document_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);

    const projectId = await createProject({
      client_id: user.id,
      title: formData.title,
      description: formData.description,
      github_link: formData.github_link || undefined,
      document_url: formData.document_url || undefined,
      status: 'pending',
    });

    if (projectId) {
      toast.success('Project created successfully!');
      router.push(`/projects/${projectId}`);
    } else {
      toast.error('Failed to create project');
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
            <p className="text-muted-foreground">Create a new project submission</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Provide information about your project requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="E.g., E-commerce Website"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements, features, and goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={loading}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_link">GitHub Link (Optional)</Label>
                <Input
                  id="github_link"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={formData.github_link}
                  onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  If you have an existing repository or reference materials
                </p>
              </div>

              {user && (
                <div className="space-y-2">
                  <FileUploader
                    bucket="projects"
                    path={`${user.id}/documents`}
                    onUploadComplete={(url) => setFormData({ ...formData, document_url: url })}
                    label="Project Document (BRD, Wireframes, etc.)"
                    disabled={loading}
                  />
                  {formData.document_url && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Document attached successfully
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Project
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/projects')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
