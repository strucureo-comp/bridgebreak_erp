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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Paperclip, MessageSquare } from 'lucide-react';
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
    setProjects(data || []);
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
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent-purple/10 hover:text-accent-purple transition-colors">
            <Link href="/support">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/20 text-indigo-600 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              New Support Request
            </h1>
            <p className="text-muted-foreground font-medium ml-14">Get help from our support team</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare size={20} />
                </div>
                Submit New Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Select Project</Label>
                  <Select
                    value={formData.project_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border bg-muted/20 focus:ring-primary/20 font-medium">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Priority</Label>
                  <RadioGroup
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })}
                    className="grid grid-cols-3 gap-4"
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" className="peer sr-only" />
                      <Label htmlFor="low" className="flex flex-col items-center justify-center w-full h-20 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50/50 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-emerald-600 font-black uppercase text-[10px] tracking-widest">Low</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
                      <Label htmlFor="medium" className="flex flex-col items-center justify-center w-full h-20 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-50/50 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-amber-600 font-black uppercase text-[10px] tracking-widest">Medium</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" className="peer sr-only" />
                      <Label htmlFor="high" className="flex flex-col items-center justify-center w-full h-20 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50/50 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-red-600 font-black uppercase text-[10px] tracking-widest">High</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Subject</Label>
                  <Input
                    placeholder="Brief summary of the issue..."
                    className="h-12 rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium placeholder:text-muted-foreground/50"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Description</Label>
                  <Textarea
                    placeholder="Detailed explanation..."
                    className="min-h-[150px] rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium resize-none p-4 placeholder:text-muted-foreground/50"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                {user && (
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Attachments</Label>
                    <FileUploader
                      bucket="support"
                      path={`${user.id}/attachments`}
                      onUploadComplete={(url) => setFormData({ ...formData, attachment_url: url })}
                      label="Upload Files"
                      disabled={loading}
                    />
                    {formData.attachment_url && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1 font-bold">
                        <Paperclip className="h-3 w-3" />
                        File attached successfully
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 h-12 rounded-xl border-border font-bold hover:bg-muted"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
