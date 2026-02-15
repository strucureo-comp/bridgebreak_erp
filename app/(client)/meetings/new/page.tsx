'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getProjects, createMeetingRequest } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/db/types';

export default function NewMeetingRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    requested_date: '',
    duration_minutes: '30',
    purpose: '',
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

    const success = await createMeetingRequest({
      client_id: user.id,
      project_id: formData.project_id || undefined,
      requested_date: new Date(formData.requested_date).toISOString(),
      duration_minutes: parseInt(formData.duration_minutes),
      purpose: formData.purpose,
    });

    if (success) {
      toast.success('Meeting request submitted!');
      router.push('/meetings');
    } else {
      toast.error('Failed to submit request');
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent-purple/10 hover:text-accent-purple transition-colors">
            <Link href="/meetings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-orange/20 text-amber-600 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              Request Meeting
            </h1>
            <p className="text-muted-foreground font-medium ml-14">Schedule a meeting with our team</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar size={20} />
                </div>
                Schedule Meeting
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Select Project</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border bg-muted/20 focus:ring-primary/20 font-medium">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Date *</Label>
                    <Input
                      type="date"
                      className="h-12 rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium"
                      value={formData.requested_date.split('T')[0] || ''}
                      onChange={(e) => {
                        const timePart = formData.requested_date.includes('T') ? formData.requested_date.split('T')[1] : '09:00:00.000Z';
                        setFormData({ ...formData, requested_date: `${e.target.value}T${timePart}` });
                      }}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Time *</Label>
                    <Input
                      type="time"
                      className="h-12 rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium"
                      value={formData.requested_date.split('T')[1]?.substring(0, 5) || ''}
                      onChange={(e) => {
                        const date = formData.requested_date.split('T')[0];
                        const newTime = e.target.value;
                        setFormData({ ...formData, requested_date: `${date}T${newTime}:00.000Z` });
                      }}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Duration *</Label>
                  <RadioGroup
                    value={formData.duration_minutes}
                    onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}
                    className="grid grid-cols-3 gap-4"
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="30" id="30min" className="peer sr-only" />
                      <Label htmlFor="30min" className="flex flex-col items-center justify-center w-full h-16 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-foreground font-bold">30 min</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="60" id="60min" className="peer sr-only" />
                      <Label htmlFor="60min" className="flex flex-col items-center justify-center w-full h-16 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-foreground font-bold">1 Hour</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="90" id="90min" className="peer sr-only" />
                      <Label htmlFor="90min" className="flex flex-col items-center justify-center w-full h-16 rounded-2xl border-2 border-muted bg-card peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer hover:bg-muted/20 transition-all">
                        <span className="text-foreground font-bold">1.5 Hours</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground uppercase tracking-widest">Purpose *</Label>
                  <Textarea
                    placeholder="What would you like to discuss?"
                    className="min-h-[100px] rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium resize-none p-4 placeholder:text-muted-foreground/50"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

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
                    Confirm Booking
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
