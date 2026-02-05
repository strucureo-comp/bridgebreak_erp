'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProject, updateProject } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  Server,
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Shield,
  FileText,
  Lock,
  Plus,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Paperclip,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
// import { uploadTicketAttachment } from '@/lib/firebase/storage';
import Link from 'next/link';
import type { Project } from '@/lib/db/types';

export default function ClientProjectCockpitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    attachment: null as File | null
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProject();
    }
  }, [user, params.id]);

  const fetchProject = async () => {
    const data = await getProject(params.id);
    if (data && data.client_id === user?.id) {
      setProject(data);
    } else if (data) {
      router.push('/projects');
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      under_review: 'outline',
      accepted: 'default',
      in_progress: 'default',
      testing: 'outline',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const addTicket = async () => {
    if (!newTicket.title.trim() || !project) return;

    setSubmittingTicket(true);
    let attachmentUrl = undefined;

    if (newTicket.attachment) {
      // attachmentUrl = await uploadTicketAttachment(project.id, newTicket.attachment) || undefined;
      toast.error("File upload is currently disabled.");
    }

    const ticketData = {
      id: Date.now().toString(),
      title: newTicket.title,
      description: newTicket.description,
      attachment_url: attachmentUrl,
      completed: false,
      created_at: new Date().toISOString()
    };

    const tickets = [...(project.tickets || []), ticketData];
    const success = await updateProject(project.id, { tickets });

    if (success) {
      setProject({ ...project, tickets });
      setNewTicket({ title: '', description: '', attachment: null });
      setIsCreateDialogOpen(false);
      toast.success('Support ticket submitted successfully');
    } else {
      toast.error('Failed to submit ticket');
    }
    setSubmittingTicket(false);
  };

  const toggleTicket = async (id: string) => {
    if (!project?.tickets) return;
    const tickets = project.tickets.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    const success = await updateProject(project.id, { tickets });
    if (success) {
      setProject({ ...project, tickets });
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!project) return null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Cockpit</h1>
              <p className="text-muted-foreground">View your project technicals and progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
              <Lock className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">System Secure</span>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">Project Overview</Label>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-8 pt-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">Registration Date</Label>
                  <p className="text-sm font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                {project.github_link && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">Source Code</Label>
                    <a href={project.github_link} target="_blank" className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5 transition-colors">
                      View on GitHub <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Project Health</CardTitle>
                <span className="text-2xl font-bold text-primary">{project.progress_percentage || 0}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Progress value={project.progress_percentage || 0} className="h-2" />
                <p className="text-[10px] text-muted-foreground uppercase font-semibold text-center tracking-tight">Deployment Progress tracked by System Steel Engineering</p>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">Target Deadline</Label>
                  <p className="font-bold text-lg">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'To be determined'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Visual Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3 px-6 flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">Direct Live Environment</span>
            </div>
            {project.live_preview_url && project.live_preview_type === 'url' && (
              <a href={project.live_preview_url} target="_blank" className="text-xs font-medium hover:text-primary flex items-center gap-1.5 transition-colors">
                Full Screen View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardHeader>
          <CardContent className="p-0 bg-neutral-950 aspect-video flex items-center justify-center relative group">
            {project.live_preview_url ? (
              project.live_preview_type === 'url' ? (
                <iframe
                  src={project.live_preview_url}
                  className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
                  title="Live Preview"
                />
              ) : (
                <div className="relative w-full h-full">
                  {/* Using standard img but adding alt for accessibility */}
                  <img src={project.live_preview_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Project Preview" />
                </div>
              )
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 border-2 border-dashed border-neutral-800 rounded-full flex items-center justify-center mx-auto">
                  <Rocket className="h-8 w-8 text-neutral-800" />
                </div>
                <p className="text-neutral-700 font-medium uppercase text-xs tracking-widest">Initializing Cloud Infrastructure...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Technical Configuration Section (Readonly for Client) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Infrastructure & Service Access</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
              <Lock className="h-3 w-3" /> Controlled Read Access
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border rounded-xl overflow-hidden shadow-sm bg-card">
            {/* Infrastructure Column */}
            <div className="p-6 border-r bg-muted/5">
              <div className="flex items-center gap-2 mb-6">
                <Server className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-widest">Primary Infra</h3>
              </div>
              <div className="space-y-5">
                {project.technical_config?.filter(f => f.category === 'infra').map(field => (
                  <ReadOnlyField key={field.id} label={field.label} value={field.value} isLink={field.isLink} isSecret={field.isSecret} />
                )) || <p className="text-[10px] text-muted-foreground italic uppercase">No parameters configured</p>}
              </div>
            </div>

            {/* Administration Column */}
            <div className="p-6 border-r">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-widest">Administration</h3>
              </div>
              <div className="space-y-5">
                {project.technical_config?.filter(f => f.category === 'admin').map(field => (
                  <ReadOnlyField key={field.id} label={field.label} value={field.value} isLink={field.isLink} isSecret={field.isSecret} />
                )) || <p className="text-[10px] text-muted-foreground italic uppercase">No parameters configured</p>}
              </div>
            </div>

            {/* Deployment Column */}
            <div className="p-6 bg-muted/5">
              <div className="flex items-center gap-2 mb-6">
                <Rocket className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-widest">Deployment</h3>
              </div>
              <div className="space-y-5">
                {project.technical_config?.filter(f => f.category === 'deploy').map(field => (
                  <ReadOnlyField key={field.id} label={field.label} value={field.value} isLink={field.isLink} isSecret={field.isSecret} />
                )) || <p className="text-[10px] text-muted-foreground italic uppercase">No parameters configured</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-4 border-b">
              <div className="flex flex-row items-center justify-between w-full">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    PROJECT SUPPORT TICKETS
                    <Badge variant="secondary" className="font-mono text-[10px] h-4 px-1.5">
                      {project.tickets?.filter(t => t.completed).length || 0}/{project.tickets?.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase font-semibold">Report issues or request features</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-9 gap-2">
                        <Plus className="h-4 w-4" />
                        Report Problem
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Submit Support Ticket</DialogTitle>
                        <DialogDescription>
                          Found an issue? Describe it here and our team will fix it.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Issue Title</Label>
                          <Input
                            id="title"
                            placeholder="Briefly describe the problem"
                            value={newTicket.title}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Detailed Description</Label>
                          <Textarea
                            id="description"
                            placeholder="What happened? How can we reproduce it?"
                            rows={4}
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="attachment">Attachment (Optional)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="attachment"
                              type="file"
                              className="hidden"
                              onChange={(e) => setNewTicket(prev => ({ ...prev, attachment: e.target.files?.[0] || null }))}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full gap-2 border-dashed h-10"
                              onClick={() => document.getElementById('attachment')?.click()}
                            >
                              <Paperclip className="h-4 w-4" />
                              {newTicket.attachment ? newTicket.attachment.name : 'Click to upload screenshot'}
                            </Button>
                            {newTicket.attachment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setNewTicket(prev => ({ ...prev, attachment: null }))}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={addTicket}
                          disabled={!newTicket.title.trim() || submittingTicket}
                          className="w-full"
                        >
                          {submittingTicket ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Ticket'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {!project.tickets || project.tickets.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2">
                      <Plus className="h-6 w-6 text-primary/40" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold uppercase tracking-tight">All Issues Resolved</p>
                      <p className="text-xs text-muted-foreground italic">Report any project issues or bugs here. Our team will resolve them.</p>
                    </div>
                  </div>
                ) : (
                  project.tickets.map(ticket => (
                    <div key={ticket.id} className="group flex flex-col p-4 hover:bg-muted/10 transition-colors border-l-4 border-l-transparent hover:border-l-primary/50">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex items-center">
                          {ticket.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${ticket.completed ? 'line-through text-muted-foreground opacity-50' : ''}`}>
                              {ticket.title}
                            </span>
                            {ticket.created_at && (
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {ticket.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                              {ticket.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            {ticket.attachment_url && (
                              <a
                                href={ticket.attachment_url}
                                target="_blank"
                                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline uppercase tracking-wider"
                              >
                                <Paperclip className="h-3 w-3" />
                                View Attachment
                              </a>
                            )}
                            {!ticket.completed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold"
                                onClick={async () => {
                                  const tickets = project.tickets?.filter(t => t.id !== ticket.id);
                                  const success = await updateProject(project.id, { tickets });
                                  if (success) setProject({ ...project, tickets });
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  DEVELOPMENT LOGS
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-semibold">Official project updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2">
                {!project.notes || project.notes.length === 0 ? (
                  <p className="text-sm text-center py-8 text-muted-foreground italic">Initializing project logs...</p>
                ) : (
                  <div className="space-y-4">
                    {project.notes.map((note, i) => (
                      <div key={i} className="flex gap-4 items-start border-l-2 border-primary/20 pl-4 py-1">
                        <p className="text-sm text-muted-foreground italic leading-relaxed">&ldquo;{note}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function ReadOnlyField({ label, value, isLink, isSecret }: { label: string, value?: string, isLink?: boolean, isSecret?: boolean }) {
  const [revealed, setRevealed] = useState(!isSecret);

  return (
    <div className="relative group/field space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">{label}</p>
        {isSecret && value && (
          <button onClick={() => setRevealed(!revealed)} className="text-muted-foreground hover:text-primary transition-colors">
            {revealed ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
          </button>
        )}
      </div>
      {value ? (
        isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" className="text-xs font-mono font-bold text-primary truncate hover:underline block">
            {value}
          </a>
        ) : (
          <p className="text-xs font-mono font-bold text-foreground truncate">
            {revealed ? value : '••••••••••••'}
          </p>
        )
      ) : (
        <p className="text-xs font-mono italic text-muted-foreground/30">Not configured</p>
      )}
    </div>
  );
}
