'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { createSupportRequest } from '@/lib/api';
import { getProjects } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/db/types';
import { FileUploader } from '@/components/common/file-uploader';

export default function NewSupportRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    attachment_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const data = await getProjects(user?.id);
    setProjects(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);

    const requestId = await createSupportRequest({
      client_id: user.id,
      project_id: formData.project_id || undefined,
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      attachment_url: formData.attachment_url || undefined,
      status: 'open',
    });

    if (requestId) {
      toast.success('Support request created successfully!');
      router.push(`/support/${requestId}`);
    } else {
      toast.error('Failed to create support request');
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/support">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Support Request</h1>
            <p className="text-muted-foreground">Get help from our support team</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Describe your issue or question</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project">Related Project (Optional)</Label>
                <Select
                  value={formData.project_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={loading}
                  rows={6}
                />
              </div>

              {user && (
                <div className="space-y-2">
                  <FileUploader
                    bucket="support"
                    path={`${user.id}/attachments`}
                    onUploadComplete={(url) => setFormData({ ...formData, attachment_url: url })}
                    label="Attachment (Optional)"
                    disabled={loading}
                  />
                  {formData.attachment_url && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      File attached successfully
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/support')}
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
